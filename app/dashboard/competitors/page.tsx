"use client"

import { CompetitorsSection } from "@/components/dashboard/competitors-section"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function CompetitorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competidores</h1>
          <p className="text-muted-foreground">
            Análisis detallado de tus competidores
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Competidor
        </Button>
      </div>
      <CompetitorsSection />
    </div>
  )
}
