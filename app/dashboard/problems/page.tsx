"use client"

import { ProblemsSection } from "@/components/dashboard/problems-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

export default function ProblemsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Problemas Detectados</h1>
        <p className="text-muted-foreground">
          Lista completa de problemas identificados en tu negocio
        </p>
      </div>
      <ProblemsSection />
    </div>
  )
}
