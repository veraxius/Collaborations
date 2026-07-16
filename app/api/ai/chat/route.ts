import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import Groq from "groq-sdk"

export const dynamic = "force-dynamic" // 👈 KEY

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface ProfileData {
  empresa_data: unknown
}

interface AnalisisData {
  resultado: unknown
}

export async function POST(request: Request) {
  try {
    // 🔐 Runtime API KEY validation
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY" },
        { status: 500 }
      )
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    const body = (await request.json()) as {
      mensaje?: string
      historial?: ChatMessage[]
    }

    const mensaje = body.mensaje
    const historial = body.historial ?? []

    if (!mensaje || typeof mensaje !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      )
    }

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("empresa_data")
      .eq("id", user.id)
      .single<ProfileData>()

    const { data: ultimoAnalisis } = await supabase
      .from("analisis")
      .select("resultado")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single<AnalisisData>()

    const empresa_data = profile?.empresa_data ?? {}
    const ultimo_analisis = ultimoAnalisis?.resultado ?? {}

    const esPrimerMensaje = historial.length === 0

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are Lexora, the most advanced AI-powered business consultant for small companies.
Always respond in English.

DATA:
Name: ${(empresa_data as any)?.nombre ?? "Not available"}
Industry: ${(empresa_data as any)?.rubro ?? "Not available"}
Score: ${(ultimo_analisis as any)?.score ?? "No data"}

${
  esPrimerMensaje
    ? "Introduce yourself as Lexora and ask how you can help."
    : "Continue the conversation naturally."
}`,
        },
        ...historial,
        { role: "user", content: mensaje },
      ],
    })

    return NextResponse.json({
      respuesta: completion.choices[0]?.message?.content ?? "",
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}