"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

const sans = { fontFamily: "'Outfit', sans-serif" }

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hola, soy Lexora. Estoy acá para ayudarte a mejorar tu empresa. ¿En qué puedo ayudarte hoy?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setLoading(true)

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ]
    setMessages(newMessages)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: userMessage,
          historial: newMessages.slice(0, -1),
        }),
      })

      const body = await response.json() as { respuesta?: string; error?: string }

      if (!response.ok || !body.respuesta) {
        throw new Error(body.error || "Error al procesar tu mensaje")
      }

      setMessages([
        ...newMessages,
        { role: "assistant", content: body.respuesta },
      ])
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Hubo un error al procesar tu mensaje. Intentá de nuevo.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle
          className="flex items-center gap-2"
          style={{ ...sans, fontSize: "16px", fontWeight: 500 }}
        >
          <Sparkles className="h-5 w-5" style={{ color: "#C9A84C" }} />
          Chat con Lexora
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">

          {/* Mensajes */}
          <div
            style={{
              height: "380px",
              overflowY: "auto",
              borderRadius: "10px",
              border: "1px solid rgba(13,13,15,0.1)",
              padding: "16px",
              background: "#F7F6F2",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {message.role === "assistant" && (
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#0D0D0F",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "14px",
                      fontStyle: "italic",
                      color: "#C9A84C",
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
                    padding: "9px 13px",
                    borderRadius: message.role === "user"
                      ? "12px 4px 12px 12px"
                      : "4px 12px 12px 12px",
                    background: message.role === "user" ? "#0D0D0F" : "#fff",
                    color: message.role === "user" ? "#fff" : "#0D0D0F",
                    border: message.role === "assistant"
                      ? "1px solid rgba(13,13,15,0.08)"
                      : "none",
                    ...sans,
                    fontSize: "13px",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#0D0D0F",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "14px",
                    fontStyle: "italic",
                    color: "#C9A84C",
                    flexShrink: 0,
                    marginRight: "8px",
                  }}
                >
                  L
                </div>
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(13,13,15,0.08)",
                    borderRadius: "4px 12px 12px 12px",
                    padding: "12px 14px",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: "rgba(13,13,15,0.3)",
                        display: "inline-block",
                        animation: "bounce 1.2s infinite",
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ display: "flex", gap: "8px" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Preguntale algo a Lexora..."
              disabled={loading}
              rows={1}
              style={{
                flex: 1,
                background: "#F7F6F2",
                border: "1px solid rgba(13,13,15,0.1)",
                borderRadius: "8px",
                padding: "9px 12px",
                ...sans,
                fontSize: "13px",
                color: "#0D0D0F",
                outline: "none",
                resize: "none",
                lineHeight: 1.5,
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: loading || !input.trim() ? "rgba(13,13,15,0.3)" : "#0D0D0F",
                border: "none",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
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
          </form>

          <p style={{ ...sans, fontSize: "11px", color: "rgba(13,13,15,0.35)", textAlign: "center" }}>
            Enter para enviar · Shift+Enter para nueva línea
          </p>

        </div>
      </CardContent>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </Card>
  )
}