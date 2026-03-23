"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StepConfirmacion } from "@/components/onboarding/StepConfirmacion"
import { StepDocumentos } from "@/components/onboarding/StepDocumentos"
import { StepEmpresa } from "@/components/onboarding/StepEmpresa"
import { StepEquipo } from "@/components/onboarding/StepEquipo"
import { StepObjetivos } from "@/components/onboarding/StepObjetivos"
import { OnboardingData } from "@/components/onboarding/types"
import { getSupabase } from "@/lib/supabase"
import { LexoraFavicon, LexoraLogo } from "@/components/ui/lexora-logo"

const steps = ["Empresa", "Equipo", "Documentos", "Objetivos", "Confirmación"]

const initialData: OnboardingData = {
  empresa: {
    nombreEmpresa: "",
    rubro: "",
    aniosMercado: "",
    pais: "",
    sitioWeb: "",
    descripcion: "",
  },
  equipo: {
    empleados: "",
    facturacion: "",
    areas: [],
    herramientas: [],
  },
  documentos: {
    archivos: [],
    descripcionProcesos: "",
  },
  objetivos: {
    objetivos: [],
    problemaPrincipal: "",
    tiempoResultados: "",
  },
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [userId, setUserId] = useState("")
  const [data, setData] = useState<OnboardingData>(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSteps, setShowSteps] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabase()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single()

      if (profile?.onboarding_completed) {
        router.push("/dashboard")
        return
      }

      setUserId(user.id)
      setLoading(false)
    }

    checkSession()
  }, [router])

  const progressValue = useMemo(
    () => (currentStep / steps.length) * 100,
    [currentStep]
  )

  const validateCurrentStep = () => {
    setError(null)

    if (currentStep === 1) {
      if (
        !data.empresa.nombreEmpresa ||
        !data.empresa.rubro ||
        !data.empresa.pais ||
        !data.empresa.descripcion
      ) {
        setError("Completá los campos obligatorios del paso Empresa.")
        return false
      }
    }

    if (currentStep === 2) {
      if (!data.equipo.empleados || data.equipo.areas.length === 0) {
        setError("Seleccioná la cantidad de empleados y al menos un área.")
        return false
      }
    }

    if (currentStep === 4) {
      if (!data.objetivos.problemaPrincipal || data.objetivos.objetivos.length === 0) {
        setError("Definí al menos un objetivo y el problema principal.")
        return false
      }
    }

    return true
  }

  const nextStep = () => {
    if (!validateCurrentStep()) return
    setCurrentStep((prev) => Math.min(prev + 1, steps.length))
  }

  const prevStep = () => {
    setError(null)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando onboarding...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] p-4 md:p-8">
      <div className="mb-3 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setShowSteps((prev) => !prev)}>
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
        <aside
          className={`border border-[var(--border)] bg-white p-[20px] ${
            showSteps ? "block" : "hidden"
          } md:block`}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px" }}>
            <LexoraFavicon />
            <LexoraLogo size="small" theme="light" />
          </div>
          <h2 className="text-lg font-semibold">Onboarding</h2>
          <p className="mb-4 text-sm text-[var(--ink-60)]">
            Paso {currentStep} de {steps.length}
          </p>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`rounded-[8px] px-3 py-2 text-sm ${
                  currentStep === index + 1
                    ? "bg-[rgba(201,168,76,0.12)] text-[#8a6d1e]"
                    : "bg-[var(--paper-2)] text-[var(--ink-60)]"
                }`}
              >
                {index + 1}. {step}
              </div>
            ))}
          </div>
        </aside>

        <main className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep - 1]}</CardTitle>
              <Progress value={progressValue} />
            </CardHeader>
            <CardContent className="space-y-6">
              {error && <p className="text-sm text-[var(--red-soft)]">{error}</p>}

              {currentStep === 1 && (
                <StepEmpresa
                  data={data.empresa}
                  onChange={(empresa) => setData((prev) => ({ ...prev, empresa }))}
                />
              )}
              {currentStep === 2 && (
                <StepEquipo
                  data={data.equipo}
                  onChange={(equipo) => setData((prev) => ({ ...prev, equipo }))}
                />
              )}
              {currentStep === 3 && (
                <StepDocumentos
                  userId={userId}
                  data={data.documentos}
                  onChange={(documentos) => setData((prev) => ({ ...prev, documentos }))}
                />
              )}
              {currentStep === 4 && (
                <StepObjetivos
                  data={data.objetivos}
                  onChange={(objetivos) => setData((prev) => ({ ...prev, objetivos }))}
                />
              )}
              {currentStep === 5 && <StepConfirmacion data={data} />}

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentStep === 1}
                  onClick={prevStep}
                >
                  Anterior
                </Button>
                {currentStep < steps.length && (
                  <Button type="button" onClick={nextStep}>
                    Siguiente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

