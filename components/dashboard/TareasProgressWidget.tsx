"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

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

export default function TareasProgressWidget() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<TareasStatsResponse | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/dashboard/tareas-stats", { method: "GET" })
        const body = (await response.json()) as TareasStatsResponse | { error?: string }
        if (!response.ok || !("ok" in body) || !body.ok) {
          throw new Error("No se pudieron cargar estadísticas de tareas")
        }
        setStats(body as TareasStatsResponse)
      } catch (caughtError) {
        const message =
          caughtError instanceof Error ? caughtError.message : "Error cargando tareas"
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const empty = useMemo(() => {
    if (!stats) return false
    const totalSum = stats.data.reduce((acc, s) => acc + (s.total ?? 0), 0)
    return totalSum === 0
  }, [stats])

  const porcentaje = stats?.porcentaje ?? 0
  const completadasEstaSemana = stats?.completadasEstaSemana ?? 0
  const chartData = (stats?.data ?? []).map((d) => ({
    semana: d.semana,
    completadas: d.completadas,
    pendientes: d.pendientes,
    total: d.total,
  }))

  const porcentajeColor =
    porcentaje >= 71 ? "#0A7B6B" : porcentaje >= 31 ? "#C9A84C" : "#E8503A"

  const interpretativo = useMemo(() => {
    if (!stats) return { text: "", color: "#0A7B6B" }
    if (stats.completadasEstaSemana >= 4) {
      return { text: "Tu empresa está ejecutando muy bien esta semana.", color: "#0A7B6B" }
    }
    if (stats.completadasEstaSemana >= 2) {
      return {
        text: "Buen ritmo, seguí completando las tareas pendientes.",
        color: "#C9A84C",
      }
    }
    return {
      text: "Hay tareas importantes pendientes que necesitan atención.",
      color: "#E8503A",
    }
  }, [stats])

  if (loading) {
    return (
      <section
        style={{
          background: "#fff",
          border: "1px solid rgba(13,13,15,0.1)",
          borderRadius: "16px",
          padding: "24px 28px",
          width: "100%",
        }}
      >
        <div className="h-[160px] animate-pulse rounded bg-[rgba(13,13,15,0.08)]" />
      </section>
    )
  }

  if (error) {
    return (
      <section
        style={{
          background: "#fff",
          border: "1px solid rgba(13,13,15,0.1)",
          borderRadius: "16px",
          padding: "24px 28px",
          width: "100%",
        }}
      >
        <p style={{ margin: 0, color: "#E8503A", fontSize: "13px" }}>{error}</p>
      </section>
    )
  }

  if (empty) {
    return (
      <section
        style={{
          background: "#fff",
          border: "1px solid rgba(13,13,15,0.1)",
          borderRadius: "16px",
          padding: "24px 28px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "rgba(13,13,15,0.5)" }}>
          Generá tus primeras tareas para ver el progreso de tu empresa
        </p>
        <button
          onClick={() => router.push("/dashboard/tareas")}
          style={{
            marginTop: "12px",
            border: "1px solid rgba(13,13,15,0.1)",
            background: "transparent",
            borderRadius: "10px",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#0D0D0F",
            cursor: "pointer",
          }}
        >
          Generar tareas
        </button>
      </section>
    )
  }

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid rgba(13,13,15,0.1)",
        borderRadius: "16px",
        padding: "24px 28px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(13,13,15,0.4)",
              marginBottom: "6px",
            }}
          >
            EN BASE A TUS TAREAS
          </p>
          <h3
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "#0D0D0F",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Progreso operativo de tu empresa
          </h3>
        </div>

        <div style={{ textAlign: "right" }}>
          <p
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 500,
              color: porcentajeColor,
              fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1,
            }}
          >
            {porcentaje}%
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "rgba(13,13,15,0.4)" }}>
            completadas esta semana
          </p>
        </div>
      </div>

      <div style={{ marginTop: "16px" }}>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0A7B6B" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0A7B6B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E8503A" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#E8503A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(13,13,15,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="semana"
              tick={{ fontSize: 11, fill: "rgba(13,13,15,0.4)", fontFamily: "DM Sans" }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "rgba(13,13,15,0.4)", fontFamily: "DM Sans" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0D0D0F",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                color: "#F7F6F2",
                fontFamily: "DM Sans",
              }}
              formatter={(value, name) => {
                const numericValue = typeof value === "number" ? value : 0
                const label = name === "completadas" ? "Completadas" : "Pendientes"
                return [numericValue, label]
              }}
            />
            <Area
              type="monotone"
              dataKey="completadas"
              stroke="#0A7B6B"
              strokeWidth={2}
              fill="url(#gradComp)"
            />
            <Area
              type="monotone"
              dataKey="pendientes"
              stroke="#E8503A"
              strokeWidth={2}
              fill="url(#gradPend)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          marginTop: 8,
          fontSize: "12px",
          color: "rgba(13,13,15,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0A7B6B" }} />
          <span>Tareas completadas</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E8503A" }} />
          <span>Tareas pendientes</span>
        </div>
      </div>

      <p
        style={{
          fontSize: "13px",
          textAlign: "center",
          marginTop: "12px",
          color: interpretativo.color,
          fontWeight: 500,
        }}
      >
        {interpretativo.text}
      </p>
    </section>
  )
}

