"use client"

import { OpportunitiesSection } from "@/components/dashboard/opportunities-section"

export default function OpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Oportunidades</h1>
        <p className="text-muted-foreground">
          Oportunidades detectadas para hacer crecer tu negocio
        </p>
      </div>
      <OpportunitiesSection />
    </div>
  )
}
