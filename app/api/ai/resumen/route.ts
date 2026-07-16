import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import Groq from "groq-sdk"

export const dynamic = "force-dynamic"

interface ProfileRow {
  empresa_data: unknown
}

interface AnalisisRow {
  resultado: unknown
}

interface ResumenResult {
  saludo: "Good morning" | "Good afternoon"
  titular: string
  resumen: string
  oportunidad: string
  estado: "critico" | "regular" | "bueno" | "excelente"
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

    const { data: latestAnalisis } = await supabase
      .from("analisis")
      .select("resultado")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single<AnalisisRow>()

    const empresa_data = profile?.empresa_data ?? {}
    const ultimo_analisis = latestAnalisis?.resultado ?? {}

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: `You are a senior business consultant who is an 
      expert in small companies. You write clear, direct and 
      useful executive summaries. Always respond in English.
      Reply ONLY with valid JSON, no extra text, 
      no markdown, no backticks.`,
        },
        {
          role: "user",
          content: `Generate a brief, actionable executive summary 
      for the owner of this company.

      Company data:
      ${JSON.stringify(empresa_data)}

      Previous analysis:
      ${JSON.stringify(ultimo_analisis)}

      Write "titular", "resumen" and "oportunidad" in English, 
      but keep the exact allowed values shown below for 
      "saludo" and "estado".

      Reply ONLY with this exact JSON:
      {
        "saludo": "Good morning" | "Good afternoon" depending on the time of day,
        "titular": "one impactful sentence in English, max 10 words, 
                   about the company's current state",
        "resumen": "2 sentences in English describing the company's 
                   current state, its main strengths 
                   and its biggest challenge",
        "oportunidad": "1 sentence in English about the biggest 
                       improvement opportunity this week",
        "estado": "critico" | "regular" | "bueno" | "excelente"
      }`,
        },
      ],
    })

    const texto = completion.choices[0].message.content ?? "{}"
    const limpio = texto.replace(/```json|```/g, "").trim()
    const resultado = JSON.parse(limpio) as ResumenResult

    return NextResponse.json({ ok: true, data: resultado })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

