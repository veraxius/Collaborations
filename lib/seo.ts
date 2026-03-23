import axios from "axios"
import * as cheerio from "cheerio"

export interface SEOAnalysisResult {
  title: string
  metaDescription: string
  h1Count: number
  h2Count: number
  imagesWithoutAlt: number
  internalLinks: number
  seoScore: number
}

/**
 * Analiza el SEO de un sitio web
 * @param url - URL del sitio a analizar (ej: "empresa.com" o "https://empresa.com")
 * @returns Objeto con las métricas SEO analizadas
 */
export async function analyzeSEO(url: string): Promise<SEOAnalysisResult> {
  try {
    // Normalizar la URL - agregar https:// si no tiene protocolo
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    // Descargar el HTML del sitio
    const response = await axios.get(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000, // 10 segundos de timeout
      maxRedirects: 5,
    })

    const html = response.data
    const $ = cheerio.load(html)

    // Extraer el dominio base para identificar enlaces internos
    const urlObj = new URL(normalizedUrl)
    const baseDomain = urlObj.hostname.replace("www.", "")

    // 1. Title
    const title = $("title").first().text().trim() || "Sin título"

    // 2. Meta description
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() || "Sin descripción"

    // 3. Cantidad de H1
    const h1Count = $("h1").length

    // 4. Cantidad de H2
    const h2Count = $("h2").length

    // 5. Imágenes sin atributo alt
    const imagesWithoutAlt = $("img")
      .filter((_, el) => !$(el).attr("alt") || $(el).attr("alt")?.trim() === "")
      .length

    // 6. Cantidad de enlaces internos
    const allLinks = $("a[href]")
    let internalLinks = 0

    allLinks.each((_, el) => {
      const href = $(el).attr("href")
      if (!href) return

      try {
        // Si es una URL absoluta
        if (href.startsWith("http://") || href.startsWith("https://")) {
          const linkUrl = new URL(href)
          const linkDomain = linkUrl.hostname.replace("www.", "")
          if (linkDomain === baseDomain) {
            internalLinks++
          }
        }
        // Si es una URL relativa (empieza con / o no tiene protocolo)
        else if (href.startsWith("/") || !href.includes("://")) {
          internalLinks++
        }
      } catch (error) {
        // Ignorar URLs inválidas
      }
    })

    // 7. Calcular SEO Score (0-10)
    // Fórmula simple basada en las métricas
    let score = 0

    // Title (2 puntos): existe y tiene longitud adecuada (30-60 caracteres)
    if (title && title !== "Sin título") {
      if (title.length >= 30 && title.length <= 60) {
        score += 2
      } else if (title.length > 0) {
        score += 1
      }
    }

    // Meta description (2 puntos): existe y tiene longitud adecuada (120-160 caracteres)
    if (metaDescription && metaDescription !== "Sin descripción") {
      if (metaDescription.length >= 120 && metaDescription.length <= 160) {
        score += 2
      } else if (metaDescription.length > 0) {
        score += 1
      }
    }

    // H1 (1.5 puntos): tiene exactamente 1 H1
    if (h1Count === 1) {
      score += 1.5
    } else if (h1Count > 1) {
      score += 0.5 // Tiene H1 pero más de uno
    }

    // H2 (1 punto): tiene al menos 2 H2 (buena estructura)
    if (h2Count >= 2) {
      score += 1
    } else if (h2Count === 1) {
      score += 0.5
    }

    // Imágenes sin alt (1.5 puntos): penalizar si hay muchas sin alt
    const totalImages = $("img").length
    if (totalImages > 0) {
      const altPercentage = ((totalImages - imagesWithoutAlt) / totalImages) * 100
      if (altPercentage >= 90) {
        score += 1.5
      } else if (altPercentage >= 70) {
        score += 1
      } else if (altPercentage >= 50) {
        score += 0.5
      }
    }

    // Enlaces internos (2 puntos): tener enlaces internos es bueno para SEO
    if (internalLinks >= 10) {
      score += 2
    } else if (internalLinks >= 5) {
      score += 1.5
    } else if (internalLinks >= 1) {
      score += 1
    }

    // Normalizar el score a 0-10
    const seoScore = Math.min(10, Math.max(0, score))

    return {
      title,
      metaDescription,
      h1Count,
      h2Count,
      imagesWithoutAlt,
      internalLinks,
      seoScore: Math.round(seoScore * 10) / 10, // Redondear a 1 decimal
    }
  } catch (error) {
    // En caso de error, devolver valores por defecto
    console.error("Error analizando SEO:", error)
    throw new Error(
      `Error al analizar el sitio: ${error instanceof Error ? error.message : "Error desconocido"}`
    )
  }
}
