import Groq from "groq-sdk"
import { SEOAnalysisResult } from "./seo"

/**
 * Analyzes SEO data using Groq and generates recommendations
 * @param seoData - SEO analysis data
 * @returns AI-generated SEO recommendations as text
 */
export async function analyzeSEOWithAI(
  seoData: SEOAnalysisResult
): Promise<string> {
  try {
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured in the environment variables")
    }

    const client = new Groq({ apiKey })

    // Build the prompt with the SEO data
    const prompt = `You are an SEO expert. Analyze the following data from a website and generate specific, actionable recommendations to improve its SEO.

SEO analysis data:
- Title: "${seoData.title}" (${seoData.title.length} characters)
- Meta Description: "${seoData.metaDescription}" (${seoData.metaDescription.length} characters)
- H1 count: ${seoData.h1Count}
- H2 count: ${seoData.h2Count}
- Images without alt attribute: ${seoData.imagesWithoutAlt}
- Internal links: ${seoData.internalLinks}
- SEO Score: ${seoData.seoScore}/10

Generate specific, actionable SEO recommendations based on this data. Include:
1. Title analysis (optimal length: 30-60 characters)
2. Meta description analysis (optimal length: 120-160 characters)
3. Recommendations on heading structure (H1, H2)
4. Recommendations on images and alt attributes
5. Recommendations on internal links
6. General recommendations to improve the SEO Score

Respond in English, be concise but specific. Format the response with bullet points and be practical.`

    // Call the API
    const chatCompletion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    // Extract the text from the response
    const recommendations = chatCompletion.choices[0]?.message?.content || "Recommendations could not be generated."

    return recommendations
  } catch (error) {
    console.error("Error generating AI recommendations:", error)
    
    // On error, return a basic fallback message
    return `Error generating AI recommendations: ${
      error instanceof Error ? error.message : "Unknown error"
    }. Please check the GROQ_API_KEY configuration.`
  }
}
