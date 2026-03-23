"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase"
import { ScoreWidget } from "@/components/dashboard/ScoreWidget"
import { ResumenWidget } from "@/components/dashboard/ResumenWidget"
import { RecomendacionesWidget } from "@/components/dashboard/RecomendacionesWidget"
import { MetricasWidget } from "@/components/dashboard/MetricasWidget"
import TareasProgressWidget from "@/components/dashboard/TareasProgressWidget"

const sans = { fontFamily: "'Outfit', sans-serif" }

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
  const supabase = getSupabase()
  const [analisis, setAnalisis] = useState<AnalisisResultado | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalisis = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("analisis")
        .select("resultado")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      const row = data as AnalisisRow | null
      if (row?.resultado) {
        setAnalisis(row.resultado)
      }
      setLoading(false)
    }

    loadAnalisis()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p style={{ ...sans, fontSize: "14px", color: "rgba(13,13,15,0.5)" }}>
          Cargando...
        </p>
      </div>
    )
  }

  const score = analisis?.score ?? 0

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            style={{
              ...sans,
              fontSize: "28px",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "#0D0D0F",
              lineHeight: 1.2,
            }}
          >
            Dashboard
          </h1>
          <p
            style={{
              ...sans,
              fontSize: "13px",
              color: "rgba(13,13,15,0.5)",
              marginTop: "4px",
            }}
          >
            Visión general de tu operación
          </p>
        </div>
        <Button asChild>
          <Link
            href="/dashboard/mejoras"
            style={{ ...sans, fontSize: "13px", fontWeight: 500 }}
          >
            Ver todas
          </Link>
        </Button>
      </div>

      {/* Widgets principales */}
      <ScoreWidget />
      <ResumenWidget />
      <TareasProgressWidget />
      <MetricasWidget />

      {/* Cards de resumen rápido */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="lex-card"
          style={{ animationDelay: "0.05s" }}
        >
          <CardHeader>
            <p
              style={{
                ...sans,
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "rgba(13,13,15,0.6)",
                marginBottom: "6px",
              }}
            >
              Score IA
            </p>
            <CardTitle
              style={{
                ...sans,
                fontSize: "32px",
                fontWeight: 500,
                letterSpacing: "-0.03em",
                color: "#0D0D0F",
                lineHeight: 1,
              }}
            >
              {score}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card
          className="lex-card"
          style={{ animationDelay: "0.1s" }}
        >
          <CardHeader>
            <p
              style={{
                ...sans,
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "rgba(13,13,15,0.6)",
                marginBottom: "6px",
              }}
            >
              Recomendaciones
            </p>
            <CardTitle
              style={{
                ...sans,
                fontSize: "32px",
                fontWeight: 500,
                letterSpacing: "-0.03em",
                color: "#0D0D0F",
                lineHeight: 1,
              }}
            >
              {analisis?.recomendaciones?.length ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card
          className="lex-card"
          style={{ animationDelay: "0.15s" }}
        >
          <CardHeader>
            <p
              style={{
                ...sans,
                fontSize: "11px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "rgba(13,13,15,0.6)",
                marginBottom: "6px",
              }}
            >
              Estado
            </p>
            <CardTitle
              style={{
                ...sans,
                fontSize: "20px",
                fontWeight: 500,
                color: "#0A7B6B",
              }}
            >
              Activo
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Grid Recomendaciones + Chat */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <RecomendacionesWidget />
        </div>
        <div>
          <Card className="lex-card">
            <CardHeader>
              <CardTitle
                style={{
                  ...sans,
                  fontSize: "20px",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: "#0D0D0F",
                }}
              >
                Chat IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p
                style={{
                  ...sans,
                  fontSize: "13px",
                  color: "rgba(13,13,15,0.5)",
                  lineHeight: 1.6,
                }}
              >
                Conversá con Lexora para priorizar acciones y resolver dudas operativas.
              </p>
              <Button
                asChild
                variant="outline"
                style={{ ...sans, fontSize: "13px", fontWeight: 500 }}
              >
                <Link href="/dashboard/chat">Abrir chat</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}