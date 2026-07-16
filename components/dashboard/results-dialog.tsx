"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, AlertCircle, Sparkles } from "lucide-react"

interface SEOAnalysis {
  title: string
  metaDescription: string
  h1Count: number
  h2Count: number
  imagesWithoutAlt: number
  internalLinks: number
  seoScore: number
}

interface PerformanceAnalysis {
  performanceScore: number
}

interface ResultsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyName: string
  website: string
  seoAnalysis: SEOAnalysis
  performanceAnalysis: PerformanceAnalysis
  aiRecommendations?: string
}

export function ResultsDialog({
  open,
  onOpenChange,
  companyName,
  website,
  seoAnalysis,
  performanceAnalysis,
  aiRecommendations,
}: ResultsDialogProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600"
    if (score >= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Analysis Completed</DialogTitle>
          <DialogDescription>
            Analysis results for <strong>{companyName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg font-semibold">{companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Website</p>
                  <p className="text-lg font-semibold">{website}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Score */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>SEO Analysis</CardTitle>
                <Badge
                  variant={
                    seoAnalysis.seoScore >= 8
                      ? "success"
                      : seoAnalysis.seoScore >= 6
                      ? "warning"
                      : "destructive"
                  }
                >
                  Score: {seoAnalysis.seoScore}/10
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">SEO Score</span>
                  <span className={`text-sm font-bold ${getScoreColor(seoAnalysis.seoScore)}`}>
                    {seoAnalysis.seoScore}/10
                  </span>
                </div>
                <Progress value={seoAnalysis.seoScore * 10} className="h-3" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Title</p>
                  <p className="text-sm text-muted-foreground">{seoAnalysis.title}</p>
                  <div className="flex items-center gap-2">
                    {seoAnalysis.title.length >= 30 && seoAnalysis.title.length <= 60 ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Optimal length
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {seoAnalysis.title.length < 30 ? "Too short" : "Too long"}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {seoAnalysis.title.length} characters
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Meta Description</p>
                  <p className="text-sm text-muted-foreground">
                    {seoAnalysis.metaDescription}
                  </p>
                  <div className="flex items-center gap-2">
                    {seoAnalysis.metaDescription.length >= 120 &&
                    seoAnalysis.metaDescription.length <= 160 ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Optimal length
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {seoAnalysis.metaDescription.length < 120
                          ? "Too short"
                          : "Too long"}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {seoAnalysis.metaDescription.length} characters
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">H1 Headings</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold">{seoAnalysis.h1Count}</span>
                    {seoAnalysis.h1Count === 1 ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Optimal
                      </Badge>
                    ) : seoAnalysis.h1Count === 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Missing H1
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Multiple H1s
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">H2 Headings</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold">{seoAnalysis.h2Count}</span>
                    {seoAnalysis.h2Count >= 2 ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Good structure
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Few H2s
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Images without Alt</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold">{seoAnalysis.imagesWithoutAlt}</span>
                    {seoAnalysis.imagesWithoutAlt === 0 ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        All have alt
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Alt required
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Internal Links</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold">{seoAnalysis.internalLinks}</span>
                    {seoAnalysis.internalLinks >= 10 ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Excellent
                      </Badge>
                    ) : seoAnalysis.internalLinks >= 5 ? (
                      <Badge variant="secondary" className="text-xs">
                        Good
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Few links
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Score */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Performance Analysis</CardTitle>
                <Badge
                  variant={
                    performanceAnalysis.performanceScore >= 90
                      ? "success"
                      : performanceAnalysis.performanceScore >= 50
                      ? "warning"
                      : "destructive"
                  }
                >
                  Score: {performanceAnalysis.performanceScore}/100
                </Badge>
              </div>
              <CardDescription>
                Analysis performed with Google PageSpeed Insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Performance Score</span>
                  <span
                    className={`text-sm font-bold ${getPerformanceColor(
                      performanceAnalysis.performanceScore
                    )}`}
                  >
                    {performanceAnalysis.performanceScore}/100
                  </span>
                </div>
                <Progress
                  value={performanceAnalysis.performanceScore}
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {performanceAnalysis.performanceScore >= 90 ? (
                    <span className="text-green-600 font-medium">
                      ✅ Excellent: Your site has optimal performance
                    </span>
                  ) : performanceAnalysis.performanceScore >= 50 ? (
                    <span className="text-yellow-600 font-medium">
                      ⚠️ Could be better: There are optimization opportunities
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      ❌ Needs Improvement: Performance is low and requires attention
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          {aiRecommendations && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>AI Recommendations</CardTitle>
                </div>
                <CardDescription>
                  Recommendations generated by Google Gemini based on the SEO analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                    {aiRecommendations}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
