import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import Groq from "groq-sdk"

export const dynamic = "force-dynamic"

interface Recomendacion {
  id: number
  titulo: string
  descripcion: string
  impacto: "alto" | "medio" | "bajo"
  esfuerzo: "alto" | "medio" | "bajo"
  categoria: string
  accion: string
}

interface ProfileRow {
  empresa_data: unknown
}

interface AnalisisRow {
  id: string
  resultado: Record<string, unknown> | null
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

    const { data: latestAnalisis, error: analisisError } = await supabase
      .from("analisis")
      .select("id, resultado")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single<AnalisisRow>()

    if (analisisError || !latestAnalisis) {
      return NextResponse.json({ error: "No previous analysis" }, { status: 404 })
    }

    const previousResult = latestAnalisis.resultado ?? {}
    const existing = previousResult.recomendaciones
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ ok: true, data: existing })
    }

    const empresa_data = profile?.empresa_data ?? {}
    const ultimo_analisis = latestAnalisis.resultado ?? {}

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are a business consultant who is an expert in 
      small business optimization. You generate concrete, 
      prioritized, actionable recommendations.
      Always respond in English. Reply ONLY with valid JSON, 
      no extra text, no markdown, no backticks.`,
        },
        {
          role: "user",
          content: `Generate exactly 5 prioritized improvement 
      recommendations for this company.

      Company data:
      ${JSON.stringify(empresa_data)}

      Previous analysis:
      ${JSON.stringify(ultimo_analisis)}

      Write all text values in English, but keep the exact allowed 
      values shown below for "impacto", "esfuerzo" and "categoria".

      Reply ONLY with this exact JSON:
      {
        "recomendaciones": [
          {
            "id": 1,
            "titulo": "short title, max 6 words, in English",
            "descripcion": "2 sentences in English: the problem and the solution",
            "impacto": "alto" | "medio" | "bajo",
            "esfuerzo": "alto" | "medio" | "bajo",
            "categoria": "operaciones" | "ventas" | "finanzas" | 
                         "rrhh" | "tecnologia" | "comunicacion",
            "accion": "concrete first step for this week, 
                      max 10 words, in English"
          }
        ]
      }`,
        },
      ],
    })

    const texto = completion.choices[0].message.content ?? "{}"
    const limpio = texto.replace(/```json|```/g, "").trim()
    const resultado = JSON.parse(limpio) as { recomendaciones: Recomendacion[] }

    const merged = {
      ...previousResult,
      recomendaciones: resultado.recomendaciones,
    }

    const { error: updateError } = await supabase
      .from("analisis")
      .update({ resultado: merged })
      .eq("id", latestAnalisis.id)
      .eq("user_id", user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, data: resultado.recomendaciones })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

