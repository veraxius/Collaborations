import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

interface AnalisisRow {
  created_at: string
  resultado: Record<string, unknown> | null
}

interface Metricas {
  documentosAnalizados: number
  tareasPendientes: number
  ultimoAnalisis: string
  variacionScore: number
}

function formatearFecha(fecha: string): string {
  const date = new Date(fecha)
  const ahora = new Date()
  const diffMs = ahora.getTime() - date.getTime()
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDias = Math.floor(diffHoras / 24)

  if (diffHoras < 1) return "Hace menos de 1 hora"
  if (diffHoras < 24) return `Hace ${diffHoras} horas`
  if (diffDias === 1) return "Ayer"
  if (diffDias < 7) return `Hace ${diffDias} días`
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
}

export async function GET() {
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

    const [documentosRes, analisisRes, tareasRes, analisisAnteriorRes] = await Promise.all([
      supabase.storage.from("documentos").list(user.id),
      supabase
        .from("analisis")
        .select("created_at, resultado")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single<AnalisisRow>(),
      // Si la tabla no existe, devolveremos 0 más abajo
      supabase.from("tareas").select("id", { count: "exact" }).eq("user_id", user.id).eq("completada", false),
      supabase
        .from("analisis")
        .select("resultado")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(2),
    ])

    const documentosAnalizados = Array.isArray(documentosRes.data) ? documentosRes.data.length : 0

    const scoreActual =
      (analisisRes.data?.resultado && typeof analisisRes.data.resultado === "object"
        ? Number((analisisRes.data.resultado as any).score ?? 0)
        : 0) || 0

    const prevArr = Array.isArray(analisisAnteriorRes.data) ? (analisisAnteriorRes.data as AnalisisRow[]) : []
    const scoreAnterior =
      prevArr[1]?.resultado && typeof prevArr[1].resultado === "object"
        ? Number((prevArr[1].resultado as any).score ?? 0)
        : 0

    const variacionScore = scoreActual - scoreAnterior
    const ultimoAnalisis = analisisRes.data?.created_at
      ? formatearFecha(analisisRes.data.created_at)
      : "Sin análisis"

    // Tareas: si la tabla no existe u ocurre error, devolver 0
    // TODO: crear tabla tareas en Supabase cuando se implemente el módulo de tareas
    const tareasPendientes =
      tareasRes.error || typeof tareasRes.count !== "number" ? 0 : Math.max(0, tareasRes.count)

    const payload: Metricas = {
      documentosAnalizados,
      tareasPendientes,
      ultimoAnalisis,
      variacionScore,
    }

    return NextResponse.json({ ok: true, data: payload })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    // En caso de falla, responder métricas con ceros para no romper el widget
    const fallback: Metricas = {
      documentosAnalizados: 0,
      tareasPendientes: 0,
      ultimoAnalisis: "Sin análisis",
      variacionScore: 0,
    }
    return NextResponse.json({ ok: true, data: fallback, warning: message })
  }
}

