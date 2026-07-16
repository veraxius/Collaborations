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
        <h1 className="text-3xl font-bold tracking-tight">Company Analysis</h1>
        <p className="text-muted-foreground">
          Detailed analysis of your company
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Website</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {companyData?.website || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {companyData ? "Active domain" : "No company selected"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Traffic</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45.2K</div>
                <p className="text-xs text-muted-foreground">+12.5% vs last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Visits</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">32.8K</div>
                <p className="text-xs text-muted-foreground">+8.2% vs last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42%</div>
                <p className="text-xs text-muted-foreground">-3.1% vs last month</p>
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
                      <CardTitle>SEO Analysis</CardTitle>
                      <CardDescription>
                        Search engine optimization metrics
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
                          <CardTitle className="text-sm">Title</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{companyData.seoAnalysis.title}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Length: {companyData.seoAnalysis.title.length} characters
                          {companyData.seoAnalysis.title.length >= 30 &&
                          companyData.seoAnalysis.title.length <= 60 ? (
                            <Badge variant="success" className="ml-2">Optimal</Badge>
                          ) : (
                            <Badge variant="warning" className="ml-2">
                              {companyData.seoAnalysis.title.length < 30
                                ? "Too short"
                                : "Too long"}
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
                          Length: {companyData.seoAnalysis.metaDescription.length} characters
                          {companyData.seoAnalysis.metaDescription.length >= 120 &&
                          companyData.seoAnalysis.metaDescription.length <= 160 ? (
                            <Badge variant="success" className="ml-2">Optimal</Badge>
                          ) : (
                            <Badge variant="warning" className="ml-2">
                              {companyData.seoAnalysis.metaDescription.length < 120
                                ? "Too short"
                                : "Too long"}
                            </Badge>
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">H1 Headings</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {companyData.seoAnalysis.h1Count}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {companyData.seoAnalysis.h1Count === 1 ? (
                            <Badge variant="success">Optimal (1 H1)</Badge>
                          ) : companyData.seoAnalysis.h1Count === 0 ? (
                            <Badge variant="destructive">Missing H1</Badge>
                          ) : (
                            <Badge variant="warning">
                              Multiple H1s ({companyData.seoAnalysis.h1Count})
                            </Badge>
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">H2 Headings</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {companyData.seoAnalysis.h2Count}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {companyData.seoAnalysis.h2Count >= 2 ? (
                            <Badge variant="success">Good structure</Badge>
                          ) : (
                            <Badge variant="warning">Few H2s</Badge>
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">Images Without Alt</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {companyData.seoAnalysis.imagesWithoutAlt}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {companyData.seoAnalysis.imagesWithoutAlt === 0 ? (
                            <Badge variant="success">All have alt text</Badge>
                          ) : (
                            <Badge variant="warning">
                              Need an alt attribute
                            </Badge>
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">Internal Links</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {companyData.seoAnalysis.internalLinks}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {companyData.seoAnalysis.internalLinks >= 10 ? (
                            <Badge variant="success">Excellent</Badge>
                          ) : companyData.seoAnalysis.internalLinks >= 5 ? (
                            <Badge variant="secondary">Good</Badge>
                          ) : (
                            <Badge variant="warning">Few links</Badge>
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
                <CardTitle>SEO Analysis</CardTitle>
                <CardDescription>
                  Search engine optimization metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No SEO analysis data available. Add a company to get started.
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
                    <CardTitle>Site Performance</CardTitle>
                    <CardDescription>
                      Speed and performance metrics (Google PageSpeed Insights)
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
                          ✅ Excellent: Your site has optimal performance
                        </span>
                      ) : companyData.performanceAnalysis.performanceScore >= 50 ? (
                        <span className="text-yellow-600 font-medium">
                          ⚠️ Room for improvement: There are optimization opportunities
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          ❌ Needs Improvement: Performance is low and requires attention
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This score is based on Google PageSpeed Insights analysis and evaluates
                      metrics such as load speed, time to interactive, and resource
                      optimization.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Site Performance</CardTitle>
                <CardDescription>
                  Speed and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No performance data available. Add a company to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Analysis</CardTitle>
              <CardDescription>Marketing strategies and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Marketing analysis...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
