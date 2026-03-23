import { NextRequest, NextResponse } from "next/server"
import { analyzeSEO } from "@/lib/seo"
import { analyzePerformance } from "@/lib/analyzePerformance"
import { analyzeSEOWithAI } from "@/lib/aiAnalysis"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain } = body

    // Validar que se proporcionó el dominio
    if (!domain || typeof domain !== "string" || domain.trim() === "") {
      return NextResponse.json(
        { error: "El campo 'domain' es requerido" },
        { status: 400 }
      )
    }

    // Analizar SEO y Performance en paralelo para mayor eficiencia
    const [seoAnalysis, performanceAnalysis] = await Promise.all([
      analyzeSEO(domain),
      analyzePerformance(domain),
    ])

    // Generar recomendaciones de IA basadas en el análisis SEO
    const aiRecommendations = await analyzeSEOWithAI(seoAnalysis)

    return NextResponse.json(
      {
        seo: seoAnalysis,
        performance: performanceAnalysis,
        aiRecommendations: aiRecommendations,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error en /api/analyze:", error)
    
    return NextResponse.json(
      {
        error: "Error al analizar el sitio",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}
