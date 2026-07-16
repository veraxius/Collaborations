"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, CheckCircle2 } from "lucide-react"
import { AIChat } from "@/components/dashboard/ai-chat"

const recommendations = [
  {
    id: 1,
    title: "Optimize loading speed",
    category: "Performance",
    priority: "High",
    description: "Implementing image lazy loading and minifying CSS/JS can reduce load time by 40%.",
    impact: "High",
    effort: "Medium",
    status: "pending"
  },
  {
    id: 2,
    title: "Improve meta descriptions",
    category: "SEO",
    priority: "Medium",
    description: "Adding unique, optimized meta descriptions to the 20 main pages will improve search CTR.",
    impact: "Medium",
    effort: "Low",
    status: "pending"
  },
  {
    id: 3,
    title: "Implement schema markup",
    category: "SEO",
    priority: "High",
    description: "Adding structured data (Schema.org) will improve visibility in search results.",
    impact: "High",
    effort: "Medium",
    status: "in-progress"
  },
  {
    id: 4,
    title: "Optimize contact form",
    category: "Conversion",
    priority: "Medium",
    description: "Simplifying the contact form from 8 fields to 4 can increase conversions by 30%.",
    impact: "Medium",
    effort: "Low",
    status: "completed"
  },
]

export default function AIRecommendationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Recommendations</h1>
        <p className="text-muted-foreground">
          Smart recommendations based on the analysis of your business
        </p>
      </div>

      {/* AI Chat */}
      <AIChat />

      <div className="grid gap-6">
        {recommendations.map((rec) => (
          <Card key={rec.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{rec.title}</CardTitle>
                    {rec.status === "completed" && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <CardDescription>{rec.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Badge variant="secondary">{rec.category}</Badge>
                <Badge variant={rec.priority === "High" ? "destructive" : "secondary"}>
                  Priority: {rec.priority}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Impact: <strong>{rec.impact}</strong>
                </span>
                <span className="text-sm text-muted-foreground">
                  Effort: <strong>{rec.effort}</strong>
                </span>
                <Badge variant={rec.status === "completed" ? "success" : rec.status === "in-progress" ? "warning" : "outline"}>
                  {rec.status === "completed" ? "Completed" : rec.status === "in-progress" ? "In Progress" : "Pending"}
                </Badge>
              </div>
              {rec.status !== "completed" && (
                <Button>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Apply Recommendation
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
