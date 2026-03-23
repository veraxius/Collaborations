import axios from "axios"

export interface PerformanceAnalysisResult {
  performanceScore: number
}

/**
 * Analiza el rendimiento de un sitio web usando Google PageSpeed Insights API
 * @param url - URL del sitio a analizar (ej: "empresa.com" o "https://empresa.com")
 * @returns Objeto con el score de rendimiento (0-100)
 */
export async function analyzePerformance(
  url: string
): Promise<PerformanceAnalysisResult> {
  try {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY

    if (!apiKey) {
      throw new Error("GOOGLE_PAGESPEED_API_KEY no está configurada en las variables de entorno")
    }

    // Normalizar la URL - agregar https:// si no tiene protocolo
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    // Llamar a la API de Google PageSpeed Insights
    const response = await axios.get("https://www.googleapis.com/pagespeedonline/v5/runPagespeed", {
      params: {
        url: normalizedUrl,
        key: apiKey,
        strategy: "desktop", // Puede ser "desktop" o "mobile"
      },
      timeout: 60000, // 60 segundos de timeout (PageSpeed puede tardar)
    })

    // Obtener el score de performance
    const performanceScore =
      response.data?.lighthouseResult?.categories?.performance?.score

    if (performanceScore === undefined || performanceScore === null) {
      throw new Error("No se pudo obtener el score de performance de la API")
    }

    // Convertir el score de 0-1 a 0-100
    const performanceScorePercent = Math.round(performanceScore * 100)

    return {
      performanceScore: performanceScorePercent,
    }
  } catch (error) {
    console.error("Error analizando performance:", error)
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error("URL inválida o no accesible")
      } else if (error.response?.status === 403) {
        throw new Error("API Key inválida o sin permisos")
      } else if (error.response?.status === 429) {
        throw new Error("Límite de solicitudes excedido. Intenta más tarde")
      }
    }

    throw new Error(
      `Error al analizar el rendimiento: ${error instanceof Error ? error.message : "Error desconocido"}`
    )
  }
}
