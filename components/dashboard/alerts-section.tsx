"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bell, TrendingDown, TrendingUp, Users } from "lucide-react"

interface AlertItem {
  type: "warning" | "success" | "destructive"
  title: string
  description: string
  time: string
  icon: React.ReactNode
}

const alerts: AlertItem[] = [
  {
    type: "destructive",
    title: "Tráfico Bajó 18%",
    description: "El tráfico del sitio web disminuyó significativamente esta semana.",
    time: "Hace 2 horas",
    icon: <TrendingDown className="h-4 w-4" />
  },
  {
    type: "warning",
    title: "Competidor Lanzó Nueva Campaña",
    description: "Competidor A lanzó una nueva campaña de marketing digital.",
    time: "Hace 5 horas",
    icon: <Users className="h-4 w-4" />
  },
  {
    type: "success",
    title: "SEO Mejoró Esta Semana",
    description: "El ranking SEO mejoró en 3 posiciones gracias a las optimizaciones.",
    time: "Hace 1 día",
    icon: <TrendingUp className="h-4 w-4" />
  },
]

export function AlertsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle
          className="flex items-center gap-2"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "16px" }}
        >
          <Bell className="h-5 w-5" />
          Alertas Recientes
        </CardTitle>
        <CardDescription style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px" }}>
          Cambios importantes detectados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type}>
              <div className="flex items-start gap-3">
                {alert.icon}
                <div className="flex-1">
                  <AlertTitle
                    style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px" }}
                  >
                    {alert.title}
                  </AlertTitle>
                  <AlertDescription
                    className="mt-1"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px" }}
                  >
                    {alert.description}
                  </AlertDescription>
                  <p
                    className="mt-2 text-xs text-muted-foreground"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {alert.time}
                  </p>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}