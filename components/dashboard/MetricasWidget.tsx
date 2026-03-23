"use client"

import { useEffect, useState } from "react"

interface Metricas {
  documentosAnalizados: number
  tareasPendientes: number
  ultimoAnalisis: string
  variacionScore: number
}

export function MetricasWidget() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Metricas | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/dashboard/metricas", { method: "GET" })
        const body = (await response.json()) as { ok?: boolean; data?: Metricas }
        if (!response.ok || !body.ok || !body.data) {
          throw new Error("No se pudieron cargar métricas")
        }
        setData(body.data)
      } catch {
        setData({
          documentosAnalizados: 0,
          tareasPendientes: 0,
          ultimoAnalisis: "Sin análisis",
          variacionScore: 0,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || !data) {
    return (
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[10px] border border-[var(--border)] bg-white p-[20px_22px]"
            style={{ animation: "fadeUp 0.4s ease both", animationDelay: `${0.05 * (i + 1)}s` }}
          >
            <div className="mb-3 h-3 w-24 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-16 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    )
  }

  const scoreColor =
    data.variacionScore > 0
      ? "#0A7B6B"
      : data.variacionScore < 0
        ? "#E8503A"
        : "rgba(13,13,15,0.4)"
  const scoreDelta =
    data.variacionScore > 0
      ? { text: "↑ mejorando", color: "#0A7B6B" }
      : data.variacionScore < 0
        ? { text: "↓ bajando", color: "#E8503A" }
        : { text: "sin cambios", color: "rgba(13,13,15,0.4)" }

  const hoy = new Date()
  const esHoy =
    data.ultimoAnalisis === "Hace menos de 1 hora" ||
    data.ultimoAnalisis.startsWith("Hace ") ||
    data.ultimoAnalisis === "Ayer"

  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Documentos */}
      <div
        className="rounded-[10px] border border-[var(--border)] bg-white p-[20px_22px]"
        style={{ animation: "fadeUp 0.4s ease both", animationDelay: "0.05s" }}
      >
        <p className="mb-[10px] text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-60)]">
          Documentos analizados
        </p>
        <p className="mb-[6px] font-display text-[32px] tracking-[-0.03em] text-[var(--ink)]">
          {data.documentosAnalizados}
        </p>
        <p className="flex items-center gap-1 text-[12px]" style={{ color: "#0A7B6B" }}>
          archivos procesados
        </p>
      </div>

      {/* Tareas */}
      <div
        className="rounded-[10px] border border-[var(--border)] bg-white p-[20px_22px]"
        style={{ animation: "fadeUp 0.4s ease both", animationDelay: "0.1s" }}
      >
        <p className="mb-[10px] text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-60)]">
          Tareas pendientes
        </p>
        <p className="mb-[6px] font-display text-[32px] tracking-[-0.03em] text-[var(--ink)]">
          {data.tareasPendientes}
        </p>
        <p
          className="flex items-center gap-1 text-[12px]"
          style={{
            color: data.tareasPendientes > 0 ? "#E8503A" : "rgba(13,13,15,0.4)",
          }}
        >
          {data.tareasPendientes > 0 ? `${data.tareasPendientes} vencen hoy` : "al día"}
        </p>
      </div>

      {/* Último análisis */}
      <div
        className="rounded-[10px] border border-[var(--border)] bg-white p-[20px_22px]"
        style={{ animation: "fadeUp 0.4s ease both", animationDelay: "0.15s" }}
      >
        <p className="mb-[10px] text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-60)]">
          Último análisis
        </p>
        <p
          className="mb-[6px] font-display tracking-[-0.03em] text-[var(--ink)]"
          style={{ fontSize: esHoy ? "32px" : "24px", lineHeight: 1 }}
        >
          {esHoy ? "Hoy" : data.ultimoAnalisis}
        </p>
        <p className="flex items-center gap-1 text-[12px]" style={{ color: "rgba(13,13,15,0.4)" }}>
          {data.ultimoAnalisis}
        </p>
      </div>

      {/* Score vs mes anterior */}
      <div
        className="rounded-[10px] border border-[var(--border)] bg-white p-[20px_22px]"
        style={{ animation: "fadeUp 0.4s ease both", animationDelay: "0.2s" }}
      >
        <p className="mb-[10px] text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-60)]">
          Score vs mes anterior
        </p>
        <p
          className="mb-[6px] font-display text-[32px] tracking-[-0.03em]"
          style={{ color: scoreColor, lineHeight: 1 }}
        >
          {data.variacionScore > 0 ? `+${data.variacionScore}` : data.variacionScore}
        </p>
        <p className="flex items-center gap-1 text-[12px]" style={{ color: scoreDelta.color }}>
          {scoreDelta.text}
        </p>
      </div>
    </div>
  )
}

