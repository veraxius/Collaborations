"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Users } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Competitor {
  name: string
  traffic: string
  seo: string
  trend: "up" | "down"
  notes: string
}

const competitors: Competitor[] = [
  { name: "Competidor A", traffic: "120K", seo: "Excelente", trend: "up", notes: "Tráfico mayor, mejor estrategia de contenido" },
  { name: "Competidor B", traffic: "85K", seo: "Muy Bueno", trend: "up", notes: "Mejor SEO, más backlinks" },
  { name: "Competidor C", traffic: "65K", seo: "Bueno", trend: "down", notes: "Similar a tu negocio, oportunidad de superar" },
]

const sans = { fontFamily: "'Outfit', sans-serif" }

export function CompetitorsSection() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle
          className="flex items-center gap-2"
          style={{ ...sans, fontWeight: 500, fontSize: "16px" }}
        >
          <Users className="h-5 w-5" />
          Competidores
        </CardTitle>
        <CardDescription style={{ ...sans, fontSize: "13px" }}>
          Resumen de competidores agregados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {["Competidor", "Tráfico", "SEO", "Tendencia", "Notas"].map((h) => (
                <TableHead key={h} style={{ ...sans, fontSize: "12px", fontWeight: 500 }}>
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.map((c, i) => (
              <TableRow key={i}>
                <TableCell style={{ ...sans, fontSize: "13px", fontWeight: 500 }}>{c.name}</TableCell>
                <TableCell style={{ ...sans, fontSize: "13px" }}>{c.traffic}</TableCell>
                <TableCell>
                  <Badge variant="secondary" style={{ ...sans, fontSize: "11px" }}>{c.seo}</Badge>
                </TableCell>
                <TableCell>
                  {c.trend === "up"
                    ? <TrendingUp className="h-4 w-4 text-green-500" />
                    : <TrendingDown className="h-4 w-4 text-red-500" />}
                </TableCell>
                <TableCell style={{ ...sans, fontSize: "12px", color: "rgba(13,13,15,0.5)" }}>
                  {c.notes}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}