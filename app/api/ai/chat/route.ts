import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import Groq from "groq-sdk"

export const dynamic = "force-dynamic" // 👈 CLAVE

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
    // 🔐 Validación de API KEY en runtime
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
        { error: "mensaje es requerido" },
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
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
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
          content: `Sos Lexora, el consultor de negocios con inteligencia artificial más avanzado para pequeñas empresas.

DATOS:
Nombre: ${(empresa_data as any)?.nombre ?? "No disponible"}
Rubro: ${(empresa_data as any)?.rubro ?? "No disponible"}
Score: ${(ultimo_analisis as any)?.score ?? "Sin datos"}

${
  esPrimerMensaje
    ? "Presentate como Lexora y preguntá cómo ayudar."
    : "Continuá la conversación naturalmente."
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
      error instanceof Error ? error.message : "Error desconocido"

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}