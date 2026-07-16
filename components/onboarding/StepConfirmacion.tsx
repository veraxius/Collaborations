"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OnboardingData } from "@/components/onboarding/types"

interface StepConfirmacionProps {
  data: OnboardingData
  error?: string | null
}

export function StepConfirmacion({ data, error }: StepConfirmacionProps) {
  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Summary of your setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Company:</strong> {data.empresa.nombreEmpresa || "-"}
          </p>
          <p>
            <strong>Industry:</strong> {data.empresa.rubro || "-"}
          </p>
          <p>
            <strong>Employees:</strong> {data.equipo.empleados || "-"}
          </p>
          <p>
            <strong>Areas:</strong> {data.equipo.areas.join(", ") || "-"}
          </p>
          <p>
            <strong>Goals:</strong> {data.objetivos.objetivos.join(", ") || "-"}
          </p>
          <p>
            <strong>Uploaded files:</strong> {data.documentos.archivos.length}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

