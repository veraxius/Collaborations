import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

export const dynamic = "force-dynamic" // 👈 KEY

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY" },
        { status: 500 }
      )
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    const body = await request.json()
    const { message, conversationHistory } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "The 'message' field is required" },
        { status: 400 }
      )
    }

    const chatHistory = conversationHistory || []

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: "You are an assistant who is an expert in SEO, web analysis and site optimization. Always respond in English in a clear, concise and professional manner.",
      },
    ]

    chatHistory.forEach((msg: { role: string; content: string }) => {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })
      }
    })

    messages.push({
      role: "user",
      content: message,
    })

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: messages,
    })

    const text =
      chatCompletion.choices[0]?.message?.content ||
      "A response could not be generated."

    return NextResponse.json({ response: text }, { status: 200 })

  } catch (error) {
    console.error("Error in /api/ai-chat:", error)

    return NextResponse.json(
      {
        error: "Error processing the message",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}