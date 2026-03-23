import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationHistory } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "El campo 'message' es requerido" },
        { status: 400 }
      )
    }

    // Construir el array de mensajes con historial y mensaje actual
    const chatHistory = conversationHistory || []
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: "Eres un asistente experto en SEO, análisis web y optimización de sitios. Ayudas a los usuarios con recomendaciones sobre SEO, performance, marketing digital y mejoras de sitios web. Responde siempre en español de manera clara, concisa y profesional.",
      },
    ]

    // Agregar historial de conversación
    chatHistory.forEach((msg: { role: string; content: string }) => {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })
      }
    })

    // Agregar el mensaje actual
    messages.push({
      role: "user",
      content: message,
    })

    // Llamar a la API
    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: messages,
    })

    // Extraer el texto de la respuesta
    const text = chatCompletion.choices[0]?.message?.content || "No se pudo generar una respuesta."

    return NextResponse.json(
      { response: text },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error en /api/ai-chat:", error)
    
    return NextResponse.json(
      {
        error: "Error al procesar el mensaje",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}
