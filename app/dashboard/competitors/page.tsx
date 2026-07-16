"use client"

import { CompetitorsSection } from "@/components/dashboard/competitors-section"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function CompetitorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitors</h1>
          <p className="text-muted-foreground">
            Detailed analysis of your competitors
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Competitor
        </Button>
      </div>
      <CompetitorsSection />
    </div>
  )
}
