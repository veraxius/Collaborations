import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import Groq from "groq-sdk"

export const dynamic = "force-dynamic"

interface ProfileRow {
  empresa_data: unknown
}

interface RecomendacionIA {
  id: number
  titulo: string
  descripcion: string
  impacto: "alto" | "medio" | "bajo"
  esfuerzo: "alto" | "medio" | "bajo"
  categoria:
    | "operaciones"
    | "ventas"
    | "finanzas"
    | "rrhh"
    | "tecnologia"
    | "comunicacion"
  accion: string
}

interface AnalisisIA {
  empresa: string
  resumen: string
  score: number
  recomendaciones: RecomendacionIA[]
}

function isReadableText(text: string): boolean {
  const cleaned = text.replace(/\s+/g, " ").trim()
  if (cleaned.length < 20) return false
  const readableChars = cleaned.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9.,;:!?()]/g)?.length ?? 0
  const ratio = readableChars / cleaned.length
  return ratio > 0.6
}

function sanitizeText(text: string): string {
  return text
    .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000)
}

export async function POST() {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("empresa_data")
      .eq("id", user.id)
      .single<ProfileRow>()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    const { data: files, error: filesError } = await supabase.storage
      .from("documentos")
      .list(user.id, { limit: 100, sortBy: { column: "name", order: "asc" } })

    if (filesError) {
      return NextResponse.json({ error: filesError.message }, { status: 400 })
    }

    const fragments: string[] = []

    for (const file of files ?? []) {
      if (file.name === ".emptyFolderPlaceholder") continue

      const lowerName = file.name.toLowerCase()
      const isWord = lowerName.endsWith(".doc") || lowerName.endsWith(".docx")
      const isExcel = lowerName.endsWith(".xls") || lowerName.endsWith(".xlsx")
      const isPdf = lowerName.endsWith(".pdf")
      const isText = [".txt", ".csv", ".md", ".json"].some((ext) =>
        lowerName.endsWith(ext)
      )
      const fullPath = `${user.id}/${file.name}`

      // Binary Word and Excel files — do not attempt to read
      if (isWord) {
        fragments.push(`[${file.name}] Word document uploaded by the user.`)
        continue
      }
      if (isExcel) {
        fragments.push(`[${file.name}] Excel document uploaded by the user.`)
        continue
      }

      // Text files and PDFs — attempt to read
      if (isText || isPdf) {
        const { data: blobData, error: downloadError } = await supabase.storage
          .from("documentos")
          .download(fullPath)

        if (downloadError) {
          fragments.push(`[${file.name}] The file could not be read.`)
          continue
        }

        try {
          const raw = await blobData.text()
          const sanitized = sanitizeText(raw)

          if (isReadableText(sanitized)) {
            fragments.push(`[${file.name}]\n${sanitized}`)
          } else {
            // PDF with unreadable binary content — do not send it to the prompt
            fragments.push(
              isPdf
                ? `[${file.name}] PDF document uploaded by the user.`
                : `[${file.name}] File uploaded by the user.`
            )
          }
        } catch {
          fragments.push(
            isPdf
              ? `[${file.name}] PDF document uploaded by the user.`
              : `[${file.name}] File uploaded by the user.`
          )
        }
        continue
      }

      fragments.push(`[${file.name}] File uploaded by the user.`)
    }

    const contenido_documentos =
      fragments.length > 0
        ? fragments.join("\n\n")
        : "No documents available."

    const empresa_data = profile?.empresa_data ?? {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ed = empresa_data as any

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are a business consultant who is an expert in process optimization and automation for small companies.
You analyze a company's information and generate concrete, prioritized, actionable recommendations.
Always respond in English.
Reply ONLY with valid JSON, no extra text, no markdown, no backticks.`,
        },
        {
          role: "user",
          content: `Analyze this company in depth and generate exactly 5 prioritized improvement recommendations.

COMPANY INFORMATION:
Name: ${ed?.nombre ?? "Not specified"}
Industry: ${ed?.rubro ?? "Not specified"}
Description: ${ed?.descripcion ?? "Not specified"}
Country: ${ed?.pais ?? "Not specified"}
Years in the market: ${ed?.antiguedad ?? "Not specified"}
Number of employees: ${ed?.empleados ?? "Not specified"}
Website: ${ed?.web ?? "None"}

Company areas: ${JSON.stringify(ed?.areas ?? [])}
Tools they use today: ${JSON.stringify(ed?.herramientas ?? [])}
Stated goals: ${JSON.stringify(ed?.objetivos ?? [])}
Main problem to solve: ${ed?.objetivo_principal ?? "Not specified"}
Expected time to see results: ${ed?.tiempo ?? "Not specified"}

UPLOADED DOCUMENTS AND PROCESSES:
${contenido_documentos}

INSTRUCTIONS:
- Use the stated goals as the main guide
- Consider the tools they already use
- Take the industry into account to give relevant recommendations
- The score must reflect the company's real operational maturity
- Recommendations must be actionable for that size and industry
- The first step must be doable this week at no or minimal cost
- Write all text values in English, but keep the exact allowed values shown below for "impacto", "esfuerzo" and "categoria"

Reply ONLY with this JSON, no extra text, no markdown, no backticks:
{
  "empresa": "company name",
  "resumen": "2-sentence executive summary in English",
  "score": number from 1 to 100,
  "recomendaciones": [
    {
      "id": 1,
      "titulo": "short title, max 6 words, in English",
      "descripcion": "2-3 sentences in English explaining the problem and solution",
      "impacto": "alto" | "medio" | "bajo",
      "esfuerzo": "alto" | "medio" | "bajo",
      "categoria": "operaciones" | "ventas" | "finanzas" | "rrhh" | "tecnologia" | "comunicacion",
      "accion": "concrete first step for this week, in English"
    }
  ]
}`,
        },
      ],
    })

    const texto = completion.choices[0]?.message?.content ?? "{}"
    const limpio = texto.replace(/```json|```/g, "").trim()
    const resultado = JSON.parse(limpio) as AnalisisIA

    const { error: insertError } = await supabase.from("analisis").insert({
      user_id: user.id,
      resultado,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, data: resultado })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}