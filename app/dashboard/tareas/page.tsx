"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useLanguage } from "@/components/providers/language-provider"

// Recharts (cargado dinámico por si no está instalado aún)
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false })
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false })

interface Tarea {
  id: string
  user_id: string
  titulo: string
  descripcion: string | null
  completada: boolean
  urgencia: "alta" | "media" | "baja" | string
  categoria: "operaciones" | "ventas" | "finanzas" | "rrhh" | "tecnologia" | "comunicacion" | string
  tiempo_estimado: string
  vence_at: string | null
  created_at: string
}

export default function TareasPage() {
  const { language } = useLanguage()
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forzando, setForzando] = useState(false)
  const [translated, setTranslated] = useState<Record<string, { titulo: string; descripcion: string | null }>>({})

  const completadas = useMemo(() => tareas.filter(t => t.completada).length, [tareas])
  const pendientes = useMemo(() => tareas.length - completadas, [tareas, completadas])

  const fetchTareas = async (opts?: { forzar?: boolean }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/ai/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forzar: opts?.forzar === true }),
      })
      const body = await response.json()
      if (!response.ok) {
        throw new Error(body.error || "No se pudieron obtener las tareas")
      }
      setTareas(body.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setLoading(false)
      setForzando(false)
    }
  }

  useEffect(() => {
    void fetchTareas()
  }, [])

  // Translate existing tasks when language is 'en'
  useEffect(() => {
    const run = async () => {
      if (language !== "en") return
      const toTranslate: Array<{ id: string; titulo: string; descripcion: string | null }> = []
      tareas.forEach((t) => {
        if (!translated[t.id]) {
          toTranslate.push({ id: t.id, titulo: t.titulo, descripcion: t.descripcion })
        }
      })
      if (toTranslate.length === 0) return
      try {
        const texts: string[] = []
        toTranslate.forEach((t) => {
          texts.push(t.titulo)
          if (t.descripcion) texts.push(t.descripcion)
        })
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts, target: "en" }),
        })
        const body = await response.json()
        if (!response.ok || !body.ok) return
        const out: Record<string, { titulo: string; descripcion: string | null }> = {}
        let idx = 0
        toTranslate.forEach((item) => {
          const titulo = body.data[idx++] as string
          const descripcion = item.descripcion ? (body.data[idx++] as string) : null
          out[item.id] = { titulo, descripcion }
        })
        setTranslated((prev) => ({ ...prev, ...out }))
      } catch {
        // noop if translation fails; show original
      }
    }
    void run()
  }, [language, tareas, translated])

  const toggleTarea = async (tarea: Tarea) => {
    // Optimista
    setTareas(prev => prev.map(t => (t.id === tarea.id ? { ...t, completada: !t.completada } : t)))
    try {
      const response = await fetch(`/api/tareas/${tarea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completada: !tarea.completada }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "No se pudo actualizar la tarea")
    } catch (e) {
      // revertir si falla
      setTareas(prev => prev.map(t => (t.id === tarea.id ? { ...t, completada: tarea.completada } : t)))
      setError(e instanceof Error ? e.message : "Error al actualizar tarea")
    }
  }

  const Chart = () => (
    <div style={{ height: "160px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[{ name: "Esta semana", Completadas: completadas, Pendientes: pendientes }]}>
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <Tooltip />
          <Bar dataKey="Completadas" fill="#0A7B6B" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Pendientes" fill="#E8503A" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )

  const badgeUrgencia = (u: string) => {
    const base = { padding: "3px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600 }
    if (u === "alta") return { ...base, background: "rgba(232,80,58,0.12)", color: "#E8503A" }
    if (u === "media") return { ...base, background: "rgba(59,130,246,0.12)", color: "#2563EB" }
    return { ...base, background: "rgba(13,13,15,0.08)", color: "rgba(13,13,15,0.6)" }
  }

  const badgeTiempo = (txt: string) => ({
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 600,
    background: "rgba(10,123,107,0.1)",
    color: "#0A7B6B",
  })

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#0D0D0F" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 500, letterSpacing: "-0.02em" }}>Tareas de esta semana</h1>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "rgba(13,13,15,0.5)" }}>{completadas}/{Math.max(5, tareas.length)} completadas</p>
        </div>
        <button
          onClick={() => { setForzando(true); void fetchTareas({ forzar: true }) }}
          disabled={forzando}
          style={{
            border: "1px solid rgba(13,13,15,0.1)",
            background: "transparent",
            borderRadius: "10px",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#0D0D0F",
            cursor: forzando ? "not-allowed" : "pointer",
            opacity: forzando ? 0.6 : 1,
          }}
        >
          {forzando ? "Generando..." : "Generar nuevas tareas"}
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: "12px", color: "#E8503A", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{error}</span>
          <button onClick={() => void fetchTareas()} style={{ textDecoration: "underline", fontSize: "13px", color: "#0D0D0F" }}>
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gap: "10px" }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="animate-pulse" style={{ height: "56px", borderRadius: "12px", background: "rgba(13,13,15,0.08)" }} />
          ))}
        </div>
      ) : tareas.length === 0 ? (
        <div style={{ textAlign: "center", background: "#fff", border: "1px solid rgba(13,13,15,0.1)", borderRadius: "12px", padding: "28px" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>No hay tareas esta semana.</p>
          <button
            onClick={() => { setForzando(true); void fetchTareas({ forzar: true }) }}
            disabled={forzando}
            style={{
              marginTop: "10px",
              border: "1px solid rgba(13,13,15,0.1)",
              background: "transparent",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 500,
              color: "#0D0D0F",
              cursor: forzando ? "not-allowed" : "pointer",
              opacity: forzando ? 0.6 : 1,
            }}
          >
            {forzando ? "Generando..." : "Generar tareas con IA"}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          <div style={{ background: "#fff", border: "1px solid rgba(13,13,15,0.1)", borderRadius: "16px", padding: "16px" }}>
            <Chart />
          </div>

          <div style={{ background: "#fff", border: "1px solid rgba(13,13,15,0.1)", borderRadius: "16px", overflow: "hidden" }}>
            {tareas.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(13,13,15,0.08)",
                  opacity: t.completada ? 0.55 : 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(13,13,15,0.02)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={t.completada}
                    onChange={() => void toggleTarea(t)}
                    style={{ width: "16px", height: "16px", accentColor: "#0A7B6B" }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, textDecoration: t.completada ? "line-through" : "none" }}>
                      {language === "en" && translated[t.id]?.titulo ? translated[t.id]?.titulo : t.titulo}
                    </span>
                    {t.descripcion && (
                      <span style={{ fontSize: "12px", color: "rgba(13,13,15,0.5)", textDecoration: t.completada ? "line-through" : "none" }}>
                        {language === "en" && translated[t.id]?.descripcion ? translated[t.id]?.descripcion : t.descripcion}
                      </span>
                    )}
                  </div>
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={badgeUrgencia(t.urgencia)}>{t.urgencia}</span>
                  <span style={badgeTiempo(t.tiempo_estimado)}>{t.tiempo_estimado}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

