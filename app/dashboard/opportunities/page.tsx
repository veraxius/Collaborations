"use client"

import { OpportunitiesSection } from "@/components/dashboard/opportunities-section"

export default function OpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
        <p className="text-muted-foreground">
          Opportunities detected to grow your business
        </p>
      </div>
      <OpportunitiesSection />
    </div>
  )
}
