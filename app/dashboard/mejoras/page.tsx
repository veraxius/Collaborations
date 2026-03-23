"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Recomendacion {
  id: number
  titulo: string
  descripcion: string
  impacto: "alto" | "medio" | "bajo"
  esfuerzo: "alto" | "medio" | "bajo"
  categoria: string
  accion: string
}

interface AnalisisResultado {
  empresa: string
  resumen: string
  score: number
  recomendaciones: Recomendacion[]
}

interface AnalisisRow {
  id: string
  created_at: string
  resultado: AnalisisResultado
}

export default function MejorasPage() {
  const supabase = getSupabase()
  const [analisis, setAnalisis] = useState<AnalisisResultado | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalisis = async () => {
    setError(null)
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("No autenticado.")
        return
      }

      const { data, error: queryError } = await supabase
        .from("analisis")
        .select("id, created_at, resultado")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      const row = data as AnalisisRow | null

      if (queryError || !row) {
        setAnalisis(null)
        return
      }

      setAnalisis(row.resultado)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalisis()
  }, [])

  const triggerAnalisis = async () => {
    setError(null)
    setRunning(true)
    try {
      const response = await fetch("/api/ai/analizar", { method: "POST" })
      const body = (await response.json()) as {
        ok?: boolean
        data?: AnalisisResultado
        error?: string
      }
      if (!response.ok || !body.ok || !body.data) {
        throw new Error(body.error || "No se pudo generar el análisis")
      }
      setAnalisis(body.data)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Error desconocido"
      setError(message)
    } finally {
      setRunning(false)
    }
  }

  const impactoBadge = (impacto: Recomendacion["impacto"]) => {
    if (impacto === "alto") return "bg-[rgba(10,123,107,0.1)] text-[var(--teal)]"
    if (impacto === "medio") return "bg-[rgba(201,168,76,0.12)] text-[#8a6d1e]"
    return "bg-[var(--paper-2)] text-[var(--ink-60)]"
  }

  const esfuerzoClass = (esfuerzo: Recomendacion["esfuerzo"]) => {
    if (esfuerzo === "alto") return "bg-[rgba(232,80,58,0.1)] text-[var(--red-soft)]"
    if (esfuerzo === "medio") return "bg-[rgba(201,168,76,0.12)] text-[#8a6d1e]"
    return "bg-[rgba(10,123,107,0.1)] text-[var(--teal)]"
  }

  if (loading) {
    return <p className="text-sm text-[var(--ink-60)]">Cargando análisis...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">Mejoras recomendadas</h1>
          <p className="text-[13px] text-[var(--ink-60)]">
            Recomendaciones priorizadas por IA para tu empresa.
          </p>
        </div>
        <Button onClick={triggerAnalisis} disabled={running}>
          {running ? "Analizando..." : analisis ? "Actualizar análisis" : "Analizar mi empresa"}
        </Button>
      </div>

      {error && <p className="text-sm text-[var(--red-soft)]">{error}</p>}

      {!analisis && (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-4 text-sm text-[var(--ink-60)]">
              Todavía no hay análisis guardado para esta cuenta.
            </p>
            <Button onClick={triggerAnalisis} disabled={running}>
              {running ? "Analizando..." : "Analizar mi empresa"}
            </Button>
          </CardContent>
        </Card>
      )}

      {analisis && (
        <>
          <Card className="rounded-2xl bg-[var(--ink)] p-[28px_32px] text-white">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{analisis.empresa}</span>
                <span className="font-display text-5xl">{analisis.score}</span>
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen ejecutivo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{analisis.resumen}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {analisis.recomendaciones.map((rec, index) => (
              <Card key={`${rec.id}-${rec.titulo}`}>
                <CardHeader>
                  <CardTitle className="text-[14px] font-medium">
                    #{index + 1} - {rec.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-[12px]">
                  <p className="leading-[1.6] text-[var(--ink-60)]">{rec.descripcion}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`lex-pill ${impactoBadge(rec.impacto)}`}>Impacto: {rec.impacto}</span>
                    <span className={`lex-pill ${esfuerzoClass(rec.esfuerzo)}`}>
                      Esfuerzo: {rec.esfuerzo}
                    </span>
                    <span className="lex-pill bg-[var(--paper-2)] text-[var(--ink-60)]">{rec.categoria}</span>
                  </div>
                  <div className="rounded-[6px] bg-[var(--teal-light)] px-[10px] py-[5px] text-[12px] font-medium text-[var(--teal)]">
                    <strong>Acción esta semana:</strong> {rec.accion}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

