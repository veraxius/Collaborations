"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

interface Recomendacion {
  id: number
  titulo: string
  descripcion: string
  impacto: "alto" | "medio" | "bajo"
  esfuerzo: "alto" | "medio" | "bajo"
  categoria: string
  accion: string
}

export function RecomendacionesWidget() {
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEmpty, setIsEmpty] = useState(false)
  const [items, setItems] = useState<Recomendacion[]>([])

  const load = async () => {
    setLoading(true)
    setError(null)
    setIsEmpty(false)
    try {
      const response = await fetch("/api/ai/recomendaciones", { method: "POST" })
      const body = (await response.json()) as {
        ok?: boolean
        data?: Recomendacion[]
        error?: string
      }

      if (response.status === 404) {
        setIsEmpty(true)
        setItems([])
        return
      }

      if (!response.ok || !body.ok || !body.data) {
        throw new Error(body.error || "No pudimos cargar recomendaciones")
      }

      setItems(body.data.slice(0, 3))
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "No pudimos cargar recomendaciones"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const analyze = async () => {
    setRunning(true)
    try {
      const response = await fetch("/api/ai/analizar", { method: "POST" })
      const body = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "No se pudo analizar la empresa")
      }
      window.location.reload()
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "No se pudo analizar la empresa"
      setError(message)
    } finally {
      setRunning(false)
    }
  }

  const impactClass = (impacto: Recomendacion["impacto"]) => {
    if (impacto === "alto") return "bg-[rgba(10,123,107,0.1)] text-[var(--teal)]"
    if (impacto === "medio") return "bg-[rgba(201,168,76,0.12)] text-[#8a6d1e]"
    return "bg-[var(--paper-2)] text-[rgba(13,13,15,0.5)]"
  }

  const effortClass = (esfuerzo: Recomendacion["esfuerzo"]) => {
    if (esfuerzo === "alto") return "bg-[rgba(232,80,58,0.1)] text-[var(--red-soft)]"
    return "bg-[rgba(10,123,107,0.1)] text-[var(--teal)]"
  }

  const priorityStyle = useMemo(
    () => [
      {
        border: "border-l-[3px] border-l-[var(--gold)] rounded-r-[10px]",
        num: "bg-[rgba(201,168,76,0.12)] text-[#8a6d1e]",
      },
      {
        border: "border-l-[3px] border-l-[var(--teal)] rounded-r-[10px]",
        num: "bg-[var(--teal-light)] text-[var(--teal)]",
      },
      {
        border: "border-l-[3px] border-l-[rgba(13,13,15,0.08)] rounded-r-[10px]",
        num: "bg-[var(--paper-2)] text-[rgba(13,13,15,0.5)]",
      },
    ],
    []
  )

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[20px] tracking-[-0.02em] text-[var(--ink)]">
          Mejoras prioritarias
        </h3>
        <Link
          href="/dashboard/mejoras"
          className="text-[13px] text-[rgba(13,13,15,0.5)] underline underline-offset-[3px]"
        >
          Ver todas →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-[10px]">
          <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
        </div>
      ) : error ? (
        <div className="rounded-[10px] border border-[var(--border)] bg-white p-5">
          <p className="mb-3 text-sm text-[var(--ink-60)]">No pudimos cargar recomendaciones</p>
          <Button variant="outline" onClick={load}>
            Reintentar
          </Button>
        </div>
      ) : isEmpty ? (
        <div className="rounded-[10px] border border-[var(--border)] bg-white p-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-lg border-2 border-dashed border-[var(--border)]" />
          <p className="text-sm font-medium text-[var(--ink)]">
            Todavía no tenemos recomendaciones para tu empresa
          </p>
          <p className="mb-4 mt-1 text-xs text-[var(--ink-60)]">
            Hacé tu primer análisis para ver tus mejoras
          </p>
          <Button onClick={analyze} disabled={running}>
            {running ? "Analizando..." : "Analizar mi empresa"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {items.map((item, index) => (
            <article
              key={`${item.id}-${item.titulo}`}
              className={`flex cursor-pointer items-start gap-4 rounded-[10px] border border-[var(--border)] bg-white p-[18px_20px] transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(13,13,15,0.06)] ${priorityStyle[index]?.border ?? ""}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[12px] font-medium ${priorityStyle[index]?.num ?? ""}`}
              >
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[14px] font-medium text-[var(--ink)]">{item.titulo}</p>
                <p className="mb-[10px] text-[12px] leading-[1.6] text-[rgba(13,13,15,0.6)]">
                  {item.descripcion}
                </p>
                <span className="inline-block rounded-[6px] bg-[var(--teal-light)] px-[10px] py-[5px] text-[12px] font-medium text-[var(--teal)]">
                  → {item.accion}
                </span>
              </div>

              <div className="flex shrink-0 flex-col gap-[6px]">
                <span className={`rounded-[20px] px-[9px] py-[3px] text-[11px] font-medium ${impactClass(item.impacto)}`}>
                  Impacto {item.impacto}
                </span>
                <span className={`rounded-[20px] px-[9px] py-[3px] text-[11px] font-medium ${effortClass(item.esfuerzo)}`}>
                  Esfuerzo {item.esfuerzo}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

