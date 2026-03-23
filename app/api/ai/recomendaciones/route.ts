import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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

    const { data: latestAnalisis, error: analisisError } = await supabase
      .from("analisis")
      .select("id, resultado")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single<AnalisisRow>()

    if (analisisError || !latestAnalisis) {
      return NextResponse.json({ error: "Sin análisis previo" }, { status: 404 })
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
          content: `Sos un consultor de negocios experto en 
      optimización de pequeñas empresas. Generás 
      recomendaciones concretas, priorizadas y accionables.
      Siempre en español. Respondés SOLO en JSON válido, 
      sin texto extra, sin markdown, sin backticks.`,
        },
        {
          role: "user",
          content: `Generá exactamente 5 recomendaciones de mejora 
      priorizadas para esta empresa.

      Datos de la empresa:
      ${JSON.stringify(empresa_data)}

      Análisis previo:
      ${JSON.stringify(ultimo_analisis)}

      Respondé SOLO con este JSON exacto:
      {
        "recomendaciones": [
          {
            "id": 1,
            "titulo": "título corto máximo 6 palabras",
            "descripcion": "2 oraciones: el problema y la solución",
            "impacto": "alto" | "medio" | "bajo",
            "esfuerzo": "alto" | "medio" | "bajo",
            "categoria": "operaciones" | "ventas" | "finanzas" | 
                         "rrhh" | "tecnologia" | "comunicacion",
            "accion": "primer paso concreto esta semana 
                      máximo 10 palabras"
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
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

