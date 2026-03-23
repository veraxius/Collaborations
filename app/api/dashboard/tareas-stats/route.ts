import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

interface TareaStat {
  semana: string
  completadas: number
  pendientes: number
  total: number
}

interface TareasStatsResponse {
  ok: boolean
  data: TareaStat[]
  porcentaje: number
  completadasEstaSemana: number
  totalEstaSemana: number
}

export async function GET(): Promise<NextResponse<TareasStatsResponse | { error: string }>> {
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

    const semanas: Array<{
      inicio: Date
      fin: Date
      label: string
    }> = []

    for (let i = 3; i >= 0; i--) {
      const inicio = new Date()
      inicio.setDate(inicio.getDate() - inicio.getDay() - i * 7)
      inicio.setHours(0, 0, 0, 0)

      const fin = new Date(inicio)
      fin.setDate(fin.getDate() + 7)

      const label = i === 0 ? "Esta sem." : i === 1 ? "Sem. pasada" : `Hace ${i} sem.`
      semanas.push({ inicio, fin, label })
    }

    const stats: TareaStat[] = []

    for (const semana of semanas) {
      const { data } = await supabase
        .from("tareas")
        .select("completada")
        .eq("user_id", user.id)
        .gte("created_at", semana.inicio.toISOString())
        .lt("created_at", semana.fin.toISOString())

      const completadas = (data ?? []).filter((t) => t.completada).length
      const total = data?.length ?? 0
      const pendientes = Math.max(0, total - completadas)

      stats.push({
        semana: semana.label,
        completadas,
        pendientes,
        total,
      })
    }

    const semanaActual = stats[stats.length - 1]
    const totalEstaSemana = semanaActual?.total ?? 0
    const completadasEstaSemana = semanaActual?.completadas ?? 0
    const porcentaje =
      totalEstaSemana > 0
        ? Math.round((completadasEstaSemana / totalEstaSemana) * 100)
        : 0

    const response: TareasStatsResponse = {
      ok: true,
      data: stats,
      porcentaje,
      completadasEstaSemana,
      totalEstaSemana,
    }

    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

