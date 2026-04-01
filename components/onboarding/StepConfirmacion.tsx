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
          <CardTitle>Resumen de tu configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Empresa:</strong> {data.empresa.nombreEmpresa || "-"}
          </p>
          <p>
            <strong>Rubro:</strong> {data.empresa.rubro || "-"}
          </p>
          <p>
            <strong>Empleados:</strong> {data.equipo.empleados || "-"}
          </p>
          <p>
            <strong>Áreas:</strong> {data.equipo.areas.join(", ") || "-"}
          </p>
          <p>
            <strong>Objetivos:</strong> {data.objetivos.objetivos.join(", ") || "-"}
          </p>
          <p>
            <strong>Archivos subidos:</strong> {data.documentos.archivos.length}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

