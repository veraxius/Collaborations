"use client"

import { useEffect, useRef, useState } from "react"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const sans = { fontFamily: "'Inter', sans-serif" }

export default function ChatPage() {
  const [historial, setHistorial] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hola, soy Lexora. Ya analicé tu empresa. ¿En qué puedo ayudarte hoy?",
    },
  ])
  const [mensaje, setMensaje] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [historial, loading])

  const enviar = async () => {
    if (!mensaje.trim() || loading) return

    setError(null)
    const userMsg: ChatMessage = { role: "user", content: mensaje.trim() }
    const nextHistorial = [...historial, userMsg]
    setHistorial(nextHistorial)
    setMensaje("")
    setLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: userMsg.content,
          historial: historial,
        }),
      })
      const rawBody = await response.text()
      let body: { respuesta?: string; error?: string }
      try {
        body = JSON.parse(rawBody) as { respuesta?: string; error?: string }
      } catch {
        throw new Error("El servidor devolvió una respuesta inválida")
      }

      if (!response.ok || !body.respuesta) {
        throw new Error(body.error || "No se pudo obtener respuesta")
      }

      setHistorial((prev) => [
        ...prev,
        { role: "assistant", content: body.respuesta! },
      ])
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Error desconocido"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 6rem)", gap: "16px" }}>

      {/* Header */}
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(13,13,15,0.1)",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(13,13,15,0.08)",
            padding: "14px 18px",
          }}
        >
          <h1
            style={{
              ...sans,
              fontSize: "20px",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "#0D0D0F",
            }}
          >
            Chat con Lexora
          </h1>
          <span
            style={{
              ...sans,
              fontSize: "12px",
              color: "#0A7B6B",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#0A7B6B",
                display: "inline-block",
              }}
            />
            Online
          </span>
        </div>
        <div style={{ padding: "10px 18px" }}>
          <p style={{ ...sans, fontSize: "13px", color: "rgba(13,13,15,0.5)" }}>
            Consultá sobre mejoras, operaciones y próximos pasos para tu negocio.
          </p>
        </div>
      </div>

      {/* Mensajes */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#fff",
          border: "1px solid rgba(13,13,15,0.1)",
          borderRadius: "10px",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {historial.map((item, index) => (
          <div
            key={`${item.role}-${index}`}
            style={{
              display: "flex",
              justifyContent: item.role === "user" ? "flex-end" : "flex-start",
              alignItems: "flex-start",
            }}
          >
            {item.role === "assistant" && (
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#0D0D0F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  fontStyle: "italic",
                  color: "#2563EB",
                  flexShrink: 0,
                  marginRight: "8px",
                  marginTop: "2px",
                }}
              >
                L
              </div>
            )}
            <div
              style={{
                maxWidth: "80%",
                padding: "9px 14px",
                ...sans,
                fontSize: "13px",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                borderRadius: item.role === "user"
                  ? "12px 4px 12px 12px"
                  : "4px 12px 12px 12px",
                background: item.role === "user" ? "#0D0D0F" : "#EEECEA",
                color: item.role === "user" ? "#fff" : "#0D0D0F",
              }}
            >
              {item.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", paddingLeft: "36px" }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "rgba(13,13,15,0.3)",
                  display: "inline-block",
                  animation: "bounce 1.2s infinite",
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <p style={{ ...sans, fontSize: "13px", color: "#E8503A" }}>{error}</p>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: "8px" }}>
        <textarea
          placeholder="Escribí tu pregunta..."
          value={mensaje}
          rows={1}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void enviar()
            }
          }}
          style={{
            flex: 1,
            background: "#fff",
            border: "1px solid rgba(13,13,15,0.1)",
            borderRadius: "8px",
            padding: "10px 14px",
            ...sans,
            fontSize: "13px",
            color: "#0D0D0F",
            outline: "none",
            resize: "none",
            lineHeight: 1.5,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(13,13,15,0.3)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(13,13,15,0.1)"
          }}
        />
        <button
          onClick={() => void enviar()}
          disabled={loading || !mensaje.trim()}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            background: loading || !mensaje.trim() ? "rgba(13,13,15,0.25)" : "#0D0D0F",
            border: "none",
            cursor: loading || !mensaje.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            alignSelf: "flex-end",
            transition: "background 0.15s",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <p
        style={{
          ...sans,
          fontSize: "11px",
          color: "rgba(13,13,15,0.35)",
          textAlign: "center",
        }}
      >
        Enter para enviar · Shift+Enter para nueva línea
      </p>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}