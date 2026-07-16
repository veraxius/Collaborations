"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

interface ScoreData {
  score: number
  variacion: number
  nivel: "inicial" | "en desarrollo" | "consolidado" | "avanzado" | "excelente"
  resumen: string
  color: "rojo" | "amarillo" | "verde"
}

export function ScoreWidget() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [data, setData] = useState<ScoreData | null>(null)

  const fetchScore = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/ai/score", { method: "GET" })
      const body = (await response.json()) as {
        ok?: boolean
        data?: ScoreData | null
        error?: string
      }
      if (!response.ok) {
        throw new Error(body.error || "We couldn't calculate the score")
      }
      setData(body.data ?? null)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "We couldn't calculate the score"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScore()
  }, [])

  const runAnalisis = async () => {
    setRunning(true)
    setError(null)
    try {
      const response = await fetch("/api/ai/analizar", { method: "POST" })
      const body = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "We couldn't generate the analysis")
      }
      await fetchScore()
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "We couldn't generate the analysis"
      setError(message)
    } finally {
      setRunning(false)
    }
  }

  const recalculateScore = async () => {
    setRunning(true)
    setError(null)
    try {
      const response = await fetch("/api/ai/score", { method: "POST" })
      const body = (await response.json()) as {
        ok?: boolean
        data?: ScoreData
        error?: string
      }
      if (!response.ok || !body.ok || !body.data) {
        throw new Error(body.error || "We couldn't recalculate the score")
      }
      setData(body.data)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "We couldn't recalculate the score"
      setError(message)
    } finally {
      setRunning(false)
    }
  }

  const dashOffset = useMemo(() => {
    const score = data?.score ?? 0
    return 220 - (score / 100) * 220
  }, [data?.score])

  if (loading) {
    return (
      <section
        className="animate-pulse p-[28px_32px] opacity-60"
        style={{
          background: "rgba(239, 246, 255, 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          borderRadius: "16px",
        }}
      >
        <div className="flex items-center gap-8">
          <div className="h-20 w-20 rounded-full" style={{ background: "rgba(37, 99, 235, 0.2)" }} />
          <div className="space-y-3">
            <div className="h-3 w-52 rounded" style={{ background: "rgba(30, 58, 138, 0.2)" }} />
            <div className="h-5 w-64 rounded" style={{ background: "rgba(30, 58, 138, 0.2)" }} />
            <div className="h-3 w-80 rounded" style={{ background: "rgba(30, 58, 138, 0.2)" }} />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section
        className="rounded-2xl p-[28px_32px]"
        style={{
          background: "rgba(239, 246, 255, 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          borderRadius: "16px",
        }}
      >
        <p className="mb-3 text-sm" style={{ color: "#1e3a8a" }}>
          We couldn't calculate the score
        </p>
        <Button variant="outline" onClick={fetchScore}>
          Retry
        </Button>
      </section>
    )
  }

  if (!data) {
    return (
      <section
        className="rounded-2xl p-[28px_32px]"
        style={{
          background: "rgba(239, 246, 255, 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          borderRadius: "16px",
        }}
      >
        <p className="mb-3 text-sm" style={{ color: "rgba(30, 58, 138, 0.5)" }}>
          No score available yet.
        </p>
        <Button onClick={runAnalisis} disabled={running}>
          {running ? "Generating..." : "Generate analysis"}
        </Button>
      </section>
    )
  }

  const variacionBadge =
    data.variacion > 0
      ? {
          label: `↑ +${data.variacion} points this month`,
          style: { background: "rgba(10,123,107,0.2)", color: "#0A7B6B" },
        }
      : data.variacion < 0
        ? {
            label: `↓ ${data.variacion} points this month`,
            style: { background: "rgba(232,80,58,0.12)", color: "#E8503A" },
          }
        : {
            label: "No changes this month",
            style: { background: "rgba(59,130,246,0.12)", color: "#2563EB" },
          }

  return (
    <section
      style={{
        background: "rgba(239, 246, 255, 0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(59, 130, 246, 0.25)",
        borderRadius: "16px",
        padding: "28px 32px",
        display: "flex",
        gap: "32px",
        alignItems: "center",
      }}
    >
      <div className="relative h-20 w-20 shrink-0">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke="rgba(59,130,246,0.15)"
            strokeWidth="5"
          />
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke="#2563EB"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={220}
            strokeDashoffset={dashOffset}
            style={{
              animation: "ringFill 1.4s cubic-bezier(0.4,0,0.2,1)",
              ["--ring-offset" as string]: String(dashOffset),
            }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center font-display text-[22px]"
          style={{ color: "#2563EB" }}>
          {data.score}
        </div>
      </div>

      <div className="flex-1">
        <p className="text-[11px] font-medium tracking-[0.08em]" style={{ color: "rgba(37,99,235,0.5)" }}>
          OPERATIONAL MATURITY INDEX
        </p>
        <p className="mb-2 font-display text-[20px]" style={{ color: "#1E40AF" }}>
          Your company is{" "}
          {{
            inicial: "at an early stage",
            "en desarrollo": "developing",
            consolidado: "consolidated",
            avanzado: "advanced",
            excelente: "excellent",
          }[data.nivel] ?? data.nivel}
        </p>
        <p className="max-w-[480px] text-[13px] leading-[1.6]" style={{ color: "rgba(30,58,138,0.6)" }}>
          {data.resumen}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className="rounded-full px-3 py-1 text-xs font-medium" style={variacionBadge.style}>
            {variacionBadge.label}
          </span>
          <button
            onClick={recalculateScore}
            disabled={running}
            style={{
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              color: "#2563EB",
              borderRadius: "8px",
              padding: "7px 12px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: running ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(event) => {
              if (!running) event.currentTarget.style.background = "rgba(59,130,246,0.25)"
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "rgba(59,130,246,0.15)"
            }}
          >
            {running ? "Updating..." : "Update score"}
          </button>
        </div>
      </div>
    </section>
  )
}

