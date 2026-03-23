"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"

const reports = [
  {
    id: 1,
    title: "Reporte Mensual - Enero 2024",
    description: "Análisis completo del rendimiento del mes",
    date: "2024-01-31",
    type: "Mensual"
  },
  {
    id: 2,
    title: "Análisis SEO - Semana 4",
    description: "Reporte semanal de métricas SEO",
    date: "2024-01-28",
    type: "Semanal"
  },
  {
    id: 3,
    title: "Comparativa de Competidores",
    description: "Análisis comparativo con competidores principales",
    date: "2024-01-25",
    type: "Especial"
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Genera y descarga reportes de análisis
          </p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Generar Nuevo Reporte
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
                <span>Fecha: {report.date}</span>
                <span>Tipo: {report.type}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
