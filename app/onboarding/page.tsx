"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, Check, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StepConfirmacion } from "@/components/onboarding/StepConfirmacion"
import { StepDocumentos } from "@/components/onboarding/StepDocumentos"
import { StepEmpresa } from "@/components/onboarding/StepEmpresa"
import { StepEquipo } from "@/components/onboarding/StepEquipo"
import { StepObjetivos } from "@/components/onboarding/StepObjetivos"
import { OnboardingData } from "@/components/onboarding/types"
import { getSupabase } from "@/lib/supabase"
import { LexoraLogo } from "@/components/ui/lexora-logo"

const steps = [
  { id: 1, title: "Empresa", description: "Información básica" },
  { id: 2, title: "Equipo", description: "Tamaño y áreas" },
  { id: 3, title: "Documentos", description: "Archivos y procesos" },
  { id: 4, title: "Objetivos", description: "Metas y prioridades" },
  { id: 5, title: "Confirmación", description: "Revisar y enviar" },
]

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-text-secondary">Cargando... </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-light sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <LexoraLogo size="small" theme="light" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary hidden sm:inline">
              Paso {currentStep} de {steps.length}
            </span>
            <div className="w-32 sm:w-48">
              <Progress value={progressValue} className="h-2" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-4 md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSteps((prev) => !prev)}
            className="lex-btn-secondary"
          >
            <Menu className="h-4 w-4 mr-2" />
            {showSteps ? "Ocultar pasos" : "Ver pasos"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar Steps */}
          <aside
            className={`${
              showSteps ? "block" : "hidden"
            } lg:block space-y-6 animate-fade-in`}
          >
            <div className="lex-card p-6">
              <h2 className="font-display text-lg text-text-primary mb-1">
                Configuración inicial
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                Completa estos pasos para personalizar tu experiencia
              </p>

              <div className="space-y-3">
                {steps.map((step, index) => {
                  const isCompleted = currentStep > step.id
                  const isCurrent = currentStep === step.id

                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                        isCurrent
                          ? "bg-primary-50 border border-primary-200"
                          : isCompleted
                            ? "bg-surface-elevated"
                            : ""
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isCompleted
                            ? "bg-accent-500 text-white"
                            : isCurrent
                              ? "bg-primary-600 text-white"
                              : "bg-border-light text-text-tertiary"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium text-sm ${
                            isCurrent ? "text-primary-700" : "text-text-primary"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Help Card */}
            <div className="lex-card-ai p-6">
              <h3 className="font-display text-base text-secondary-900 mb-2">
                ¿Necesitas ayuda?
              </h3>
              <p className="text-sm text-secondary-700 mb-4">
                Nuestro asistente de IA puede guiarte en el proceso.
              </p>
              <Button variant="outline" className="lex-btn-secondary w-full text-secondary-700 border-secondary-200">
                Hablar con IA
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="animate-fade-up">
            <div className="lex-card-elevated">
              {/* Step Header */}
              <div className="mb-6 pb-6 border-b border-light">
                <h1 className="text-2xl font-display text-text-primary">
                  {steps[currentStep - 1].title}
                </h1>
                <p className="text-text-secondary mt-1">
                  {steps[currentStep - 1].description}
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="lex-alert lex-alert-error mb-6">
                  <div className="w-5 h-5 rounded-full bg-error-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-error-600 text-xs">!</span>
                  </div>
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}

              {/* Step Content */}
              <div className="py-2">
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
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-light">
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentStep === 1}
                  onClick={prevStep}
                  className="lex-btn-secondary"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>

                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="lex-btn lex-btn-primary"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button className="lex-btn lex-btn-success">
                    Completar configuración
                    <Check className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
