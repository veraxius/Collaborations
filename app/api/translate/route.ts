import { NextResponse } from "next/server"
import Groq from "groq-sdk"

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 })
    }
    const body = (await request.json()) as {
      texts: string[]
      target: "en" | "es"
    }
    const texts = Array.isArray(body.texts) ? body.texts.filter((t) => typeof t === "string") : []
    const target = body.target === "en" || body.target === "es" ? body.target : "en"
    if (texts.length === 0) {
      return NextResponse.json({ ok: true, data: [] })
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const system =
      target === "en"
        ? "You are a professional translator. Translate Spanish business task titles and descriptions into concise, natural English. Return ONLY a valid JSON array of strings."
        : "Sos un traductor profesional. Traducí títulos y descripciones de tareas de negocios del inglés al español rioplatense, de forma concisa y natural. Devolvé SOLO un array JSON válido de strings."

    const input = JSON.stringify(texts)
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Traducí este array JSON manteniendo el orden:\n${input}\nRespondé SOLO con el array JSON traducido, sin texto extra, sin markdown.`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content ?? "[]"
    const cleaned = content.replace(/```json|```/g, "").trim()
    let translated: string[]
    try {
      translated = JSON.parse(cleaned) as string[]
    } catch {
      return NextResponse.json({ error: "Formato inválido de traducción" }, { status: 500 })
    }

    if (!Array.isArray(translated) || translated.length !== texts.length) {
      return NextResponse.json({ error: "Traducción incompleta" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: translated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

