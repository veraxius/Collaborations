"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/providers/language-provider"

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
  const { language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ResumenData | null>(null)
  const [translated, setTranslated] = useState<{
    saludo?: string
    titular?: string
    resumen?: string
    oportunidad?: string
  }>({})

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

  // Auto-traducir el contenido dinámico cuando el idioma es inglés
  useEffect(() => {
    const run = async () => {
      if (language !== "en" || !data) return
      const texts: string[] = []
      const keys: Array<keyof ResumenData> = []
      if (data.saludo) { texts.push(data.saludo); keys.push("saludo") }
      if (data.titular) { texts.push(data.titular); keys.push("titular") }
      if (data.resumen) { texts.push(data.resumen); keys.push("resumen") }
      if (data.oportunidad) { texts.push(data.oportunidad); keys.push("oportunidad") }
      if (texts.length === 0) return
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts, target: "en" }),
        })
        const body = await response.json()
        if (!response.ok || !body.ok) return
        const next: typeof translated = {}
        keys.forEach((key, idx) => {
          const val = body.data[idx] as string
          if (key === "saludo") next.saludo = val
          if (key === "titular") next.titular = val
          if (key === "resumen") next.resumen = val
          if (key === "oportunidad") next.oportunidad = val
        })
        setTranslated(next)
      } catch {
        // noop si falla la traducción
      }
    }
    void run()
  }, [language, data])
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
        style: { background: "rgba(59,130,246,0.12)", color: "#2563EB" },
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
          {language === "en" && translated.saludo ? translated.saludo : data.saludo}
        </p>
        <span className="rounded-full px-3 py-1 text-xs font-medium" style={badge.style}>
          {badge.text}
        </span>
      </div>

      <h3 className="font-display text-[24px] font-normal tracking-[-0.02em] text-[var(--ink)]">
        {language === "en" && translated.titular ? translated.titular : data.titular}
      </h3>
      <p className="mb-4 mt-[10px] text-[14px] leading-[1.7] text-[rgba(13,13,15,0.65)]">
        {language === "en" && translated.resumen ? translated.resumen : data.resumen}
      </p>

      <div className="border-t border-[rgba(13,13,15,0.08)] pt-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[rgba(13,13,15,0.35)]">
          OPORTUNIDAD ESTA SEMANA
        </p>
        <p className="mt-[6px] text-[13px] font-medium text-[var(--teal)]">
          <span className="mr-1 text-[var(--primary-600)]">→</span>
          {language === "en" && translated.oportunidad ? translated.oportunidad : data.oportunidad}
        </p>
      </div>
    </section>
  )
}

