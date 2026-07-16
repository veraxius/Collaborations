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
    title: "Traffic Dropped 18%",
    description: "Website traffic decreased significantly this week.",
    time: "2 hours ago",
    icon: <TrendingDown className="h-4 w-4" />
  },
  {
    type: "warning",
    title: "Competitor Launched New Campaign",
    description: "Competitor A launched a new digital marketing campaign.",
    time: "5 hours ago",
    icon: <Users className="h-4 w-4" />
  },
  {
    type: "success",
    title: "SEO Improved This Week",
    description: "SEO ranking improved by 3 positions thanks to the optimizations.",
    time: "1 day ago",
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
          Recent Alerts
        </CardTitle>
        <CardDescription style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px" }}>
          Important changes detected
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