import Groq from "groq-sdk"
import { SEOAnalysisResult } from "./seo"

/**
 * Analiza los datos SEO usando Groq y genera recomendaciones
 * @param seoData - Datos del análisis SEO
 * @returns Recomendaciones SEO en texto generadas por IA
 */
export async function analyzeSEOWithAI(
  seoData: SEOAnalysisResult
): Promise<string> {
  try {
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      throw new Error("GROQ_API_KEY no está configurada en las variables de entorno")
    }

    const client = new Groq({ apiKey })

    // Crear el prompt con los datos SEO
    const prompt = `Eres un experto en SEO. Analiza los siguientes datos de un sitio web y genera recomendaciones específicas y accionables para mejorar el SEO.

Datos del análisis SEO:
- Título: "${seoData.title}" (${seoData.title.length} caracteres)
- Meta Description: "${seoData.metaDescription}" (${seoData.metaDescription.length} caracteres)
- Cantidad de H1: ${seoData.h1Count}
- Cantidad de H2: ${seoData.h2Count}
- Imágenes sin atributo alt: ${seoData.imagesWithoutAlt}
- Enlaces internos: ${seoData.internalLinks}
- SEO Score: ${seoData.seoScore}/10

Genera recomendaciones SEO específicas y accionables basadas en estos datos. Incluye:
1. Análisis del título (longitud óptima: 30-60 caracteres)
2. Análisis de la meta description (longitud óptima: 120-160 caracteres)
3. Recomendaciones sobre estructura de encabezados (H1, H2)
4. Recomendaciones sobre imágenes y atributos alt
5. Recomendaciones sobre enlaces internos
6. Recomendaciones generales para mejorar el SEO Score

Responde en español, sé conciso pero específico. Formatea la respuesta con viñetas y sé práctico.`

    // Llamar a la API
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

    // Extraer el texto de la respuesta
    const recommendations = chatCompletion.choices[0]?.message?.content || "No se pudo generar recomendaciones."

    return recommendations
  } catch (error) {
    console.error("Error generando recomendaciones con IA:", error)
    
    // En caso de error, devolver recomendaciones básicas
    return `Error al generar recomendaciones con IA: ${
      error instanceof Error ? error.message : "Error desconocido"
    }. Por favor, revisa la configuración de GROQ_API_KEY.`
  }
}
