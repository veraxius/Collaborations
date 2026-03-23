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
  saludo: "Buenos días" | "Buenas tardes"
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
          content: `Sos un consultor de negocios senior experto 
      en pequeñas empresas. Escribís resúmenes ejecutivos 
      claros, directos y útiles. Siempre en español.
      Respondés SOLO en JSON válido, sin texto extra, 
      sin markdown, sin backticks.`,
        },
        {
          role: "user",
          content: `Generá un resumen ejecutivo breve y accionable 
      para el dueño de esta empresa.

      Datos de la empresa:
      ${JSON.stringify(empresa_data)}

      Análisis previo:
      ${JSON.stringify(ultimo_analisis)}

      Respondé SOLO con este JSON exacto:
      {
        "saludo": "Buenos días" | "Buenas tardes" según hora,
        "titular": "una oración impactante de máximo 10 palabras 
                   sobre el estado actual de la empresa",
        "resumen": "2 oraciones que describen el estado actual 
                   de la empresa, sus fortalezas principales 
                   y el mayor desafío",
        "oportunidad": "1 oración sobre la mayor oportunidad 
                       de mejora esta semana",
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
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

