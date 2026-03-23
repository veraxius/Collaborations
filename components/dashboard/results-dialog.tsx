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
          <DialogTitle className="text-2xl">Análisis Completado</DialogTitle>
          <DialogDescription>
            Resultados del análisis para <strong>{companyName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Información de la Empresa */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-lg font-semibold">{companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sitio Web</p>
                  <p className="text-lg font-semibold">{website}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Score */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Análisis SEO</CardTitle>
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
                  <p className="text-sm font-medium">Título</p>
                  <p className="text-sm text-muted-foreground">{seoAnalysis.title}</p>
                  <div className="flex items-center gap-2">
                    {seoAnalysis.title.length >= 30 && seoAnalysis.title.length <= 60 ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Longitud óptima
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {seoAnalysis.title.length < 30 ? "Muy corto" : "Muy largo"}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {seoAnalysis.title.length} caracteres
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
                        Longitud óptima
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {seoAnalysis.metaDescription.length < 120
                          ? "Muy corta"
                          : "Muy larga"}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {seoAnalysis.metaDescription.length} caracteres
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Encabezados H1</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold">{seoAnalysis.h1Count}</span>
                    {seoAnalysis.h1Count === 1 ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Óptimo
                      </Badge>
                    ) : seoAnalysis.h1Count === 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Falta H1
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Múltiples H1
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Encabezados H2</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold">{seoAnalysis.h2Count}</span>
                    {seoAnalysis.h2Count >= 2 ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Buena estructura
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pocos H2
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Imágenes sin Alt</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold">{seoAnalysis.imagesWithoutAlt}</span>
                    {seoAnalysis.imagesWithoutAlt === 0 ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Todas tienen alt
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Requieren alt
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Enlaces Internos</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold">{seoAnalysis.internalLinks}</span>
                    {seoAnalysis.internalLinks >= 10 ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Excelente
                      </Badge>
                    ) : seoAnalysis.internalLinks >= 5 ? (
                      <Badge variant="secondary" className="text-xs">
                        Bueno
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pocos enlaces
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
                <CardTitle>Análisis de Rendimiento</CardTitle>
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
                Análisis realizado con Google PageSpeed Insights
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
                      ✅ Excelente: Tu sitio tiene un rendimiento óptimo
                    </span>
                  ) : performanceAnalysis.performanceScore >= 50 ? (
                    <span className="text-yellow-600 font-medium">
                      ⚠️ Mejorable: Hay oportunidades de optimización
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      ❌ Necesita Mejoras: El rendimiento es bajo y requiere atención
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recomendaciones de IA */}
          {aiRecommendations && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>Recomendaciones de IA</CardTitle>
                </div>
                <CardDescription>
                  Recomendaciones generadas por Google Gemini basadas en el análisis SEO
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
