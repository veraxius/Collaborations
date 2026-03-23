"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Globe, TrendingUp, Users, Search, FileText, Image, Link2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

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

interface CompanyData {
  companyName: string
  website: string
  seoAnalysis: SEOAnalysis
  performanceAnalysis?: PerformanceAnalysis
  createdAt: string
}

export default function CompanyAnalysisPage() {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentCompany")
      if (stored) {
        try {
          setCompanyData(JSON.parse(stored))
        } catch (error) {
          console.error("Error parsing company data:", error)
        }
      }
      setLoading(false)
    }
  }, [])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Análisis de Empresa</h1>
        <p className="text-muted-foreground">
          Análisis detallado de tu empresa
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sitio Web</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {companyData?.website || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {companyData ? "Dominio activo" : "Sin empresa seleccionada"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tráfico Mensual</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45.2K</div>
                <p className="text-xs text-muted-foreground">+12.5% vs mes anterior</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visitas Únicas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">32.8K</div>
                <p className="text-xs text-muted-foreground">+8.2% vs mes anterior</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Rebote</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42%</div>
                <p className="text-xs text-muted-foreground">-3.1% vs mes anterior</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          {companyData ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Análisis SEO</CardTitle>
                      <CardDescription>
                        Métricas de optimización para motores de búsqueda
                      </CardDescription>
                    </div>
                    <Badge variant={companyData.seoAnalysis.seoScore >= 7 ? "success" : companyData.seoAnalysis.seoScore >= 5 ? "warning" : "destructive"}>
                      Score: {companyData.seoAnalysis.seoScore}/10
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">SEO Score</span>
                      <span className="text-sm text-muted-foreground">
                        {companyData.seoAnalysis.seoScore}/10
                      </span>
                    </div>
                    <Progress
                      value={companyData.seoAnalysis.seoScore * 10}
                      className="h-3"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">Título</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{companyData.seoAnalysis.title}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Longitud: {companyData.seoAnalysis.title.length} caracteres
                          {companyData.seoAnalysis.title.length >= 30 &&
                          companyData.seoAnalysis.title.length <= 60 ? (
                            <Badge variant="success" className="ml-2">Óptimo</Badge>
                          ) : (
                            <Badge variant="warning" className="ml-2">
                              {companyData.seoAnalysis.title.length < 30
                                ? "Muy corto"
                                : "Muy largo"}
                            </Badge>
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">Meta Description</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{companyData.seoAnalysis.metaDescription}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Longitud: {companyData.seoAnalysis.metaDescription.length} caracteres
                          {companyData.seoAnalysis.metaDescription.length >= 120 &&
                          companyData.seoAnalysis.metaDescription.length <= 160 ? (
                            <Badge variant="success" className="ml-2">Óptimo</Badge>
                          ) : (
                            <Badge variant="warning" className="ml-2">
                              {companyData.seoAnalysis.metaDescription.length < 120
                                ? "Muy corta"
                                : "Muy larga"}
                            </Badge>
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">Encabezados H1</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {companyData.seoAnalysis.h1Count}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {companyData.seoAnalysis.h1Count === 1 ? (
                            <Badge variant="success">Óptimo (1 H1)</Badge>
                          ) : companyData.seoAnalysis.h1Count === 0 ? (
                            <Badge variant="destructive">Falta H1</Badge>
                          ) : (
                            <Badge variant="warning">
                              Múltiples H1 ({companyData.seoAnalysis.h1Count})
                            </Badge>
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">Encabezados H2</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {companyData.seoAnalysis.h2Count}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {companyData.seoAnalysis.h2Count >= 2 ? (
                            <Badge variant="success">Buena estructura</Badge>
                          ) : (
                            <Badge variant="warning">Pocos H2</Badge>
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">Imágenes sin Alt</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {companyData.seoAnalysis.imagesWithoutAlt}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {companyData.seoAnalysis.imagesWithoutAlt === 0 ? (
                            <Badge variant="success">Todas tienen alt</Badge>
                          ) : (
                            <Badge variant="warning">
                              Requieren atributo alt
                            </Badge>
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">Enlaces Internos</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {companyData.seoAnalysis.internalLinks}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {companyData.seoAnalysis.internalLinks >= 10 ? (
                            <Badge variant="success">Excelente</Badge>
                          ) : companyData.seoAnalysis.internalLinks >= 5 ? (
                            <Badge variant="secondary">Bueno</Badge>
                          ) : (
                            <Badge variant="warning">Pocos enlaces</Badge>
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Análisis SEO</CardTitle>
                <CardDescription>
                  Métricas de optimización para motores de búsqueda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No hay datos de análisis SEO disponibles. Añade una empresa para comenzar.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {companyData?.performanceAnalysis ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Rendimiento del Sitio</CardTitle>
                    <CardDescription>
                      Métricas de velocidad y rendimiento (Google PageSpeed Insights)
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      companyData.performanceAnalysis.performanceScore >= 90
                        ? "success"
                        : companyData.performanceAnalysis.performanceScore >= 50
                        ? "warning"
                        : "destructive"
                    }
                  >
                    Score: {companyData.performanceAnalysis.performanceScore}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Performance Score</span>
                    <span className="text-sm text-muted-foreground">
                      {companyData.performanceAnalysis.performanceScore}/100
                    </span>
                  </div>
                  <Progress
                    value={companyData.performanceAnalysis.performanceScore}
                    className="h-3"
                  />
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {companyData.performanceAnalysis.performanceScore >= 90 ? (
                        <span className="text-green-600 font-medium">
                          ✅ Excelente: Tu sitio tiene un rendimiento óptimo
                        </span>
                      ) : companyData.performanceAnalysis.performanceScore >= 50 ? (
                        <span className="text-yellow-600 font-medium">
                          ⚠️ Mejorable: Hay oportunidades de optimización
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          ❌ Necesita Mejoras: El rendimiento es bajo y requiere atención
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Este score se basa en el análisis de Google PageSpeed Insights y evalúa
                      métricas como velocidad de carga, tiempo de interacción, y optimización de
                      recursos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento del Sitio</CardTitle>
                <CardDescription>
                  Métricas de velocidad y rendimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No hay datos de rendimiento disponibles. Añade una empresa para comenzar.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Marketing</CardTitle>
              <CardDescription>Estrategias y métricas de marketing</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Análisis de marketing...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
