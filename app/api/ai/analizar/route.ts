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
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
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

      // Word y Excel binarios — no intentar leer
      if (isWord) {
        fragments.push(`[${file.name}] Documento Word subido por el usuario.`)
        continue
      }
      if (isExcel) {
        fragments.push(`[${file.name}] Documento Excel subido por el usuario.`)
        continue
      }

      // Archivos de texto y PDF — intentar leer
      if (isText || isPdf) {
        const { data: blobData, error: downloadError } = await supabase.storage
          .from("documentos")
          .download(fullPath)

        if (downloadError) {
          fragments.push(`[${file.name}] No se pudo leer el archivo.`)
          continue
        }

        try {
          const raw = await blobData.text()
          const sanitized = sanitizeText(raw)

          if (isReadableText(sanitized)) {
            fragments.push(`[${file.name}]\n${sanitized}`)
          } else {
            // PDF con contenido binario ilegible — no mandarlo al prompt
            fragments.push(
              isPdf
                ? `[${file.name}] Documento PDF subido por el usuario.`
                : `[${file.name}] Archivo subido por el usuario.`
            )
          }
        } catch {
          fragments.push(
            isPdf
              ? `[${file.name}] Documento PDF subido por el usuario.`
              : `[${file.name}] Archivo subido por el usuario.`
          )
        }
        continue
      }

      fragments.push(`[${file.name}] Archivo subido por el usuario.`)
    }

    const contenido_documentos =
      fragments.length > 0
        ? fragments.join("\n\n")
        : "No hay documentos disponibles."

    const empresa_data = profile?.empresa_data ?? {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ed = empresa_data as any

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `Sos un consultor de negocios experto en optimización y automatización de procesos para pequeñas empresas.
Analizás la información de una empresa y generás recomendaciones concretas, priorizadas y accionables.
Siempre respondés en español.
Respondés SOLO en JSON válido, sin texto extra, sin markdown, sin backticks.`,
        },
        {
          role: "user",
          content: `Analizá esta empresa en profundidad y generá exactamente 5 recomendaciones de mejora priorizadas.

INFORMACIÓN DE LA EMPRESA:
Nombre: ${ed?.nombre ?? "No especificado"}
Rubro: ${ed?.rubro ?? "No especificado"}
Descripción: ${ed?.descripcion ?? "No especificada"}
País: ${ed?.pais ?? "No especificado"}
Años en el mercado: ${ed?.antiguedad ?? "No especificado"}
Cantidad de empleados: ${ed?.empleados ?? "No especificado"}
Sitio web: ${ed?.web ?? "No tiene"}

Áreas de la empresa: ${JSON.stringify(ed?.areas ?? [])}
Herramientas que usan hoy: ${JSON.stringify(ed?.herramientas ?? [])}
Objetivos declarados: ${JSON.stringify(ed?.objetivos ?? [])}
Principal problema a resolver: ${ed?.objetivo_principal ?? "No especificado"}
Tiempo esperado para ver resultados: ${ed?.tiempo ?? "No especificado"}

DOCUMENTOS Y PROCESOS SUBIDOS:
${contenido_documentos}

INSTRUCCIONES:
- Usá los objetivos declarados como guía principal
- Considerá las herramientas que ya usan
- Tené en cuenta el rubro para dar recomendaciones relevantes
- El score debe reflejar la madurez operativa real
- Las recomendaciones deben ser accionables para ese tamaño y rubro
- El primer paso debe ser realizable esta semana sin costo o costo mínimo

Respondé SOLO con este JSON, sin texto extra, sin markdown, sin backticks:
{
  "empresa": "nombre de la empresa",
  "resumen": "resumen ejecutivo de 2 oraciones",
  "score": número del 1 al 100,
  "recomendaciones": [
    {
      "id": 1,
      "titulo": "título corto máximo 6 palabras",
      "descripcion": "2-3 oraciones explicando el problema y solución",
      "impacto": "alto",
      "esfuerzo": "bajo",
      "categoria": "operaciones",
      "accion": "primer paso concreto esta semana"
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
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}