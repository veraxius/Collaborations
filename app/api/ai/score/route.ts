import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import Groq from "groq-sdk"

export const dynamic = "force-dynamic"

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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
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
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST() {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const supabase = await getServerSupabase()
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
      return NextResponse.json(
        { error: "No previous analysis available to compute the score" },
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
          content: `You are a business consultant who is an expert 
      in analyzing small companies. Reply ONLY with valid JSON, 
      no extra text, no markdown, no backticks.
      Always respond in English.`,
        },
        {
          role: "user",
          content: `Analyze this company and generate an operational 
      maturity score.

      Company data:
      ${JSON.stringify(empresa_data)}

      Previous analysis:
      ${JSON.stringify(ultimo_analisis)}

      Write "resumen" in English, but keep the exact allowed 
      values shown below for "nivel" and "color".

      Reply ONLY with this exact JSON:
      {
        "score": number from 1 to 100,
        "variacion": positive or negative number vs the previous month 
                     (use 0 if there is no history),
        "nivel": "inicial" | "en desarrollo" | "consolidado" | 
                 "avanzado" | "excelente",
        "resumen": "max 2 sentences in English about the company's 
                   current state",
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
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

