"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface BusinessScoreProps {
  score: number
  metrics: {
    seo: number
    marketing: number
    performance: number
    conversion: number
  }
}

const metricLabels = ["SEO", "Marketing", "Web Performance", "Conversion"]

export function BusinessScore({ score, metrics }: BusinessScoreProps) {
  const getScoreColor = (s: number) => {
    if (s >= 8) return "#0A7B6B"
    if (s >= 6) return "#2563EB"
    return "#E8503A"
  }

  const metricValues = [
    metrics.seo,
    metrics.marketing,
    metrics.performance,
    metrics.conversion,
  ]

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "16px" }}
        >
          Business Score
        </CardTitle>
        <CardDescription
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px" }}
        >
          Overall indicator of business health
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex items-baseline gap-2">
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "40px",
                  fontWeight: 500,
                  color: getScoreColor(score),
                  lineHeight: 1,
                }}
              >
                {score.toFixed(1)}
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "20px",
                  color: "rgba(13,13,15,0.4)",
                }}
              >
                / 10
              </span>
            </div>
            <p
              className="mt-1"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(13,13,15,0.5)" }}
            >
              Based on SEO, Marketing, Web Performance, and Conversion
            </p>
          </div>

          <div className="space-y-4">
            {metricLabels.map((label, i) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between">
                  <span
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 500 }}
                  >
                    {label}
                  </span>
                  <span
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(13,13,15,0.5)" }}
                  >
                    {metricValues[i]}/10
                  </span>
                </div>
                <Progress value={metricValues[i] * 10} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}