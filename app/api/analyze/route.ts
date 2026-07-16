import { NextRequest, NextResponse } from "next/server"
import { analyzeSEO } from "@/lib/seo"
import { analyzePerformance } from "@/lib/analyzePerformance"
import { analyzeSEOWithAI } from "@/lib/aiAnalysis"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain } = body

    // Validate that a domain was provided
    if (!domain || typeof domain !== "string" || domain.trim() === "") {
      return NextResponse.json(
        { error: "The 'domain' field is required" },
        { status: 400 }
      )
    }

    // Analyze SEO and Performance in parallel for better efficiency
    const [seoAnalysis, performanceAnalysis] = await Promise.all([
      analyzeSEO(domain),
      analyzePerformance(domain),
    ])

    // Generate AI recommendations based on the SEO analysis
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
    console.error("Error in /api/analyze:", error)
    
    return NextResponse.json(
      {
        error: "Error analyzing the site",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
