"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReportesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-5xl">Reports</h1>
        <p className="text-[13px] text-[var(--ink-60)]">
          Generate executive reports with indicators and trends.
        </p>
      </div>
      <Card className="lex-card">
        <CardHeader>
          <CardTitle>Report history</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--ink-60)]">
            Coming soon in this new unified module.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

