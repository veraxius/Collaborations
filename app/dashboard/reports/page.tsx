"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"

const reports = [
  {
    id: 1,
    title: "Monthly Report - January 2024",
    description: "Complete analysis of the month's performance",
    date: "2024-01-31",
    type: "Monthly"
  },
  {
    id: 2,
    title: "SEO Analysis - Week 4",
    description: "Weekly SEO metrics report",
    date: "2024-01-28",
    type: "Weekly"
  },
  {
    id: 3,
    title: "Competitor Comparison",
    description: "Comparative analysis with main competitors",
    date: "2024-01-25",
    type: "Special"
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and download analysis reports
          </p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Generate New Report
        </Button>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </div>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Date: {report.date}</span>
                <span>Type: {report.type}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
