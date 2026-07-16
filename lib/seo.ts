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
 * Analyzes a website's SEO
 * @param url - URL of the site to analyze (e.g. "empresa.com" or "https://empresa.com")
 * @returns Object with the analyzed SEO metrics
 */
export async function analyzeSEO(url: string): Promise<SEOAnalysisResult> {
  try {
    // Normalize the URL - add https:// if it has no protocol
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    // Download the site's HTML
    const response = await axios.get(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000, // 10-second timeout
      maxRedirects: 5,
    })

    const html = response.data
    const $ = cheerio.load(html)

    // Extract the base domain to identify internal links
    const urlObj = new URL(normalizedUrl)
    const baseDomain = urlObj.hostname.replace("www.", "")

    // 1. Title
    const title = $("title").first().text().trim() || "No title"

    // 2. Meta description
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() || "No description"

    // 3. H1 count
    const h1Count = $("h1").length

    // 4. H2 count
    const h2Count = $("h2").length

    // 5. Images without alt attribute
    const imagesWithoutAlt = $("img")
      .filter((_, el) => !$(el).attr("alt") || $(el).attr("alt")?.trim() === "")
      .length

    // 6. Internal link count
    const allLinks = $("a[href]")
    let internalLinks = 0

    allLinks.each((_, el) => {
      const href = $(el).attr("href")
      if (!href) return

      try {
        // If it's an absolute URL
        if (href.startsWith("http://") || href.startsWith("https://")) {
          const linkUrl = new URL(href)
          const linkDomain = linkUrl.hostname.replace("www.", "")
          if (linkDomain === baseDomain) {
            internalLinks++
          }
        }
        // If it's a relative URL (starts with / or has no protocol)
        else if (href.startsWith("/") || !href.includes("://")) {
          internalLinks++
        }
      } catch (error) {
        // Ignore invalid URLs
      }
    })

    // 7. Compute SEO Score (0-10)
    // Simple formula based on the metrics
    let score = 0

    // Title (2 points): exists and has an appropriate length (30-60 characters)
    if (title && title !== "No title") {
      if (title.length >= 30 && title.length <= 60) {
        score += 2
      } else if (title.length > 0) {
        score += 1
      }
    }

    // Meta description (2 points): exists and has an appropriate length (120-160 characters)
    if (metaDescription && metaDescription !== "No description") {
      if (metaDescription.length >= 120 && metaDescription.length <= 160) {
        score += 2
      } else if (metaDescription.length > 0) {
        score += 1
      }
    }

    // H1 (1.5 points): has exactly 1 H1
    if (h1Count === 1) {
      score += 1.5
    } else if (h1Count > 1) {
      score += 0.5 // Has H1s but more than one
    }

    // H2 (1 point): has at least 2 H2s (good structure)
    if (h2Count >= 2) {
      score += 1
    } else if (h2Count === 1) {
      score += 0.5
    }

    // Images without alt (1.5 points): penalize if many are missing alt
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

    // Internal links (2 points): having internal links is good for SEO
    if (internalLinks >= 10) {
      score += 2
    } else if (internalLinks >= 5) {
      score += 1.5
    } else if (internalLinks >= 1) {
      score += 1
    }

    // Normalize the score to 0-10
    const seoScore = Math.min(10, Math.max(0, score))

    return {
      title,
      metaDescription,
      h1Count,
      h2Count,
      imagesWithoutAlt,
      internalLinks,
      seoScore: Math.round(seoScore * 10) / 10, // Round to 1 decimal
    }
  } catch (error) {
    // On error, throw with details
    console.error("Error analyzing SEO:", error)
    throw new Error(
      `Error analyzing the site: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}
