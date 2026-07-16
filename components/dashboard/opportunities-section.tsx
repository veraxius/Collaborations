"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Opportunity {
  title: string
  category: string
  potential: string
  description: string
}

const opportunities: Opportunity[] = [
  { title: "New SEO Keywords", category: "SEO", potential: "High", description: "15 high-volume, low-competition keywords identified." },
  { title: "Optimize Pages", category: "Performance", potential: "Medium", description: "3 main pages can improve their speed by 40%." },
  { title: "Improve Conversion", category: "Marketing", potential: "High", description: "A/B testing on CTAs can increase conversion by 25%." },
]

const sans = { fontFamily: "'Inter', sans-serif" }

export function OpportunitiesSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle
          className="flex items-center gap-2"
          style={{ ...sans, fontWeight: 500, fontSize: "16px" }}
        >
          <Sparkles className="h-5 w-5" />
          Opportunities
        </CardTitle>
        <CardDescription style={{ ...sans, fontSize: "13px" }}>
          Growth opportunities detected by AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.map((op, i) => (
            <div
              key={i}
              className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 style={{ ...sans, fontSize: "13px", fontWeight: 500 }}>{op.title}</h4>
                  <Badge variant="success" style={{ ...sans, fontSize: "11px" }}>{op.category}</Badge>
                </div>
                <p style={{ ...sans, fontSize: "13px", color: "rgba(13,13,15,0.5)" }}>{op.description}</p>
                <p style={{ ...sans, fontSize: "12px", color: "rgba(13,13,15,0.4)" }}>
                  Potential: <strong style={{ fontWeight: 500 }}>{op.potential}</strong>
                </p>
              </div>
              <Button variant="ghost" size="icon">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}