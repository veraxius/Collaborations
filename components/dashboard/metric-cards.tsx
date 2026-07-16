"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, Search, Zap } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
  description?: string
}

const sans = { fontFamily: "'Inter', sans-serif" }

function MetricCard({ title, value, change, icon, description }: MetricCardProps) {
  const isPositive = change >= 0
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle style={{ ...sans, fontSize: "13px", fontWeight: 500 }}>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div style={{ ...sans, fontSize: "28px", fontWeight: 500, lineHeight: 1 }}>{value}</div>
        <div className="mt-2 flex items-center gap-2">
          <Badge
            variant={isPositive ? "success" : "destructive"}
            style={{ ...sans, fontSize: "11px", fontWeight: 500 }}
          >
            {isPositive ? "+" : ""}{change}%
          </Badge>
          <p style={{ ...sans, fontSize: "12px", color: "rgba(13,13,15,0.5)" }}>
            {description || "vs previous month"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function MetricCards() {
  const metrics = [
    { title: "Estimated Traffic", value: "45.2K", change: 12.5, icon: <Users className="h-4 w-4 text-muted-foreground" />, description: "monthly visits" },
    { title: "Monthly Growth", value: "+18%", change: 8.2, icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />, description: "vs previous month" },
    { title: "SEO Ranking", value: "#24", change: -3, icon: <Search className="h-4 w-4 text-muted-foreground" />, description: "improved 3 positions" },
    { title: "Site Performance", value: "87", change: 5.1, icon: <Zap className="h-4 w-4 text-muted-foreground" />, description: "score" },
  ]

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, i) => (
        <MetricCard key={i} {...metric} />
      ))}
    </div>
  )
}