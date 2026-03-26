"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

interface Problem {
  title: string
  severity: "critical" | "high" | "medium"
  impact: string
  description: string
}

const problems: Problem[] = [
  { title: "Velocidad Web Baja", severity: "critical", impact: "Alto", description: "El tiempo de carga promedio es de 4.2s, afectando la experiencia del usuario y el SEO." },
  { title: "SEO Débil", severity: "high", impact: "Medio-Alto", description: "Faltan meta tags optimizados y estructura de datos estructurados." },
  { title: "Abandono de Carrito Alto", severity: "high", impact: "Alto", description: "Tasa de abandono del 68%, principalmente en el proceso de checkout." },
]

const sans = { fontFamily: "'Inter', sans-serif" }

export function ProblemsSection() {
  const getSeverityColor = (severity: string) => {
    if (severity === "critical") return "destructive"
    if (severity === "high") return "warning"
    return "secondary"
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle
          className="flex items-center gap-2"
          style={{ ...sans, fontWeight: 500, fontSize: "16px" }}
        >
          <AlertTriangle className="h-5 w-5" />
          Problemas Detectados
        </CardTitle>
        <CardDescription style={{ ...sans, fontSize: "13px" }}>
          Problemas críticos que requieren atención inmediata
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {problems.map((p, i) => (
            <div
              key={i}
              className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 style={{ ...sans, fontSize: "13px", fontWeight: 500 }}>{p.title}</h4>
                  <Badge variant={getSeverityColor(p.severity)} style={{ ...sans, fontSize: "11px" }}>
                    {p.severity}
                  </Badge>
                </div>
                <p style={{ ...sans, fontSize: "13px", color: "rgba(13,13,15,0.5)" }}>{p.description}</p>
                <p style={{ ...sans, fontSize: "12px", color: "rgba(13,13,15,0.4)" }}>
                  Impacto: <strong style={{ fontWeight: 500 }}>{p.impact}</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}