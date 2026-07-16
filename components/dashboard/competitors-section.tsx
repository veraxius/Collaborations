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
  { name: "Competitor A", traffic: "120K", seo: "Excellent", trend: "up", notes: "Higher traffic, better content strategy" },
  { name: "Competitor B", traffic: "85K", seo: "Very Good", trend: "up", notes: "Better SEO, more backlinks" },
  { name: "Competitor C", traffic: "65K", seo: "Good", trend: "down", notes: "Similar to your business, opportunity to overtake" },
]

const sans = { fontFamily: "'Inter', sans-serif" }

export function CompetitorsSection() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle
          className="flex items-center gap-2"
          style={{ ...sans, fontWeight: 500, fontSize: "16px" }}
        >
          <Users className="h-5 w-5" />
          Competitors
        </CardTitle>
        <CardDescription style={{ ...sans, fontSize: "13px" }}>
          Summary of added competitors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {["Competitor", "Traffic", "SEO", "Trend", "Notes"].map((h) => (
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