"use client"

import { ProblemsSection } from "@/components/dashboard/problems-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

export default function ProblemsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Detected Problems</h1>
        <p className="text-muted-foreground">
          Complete list of problems identified in your business
        </p>
      </div>
      <ProblemsSection />
    </div>
  )
}
