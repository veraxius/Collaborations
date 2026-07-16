import axios from "axios"

export interface PerformanceAnalysisResult {
  performanceScore: number
}

/**
 * Analyzes a website's performance using the Google PageSpeed Insights API
 * @param url - URL of the site to analyze (e.g. "empresa.com" or "https://empresa.com")
 * @returns Object with the performance score (0-100)
 */
export async function analyzePerformance(
  url: string
): Promise<PerformanceAnalysisResult> {
  try {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY

    if (!apiKey) {
      throw new Error("GOOGLE_PAGESPEED_API_KEY is not configured in the environment variables")
    }

    // Normalize the URL - add https:// if it has no protocol
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    // Call the Google PageSpeed Insights API
    const response = await axios.get("https://www.googleapis.com/pagespeedonline/v5/runPagespeed", {
      params: {
        url: normalizedUrl,
        key: apiKey,
        strategy: "desktop", // Can be "desktop" or "mobile"
      },
      timeout: 60000, // 60-second timeout (PageSpeed can be slow)
    })

    // Get the performance score
    const performanceScore =
      response.data?.lighthouseResult?.categories?.performance?.score

    if (performanceScore === undefined || performanceScore === null) {
      throw new Error("Could not get the performance score from the API")
    }

    // Convert the score from 0-1 to 0-100
    const performanceScorePercent = Math.round(performanceScore * 100)

    return {
      performanceScore: performanceScorePercent,
    }
  } catch (error) {
    console.error("Error analyzing performance:", error)
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error("Invalid or inaccessible URL")
      } else if (error.response?.status === 403) {
        throw new Error("Invalid API key or missing permissions")
      } else if (error.response?.status === 429) {
        throw new Error("Request limit exceeded. Try again later")
      }
    }

    throw new Error(
      `Error analyzing performance: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}
