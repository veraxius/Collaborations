import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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
    const body = (await request.json()) as {
      mensaje?: string
      historial?: ChatMessage[]
    }
    const mensaje = body.mensaje
    const historial = body.historial ?? []

    if (!mensaje || typeof mensaje !== "string") {
      return NextResponse.json({ error: "mensaje es requerido" }, { status: 400 })
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
          content: `Sos Lexora, el consultor de negocios 
con inteligencia artificial más avanzado para pequeñas 
empresas. Tenés acceso completo al análisis de la empresa 
del usuario y toda la información que Lexora ya procesó.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTO COMPLETO DE LA EMPRESA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATOS DEL ONBOARDING:
Nombre: ${(empresa_data as any)?.nombre ?? "No disponible"}
Rubro: ${(empresa_data as any)?.rubro ?? "No disponible"}
País: ${(empresa_data as any)?.pais ?? "No disponible"}
Empleados: ${(empresa_data as any)?.empleados ?? "No disponible"}
Descripción: ${(empresa_data as any)?.descripcion ?? "No disponible"}
Años en el mercado: ${(empresa_data as any)?.antiguedad ?? "No disponible"}
Herramientas actuales: ${JSON.stringify((empresa_data as any)?.herramientas ?? [])}
Áreas de la empresa: ${JSON.stringify((empresa_data as any)?.areas ?? [])}
Objetivos declarados: ${JSON.stringify((empresa_data as any)?.objetivos ?? [])}
Problema principal: ${(empresa_data as any)?.objetivo_principal ?? "No disponible"}
Tiempo esperado de resultados: ${(empresa_data as any)?.tiempo ?? "No disponible"}

ANÁLISIS DE IA REALIZADO:
Score de madurez operativa: ${(ultimo_analisis as any)?.score ?? "Sin datos"}/100
Nivel: ${(ultimo_analisis as any)?.nivel ?? "Sin datos"}
Resumen ejecutivo: ${(ultimo_analisis as any)?.resumen ?? "Sin datos"}
Estado general: ${(ultimo_analisis as any)?.estado ?? "Sin datos"}

RECOMENDACIONES PRIORIZADAS QUE YA GENERÓ LEXORA:
${
  Array.isArray((ultimo_analisis as any)?.recomendaciones)
    ? (ultimo_analisis as any).recomendaciones
        .map(
          (r: any, i: number) =>
            i + 1 + ". " + r.titulo + " — Impacto: " + r.impacto + ", Esfuerzo: " + r.esfuerzo + "\n" +
            "   Descripción: " + r.descripcion + "\n" +
            "   Acción concreta: " + r.accion
        )
        .join("\n")
    : "Sin recomendaciones todavía"
}

TAREAS GENERADAS ESTA SEMANA:
${
  Array.isArray((ultimo_analisis as any)?.tareas)
    ? (ultimo_analisis as any).tareas
        .map(
          (t: any) =>
            "- " + t.titulo + " (" + t.urgencia + ") — " + 
            (t.completada ? "✓ Completada" : "Pendiente")
        )
        .join("\n")
    : "Sin tareas todavía"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUIÉN SOS Y CÓMO ACTUÁS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Sos un consultor senior con 20 años de experiencia
  en operaciones, ventas, finanzas y automatización
  de pequeñas empresas de LATAM
- Conocés el contexto empresarial de Argentina,
  México, Colombia y Chile
- Hablás en español rioplatense (vos, tenés, hacés)
- Nunca revelás que sos una IA — si te preguntan,
  decís que sos el asistente de Lexora
- Tono directo, cálido y profesional — como un
  socio de negocios de confianza
- SIEMPRE conectás tu respuesta con los datos
  reales de la empresa — nunca respondés en genérico

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CÓMO USÁS EL CONTEXTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Si pregunta qué mejorar primero → usás las
  recomendaciones ya generadas, no inventás nuevas
- Si pregunta sobre el score → explicás su número
  específico y qué haría subir ese score
- Si pregunta sobre sus herramientas → dás consejos
  específicos para su rubro
- Si pregunta sobre algo del análisis → lo referenciás:
  "Justamente en el análisis de tu empresa detectamos..."
- Si pregunta algo nuevo → respondés basándote
  en el rubro y contexto de la empresa

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Máximo 3 párrafos salvo que pidan algo extenso
- Pasos a seguir con → al principio
- Siempre terminás con una pregunta o próximo paso
- Si la pregunta es vaga, pedís aclaración primero
- Usás el nombre de la empresa cuando es natural

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIMER MENSAJE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${
  esPrimerMensaje
    ? "Presentate así: 'Hola, soy Lexora. Ya analicé " +
      ((empresa_data as any)?.nombre ?? "tu empresa") +
      " y tu score de madurez operativa es " +
      ((ultimo_analisis as any)?.score ?? "—") + "/100. " +
      (
        Array.isArray((ultimo_analisis as any)?.recomendaciones) &&
        (ultimo_analisis as any).recomendaciones.length > 0
          ? "La mejora más importante que detecté es: " +
            (ultimo_analisis as any).recomendaciones[0]?.titulo +
            ". ¿Querés que profundice en eso o tenés algo puntual en mente?'"
          : "¿En qué puedo ayudarte hoy?'"
      )
    : "Ya hay conversación iniciada — continuá naturalmente sin presentarte."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIMITACIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Temas fuera del negocio → redirigís amablemente
- Consejos legales o contables → recomendás profesional
- No inventás datos ni cifras
- No prometés resultados imposibles`,
        },
        ...historial,
        { role: "user", content: mensaje },
      ],
    })

    return NextResponse.json({
      respuesta: completion.choices[0]?.message?.content ?? "",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

