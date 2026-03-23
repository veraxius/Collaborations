"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OnboardingData } from "@/components/onboarding/types"

interface StepConfirmacionProps {
  data: OnboardingData
}

export function StepConfirmacion({ data }: StepConfirmacionProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    setLoading(true)
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const body = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "No se pudo guardar el onboarding")
      }

      router.push("/onboarding/analizando")
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Error inesperado"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

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
      <Button type="button" onClick={submit} disabled={loading}>
        {loading ? "Guardando..." : "Iniciar análisis con IA"}
      </Button>
    </div>
  )
}

