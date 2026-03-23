"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReportesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-5xl">Reportes</h1>
        <p className="text-[13px] text-[var(--ink-60)]">
          Generá reportes ejecutivos con indicadores y evolución.
        </p>
      </div>
      <Card className="lex-card">
        <CardHeader>
          <CardTitle>Historial de reportes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--ink-60)]">
            Próximamente disponible en este nuevo módulo unificado.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

