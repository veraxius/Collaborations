"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase"
import { useRequireAuth } from "@/hooks/useAuth"
import { ScoreWidget } from "@/components/dashboard/ScoreWidget"
import { ResumenWidget } from "@/components/dashboard/ResumenWidget"
import { RecomendacionesWidget } from "@/components/dashboard/RecomendacionesWidget"
import { MetricasWidget } from "@/components/dashboard/MetricasWidget"
import TareasProgressWidget from "@/components/dashboard/TareasProgressWidget"
import { TrendingUp, MessageSquare, Zap, CheckCircle } from "lucide-react"

interface Recomendacion {
  titulo: string
  impacto: "alto" | "medio" | "bajo"
}

interface AnalisisResultado {
  score: number
  recomendaciones: Recomendacion[]
}

interface AnalisisRow {
  resultado: AnalisisResultado
}

export default function DashboardPage() {
  // Proteger ruta - redirige a login si no hay sesión
  const { user, loading: authLoading } = useRequireAuth()

  const [analisis, setAnalisis] = useState<AnalisisResultado | null>(null)
  const [tareasTotal, setTareasTotal] = useState(0)
  const [tareasCompletadas, setTareasCompletadas] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      const supabase = getSupabase()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const [
        { data: analisisData },
        { count: totalTareasCount },
        { count: completadasCount },
      ] = await Promise.all([
        supabase
          .from("analisis")
          .select("resultado")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("tareas")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("tareas")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completada", true),
      ])

      const row = analisisData as AnalisisRow | null
      if (row?.resultado) {
        setAnalisis(row.resultado)
      }

      setTareasTotal(totalTareasCount ?? 0)
      setTareasCompletadas(completadasCount ?? 0)
      setLoading(false)
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-text-secondary">Cargando... </p>
        </div>
      </div>
    )
  }

  const score = analisis?.score ?? 0
  const recomendacionesCount = analisis?.recomendaciones?.length ?? 0
  const tareasPorcentaje =
    tareasTotal > 0 ? Math.round((tareasCompletadas / tareasTotal) * 100) : 0

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">Visión general de tu operación</p>
        </div>
        <Button asChild className="lex-btn lex-btn-primary">
          <Link href="/dashboard/mejoras">Ver todas las mejoras</Link>
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Score Card */}
        <div className="lex-card-metric">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                Score IA
              </p>
              <p className="text-3xl font-display text-text-primary">{score}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <span className="text-sm text-primary-600 font-medium">+12%</span>
            <span className="text-sm text-text-secondary">vs mes pasado</span>
          </div>
        </div>

        {/* Recomendaciones Card */}
        <div className="lex-card-metric">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                Recomendaciones
              </p>
              <p className="text-3xl font-display text-text-primary">{recomendacionesCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary-50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-secondary-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-text-secondary">{recomendacionesCount} pendientes de revisión</span>
          </div>
        </div>

        {/* Estado Card */}
        <div className="lex-card-metric">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                Estado
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-display text-text-primary">Activo</p>
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="lex-badge lex-badge-success">Todo funcionando</span>
          </div>
        </div>

        {/* Tareas Card */}
        <div className="lex-card-metric">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                Tareas
              </p>
              <p className="text-3xl font-display text-text-primary">
                {tareasCompletadas}/{tareasTotal}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full h-2 bg-border-light rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${tareasPorcentaje}%` }}
              />
            </div>
            <p className="text-sm text-text-secondary mt-2">{tareasPorcentaje}% completado</p>
          </div>
        </div>
      </div>

      {/* Main Widgets */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ScoreWidget />
          <ResumenWidget />
          <TareasProgressWidget />
          <MetricasWidget />
        </div>

        <div className="space-y-6">
          <RecomendacionesWidget />

          {/* Quick Actions Card */}
          <div className="lex-card">
            <h3 className="font-display text-lg text-text-primary mb-4">Acciones rápidas</h3>
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start lex-btn-secondary">
                <Link href="/dashboard/chat">
                  <MessageSquare className="w-4 h-4 mr-2 text-primary-500" />
                  Hablar con IA
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start lex-btn-secondary">
                <Link href="/dashboard/documentos">
                  <Zap className="w-4 h-4 mr-2 text-primary-500" />
                  Subir documentos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
