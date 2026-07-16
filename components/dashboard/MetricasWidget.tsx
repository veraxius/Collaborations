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
          throw new Error("Could not load metrics")
        }
        setData(body.data)
      } catch {
        setData({
          documentosAnalizados: 0,
          tareasPendientes: 0,
          ultimoAnalisis: "No analysis yet",
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
      ? { text: "↑ improving", color: "#0A7B6B" }
      : data.variacionScore < 0
        ? { text: "↓ declining", color: "#E8503A" }
        : { text: "no changes", color: "rgba(13,13,15,0.4)" }

  const hoy = new Date()
  const esHoy =
    data.ultimoAnalisis === "Less than 1 hour ago" ||
    data.ultimoAnalisis.endsWith("hours ago") ||
    data.ultimoAnalisis === "Yesterday"

  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Documents */}
      <div
        className="rounded-[10px] border border-[var(--border)] bg-white p-[20px_22px]"
        style={{ animation: "fadeUp 0.4s ease both", animationDelay: "0.05s" }}
      >
        <p className="mb-[10px] text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-60)]">
          Documents analyzed
        </p>
        <p className="mb-[6px] font-display text-[32px] tracking-[-0.03em] text-[var(--ink)]">
          {data.documentosAnalizados}
        </p>
        <p className="flex items-center gap-1 text-[12px]" style={{ color: "#0A7B6B" }}>
          files processed
        </p>
      </div>

      {/* Tasks */}
      <div
        className="rounded-[10px] border border-[var(--border)] bg-white p-[20px_22px]"
        style={{ animation: "fadeUp 0.4s ease both", animationDelay: "0.1s" }}
      >
        <p className="mb-[10px] text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-60)]">
          Pending tasks
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
          {data.tareasPendientes > 0 ? `${data.tareasPendientes} due today` : "up to date"}
        </p>
      </div>

      {/* Last analysis */}
      <div
        className="rounded-[10px] border border-[var(--border)] bg-white p-[20px_22px]"
        style={{ animation: "fadeUp 0.4s ease both", animationDelay: "0.15s" }}
      >
        <p className="mb-[10px] text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-60)]">
          Last analysis
        </p>
        <p
          className="mb-[6px] font-display tracking-[-0.03em] text-[var(--ink)]"
          style={{ fontSize: esHoy ? "32px" : "24px", lineHeight: 1 }}
        >
          {esHoy ? "Today" : data.ultimoAnalisis}
        </p>
        <p className="flex items-center gap-1 text-[12px]" style={{ color: "rgba(13,13,15,0.4)" }}>
          {data.ultimoAnalisis}
        </p>
      </div>

      {/* Score vs previous month */}
      <div
        className="rounded-[10px] border border-[var(--border)] bg-white p-[20px_22px]"
        style={{ animation: "fadeUp 0.4s ease both", animationDelay: "0.2s" }}
      >
        <p className="mb-[10px] text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink-60)]">
          Score vs previous month
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

