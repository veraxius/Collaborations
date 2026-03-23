import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import Groq from "groq-sdk"

export const dynamic = "force-dynamic"

interface TareaIA {
  titulo: string
  descripcion: string
  urgencia: "alta" | "media" | "baja"
  categoria: "operaciones" | "ventas" | "finanzas" | "rrhh" | "tecnologia" | "comunicacion"
  tiempo_estimado: "30 min" | "1 hora" | "2 horas" | "medio día" | "1 día"
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const body = (await request.json().catch(() => ({}))) as { forzar?: boolean }

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

    const inicioSemana = new Date()
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
    inicioSemana.setHours(0, 0, 0, 0)

    if (!body.forzar) {
      const { data: tareasExistentes, error: tareasExistentesError } = await supabase
        .from("tareas")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", inicioSemana.toISOString())

      if (tareasExistentesError) {
        return NextResponse.json({ error: tareasExistentesError.message }, { status: 400 })
      }

      if (tareasExistentes && tareasExistentes.length > 0) {
        return NextResponse.json({ ok: true, data: tareasExistentes, cached: true })
      }
    }

    const { data: analisis } = await supabase
      .from("analisis")
      .select("resultado")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    const { data: profile } = await supabase
      .from("profiles")
      .select("empresa_data")
      .eq("id", user.id)
      .single<{ empresa_data: unknown }>()

    const empresa_data = profile?.empresa_data ?? {}

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `Sos un consultor de negocios experto en gestión de pequeñas empresas.
Generás tareas concretas, específicas y realizables en una semana.
Siempre en español rioplatense.
Respondés SOLO en JSON válido con comillas dobles, sin texto extra, sin markdown, sin backticks.`,
        },
        {
          role: "user",
          content: `Generá exactamente 5 tareas accionables para esta semana.

Empresa: ${JSON.stringify(empresa_data)}
Recomendaciones: ${JSON.stringify((analisis?.resultado as any)?.recomendaciones ?? [])}

Respondé SOLO con este JSON exacto usando comillas dobles:
{
  "tareas": [
    {
      "titulo": "título accionable máximo 8 palabras",
      "descripcion": "qué hacer exactamente en 1 oración clara",
      "urgencia": "alta",
      "categoria": "operaciones",
      "tiempo_estimado": "1 hora"
    }
  ]
}

Valores válidos:
- urgencia: "alta", "media" o "baja"
- categoria: "operaciones", "ventas", "finanzas", "rrhh", "tecnologia" o "comunicacion"
- tiempo_estimado: "30 min", "1 hora", "2 horas", "medio día" o "1 día"`,
        },
      ],
    })

    const texto = completion.choices[0]?.message?.content ?? "{}"
    const limpio = texto
      .replace(/```json|```/g, "")
      .replace(/'/g, '"')
      .trim()

    let resultado: { tareas: TareaIA[] }
    try {
      resultado = JSON.parse(limpio) as { tareas: TareaIA[] }
    } catch {
      return NextResponse.json(
        { error: "La IA devolvió un formato inválido. Intentá de nuevo." },
        { status: 500 }
      )
    }

    const tareasIA = Array.isArray(resultado.tareas) ? resultado.tareas.slice(0, 5) : []

    if (tareasIA.length === 0) {
      return NextResponse.json(
        { error: "No se pudieron generar tareas. Intentá de nuevo." },
        { status: 500 }
      )
    }

    const vence = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const tareasParaGuardar = tareasIA.map((t) => ({
      user_id: user.id,
      titulo: t.titulo,
      descripcion: t.descripcion,
      urgencia: t.urgencia,
      categoria: t.categoria,
      tiempo_estimado: t.tiempo_estimado,
      completada: false,
      vence_at: vence,
    }))

    const { data: insertadas, error: insertError } = await supabase
      .from("tareas")
      .insert(tareasParaGuardar)
      .select("*")

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, data: insertadas })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}