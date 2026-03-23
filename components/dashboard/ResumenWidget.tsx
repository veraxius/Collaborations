"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface ResumenData {
  saludo: "Buenos días" | "Buenas tardes"
  titular: string
  resumen: string
  oportunidad: string
  estado: "critico" | "regular" | "bueno" | "excelente"
}

interface CachedResumen {
  timestamp: number
  data: ResumenData
}

const CACHE_KEY = "lexora_resumen"
const ONE_HOUR = 60 * 60 * 1000

export function ResumenWidget() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ResumenData | null>(null)

  const fetchResumen = async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CachedResumen
        const isFresh = Date.now() - parsed.timestamp < ONE_HOUR
        if (isFresh && parsed.data) {
          setData(parsed.data)
          setLoading(false)
          return
        }
      }

      const response = await fetch("/api/ai/resumen", { method: "POST" })
      const body = (await response.json()) as {
        ok?: boolean
        data?: ResumenData
        error?: string
      }
      if (!response.ok || !body.ok || !body.data) {
        throw new Error(body.error || "No pudimos generar el resumen")
      }

      setData(body.data)
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), data: body.data } satisfies CachedResumen)
      )
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "No pudimos generar el resumen"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResumen()
  }, [])

  const statusBadge = (estado: ResumenData["estado"]) => {
    if (estado === "critico") {
      return {
        text: "Atención requerida",
        style: { background: "rgba(232,80,58,0.1)", color: "#E8503A" },
      }
    }
    if (estado === "regular") {
      return {
        text: "En desarrollo",
        style: { background: "rgba(201,168,76,0.12)", color: "#8a6d1e" },
      }
    }
    if (estado === "bueno") {
      return {
        text: "Buen camino",
        style: { background: "rgba(10,123,107,0.1)", color: "#0A7B6B" },
      }
    }
    return {
      text: "Excelente",
      style: { background: "rgba(10,123,107,0.15)", color: "#0A7B6B" },
    }
  }

  if (loading) {
    return (
      <section className="w-full animate-pulse rounded-2xl border border-[rgba(13,13,15,0.1)] bg-white p-[28px_32px]">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-3 w-28 rounded bg-[rgba(13,13,15,0.12)]" />
          <div className="h-6 w-32 rounded-full bg-[rgba(13,13,15,0.12)]" />
        </div>
        <div className="mb-2 h-8 w-3/4 rounded bg-[rgba(13,13,15,0.12)]" />
        <div className="mb-4 space-y-2">
          <div className="h-4 w-full rounded bg-[rgba(13,13,15,0.12)]" />
          <div className="h-4 w-5/6 rounded bg-[rgba(13,13,15,0.12)]" />
        </div>
        <div className="border-t border-[rgba(13,13,15,0.08)] pt-4">
          <div className="h-4 w-2/3 rounded bg-[rgba(13,13,15,0.12)]" />
        </div>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="w-full rounded-2xl border border-[rgba(13,13,15,0.1)] bg-white p-[28px_32px]">
        <p className="mb-3 text-sm text-[var(--ink-60)]">No pudimos generar el resumen</p>
        <Button variant="outline" onClick={fetchResumen}>
          Reintentar
        </Button>
      </section>
    )
  }

  const badge = statusBadge(data.estado)

  return (
    <section className="w-full rounded-2xl border border-[rgba(13,13,15,0.1)] bg-white p-[28px_32px]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-[rgba(13,13,15,0.45)]">
          {data.saludo}
        </p>
        <span className="rounded-full px-3 py-1 text-xs font-medium" style={badge.style}>
          {badge.text}
        </span>
      </div>

      <h3 className="font-display text-[24px] font-normal tracking-[-0.02em] text-[var(--ink)]">
        {data.titular}
      </h3>
      <p className="mb-4 mt-[10px] text-[14px] leading-[1.7] text-[rgba(13,13,15,0.65)]">
        {data.resumen}
      </p>

      <div className="border-t border-[rgba(13,13,15,0.08)] pt-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[rgba(13,13,15,0.35)]">
          OPORTUNIDAD ESTA SEMANA
        </p>
        <p className="mt-[6px] text-[13px] font-medium text-[var(--teal)]">
          <span className="mr-1 text-[var(--gold)]">→</span>
          {data.oportunidad}
        </p>
      </div>
    </section>
  )
}

