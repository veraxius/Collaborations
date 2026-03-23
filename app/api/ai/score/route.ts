import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface ProfileRow {
  empresa_data: unknown
}

interface AnalisisRow {
  id: string
  resultado: Record<string, unknown> | null
}

interface ScoreResult {
  score: number
  variacion: number
  nivel: "inicial" | "en desarrollo" | "consolidado" | "avanzado" | "excelente"
  resumen: string
  color: "rojo" | "amarillo" | "verde"
}

async function getServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
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
}

export async function GET() {
  try {
    const supabase = await getServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data } = await supabase
      .from("analisis")
      .select("resultado")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single<{ resultado: Record<string, unknown> | null }>()

    const result = data?.resultado ?? null
    if (!result || typeof result.score !== "number") {
      return NextResponse.json({ ok: true, data: null })
    }

    return NextResponse.json({
      ok: true,
      data: {
        score: Number(result.score),
        variacion: Number(result.score_variacion ?? 0),
        nivel: (result.score_nivel ?? "en desarrollo") as ScoreResult["nivel"],
        resumen: String(result.resumen ?? ""),
        color: (result.score_color ?? "amarillo") as ScoreResult["color"],
      } satisfies ScoreResult,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await getServerSupabase()
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
      return NextResponse.json(
        { error: "No hay análisis previo para calcular el score" },
        { status: 400 }
      )
    }

    const empresa_data = profile?.empresa_data ?? {}
    const ultimo_analisis = latestAnalisis.resultado ?? {}

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `Sos un consultor de negocios experto en 
      analizar pequeñas empresas. Respondés SOLO en JSON 
      válido, sin texto extra, sin markdown, sin backticks.
      Siempre en español.`,
        },
        {
          role: "user",
          content: `Analizá esta empresa y generá un score de 
      madurez operativa.

      Datos de la empresa:
      ${JSON.stringify(empresa_data)}

      Análisis previo:
      ${JSON.stringify(ultimo_analisis)}

      Respondé SOLO con este JSON exacto:
      {
        "score": número del 1 al 100,
        "variacion": número positivo o negativo vs mes anterior 
                     (si no hay historial ponés 0),
        "nivel": "inicial" | "en desarrollo" | "consolidado" | 
                 "avanzado" | "excelente",
        "resumen": "2 oraciones máximo sobre el estado actual 
                   de la empresa",
        "color": "rojo" | "amarillo" | "verde"
      }`,
        },
      ],
    })

    const texto = completion.choices[0].message.content ?? "{}"
    const limpio = texto.replace(/```json|```/g, "").trim()
    const resultado = JSON.parse(limpio) as ScoreResult

    const previous = latestAnalisis.resultado ?? {}
    const mergedResult = {
      ...previous,
      score: resultado.score,
      resumen: resultado.resumen,
      score_variacion: resultado.variacion,
      score_nivel: resultado.nivel,
      score_color: resultado.color,
    }

    const { error: updateError } = await supabase
      .from("analisis")
      .update({ resultado: mergedResult })
      .eq("id", latestAnalisis.id)
      .eq("user_id", user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, data: resultado })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

