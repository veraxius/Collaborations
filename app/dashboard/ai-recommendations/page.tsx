"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, CheckCircle2 } from "lucide-react"
import { AIChat } from "@/components/dashboard/ai-chat"

const recommendations = [
  {
    id: 1,
    title: "Optimizar velocidad de carga",
    category: "Performance",
    priority: "Alta",
    description: "Implementar lazy loading de imágenes y minificar CSS/JS puede reducir el tiempo de carga en un 40%.",
    impact: "Alto",
    effort: "Medio",
    status: "pending"
  },
  {
    id: 2,
    title: "Mejorar meta descriptions",
    category: "SEO",
    priority: "Media",
    description: "Añadir meta descriptions únicas y optimizadas en las 20 páginas principales mejorará el CTR en búsquedas.",
    impact: "Medio",
    effort: "Bajo",
    status: "pending"
  },
  {
    id: 3,
    title: "Implementar schema markup",
    category: "SEO",
    priority: "Alta",
    description: "Añadir datos estructurados (Schema.org) mejorará la visibilidad en resultados de búsqueda.",
    impact: "Alto",
    effort: "Medio",
    status: "in-progress"
  },
  {
    id: 4,
    title: "Optimizar formulario de contacto",
    category: "Conversión",
    priority: "Media",
    description: "Simplificar el formulario de contacto de 8 campos a 4 puede aumentar conversiones en un 30%.",
    impact: "Medio",
    effort: "Bajo",
    status: "completed"
  },
]

export default function AIRecommendationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recomendaciones IA</h1>
        <p className="text-muted-foreground">
          Recomendaciones inteligentes basadas en el análisis de tu negocio
        </p>
      </div>

      {/* Chat con IA */}
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
                <Badge variant={rec.priority === "Alta" ? "destructive" : "secondary"}>
                  Prioridad: {rec.priority}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Impacto: <strong>{rec.impact}</strong>
                </span>
                <span className="text-sm text-muted-foreground">
                  Esfuerzo: <strong>{rec.effort}</strong>
                </span>
                <Badge variant={rec.status === "completed" ? "success" : rec.status === "in-progress" ? "warning" : "outline"}>
                  {rec.status === "completed" ? "Completado" : rec.status === "in-progress" ? "En Progreso" : "Pendiente"}
                </Badge>
              </div>
              {rec.status !== "completed" && (
                <Button>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Aplicar Recomendación
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
