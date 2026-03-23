"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LexoraLogo } from "@/components/ui/lexora-logo"

export default function OnboardingAnalizandoPage() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const totalDurationMs = 4000
    const tickMs = 100
    const step = 100 / (totalDurationMs / tickMs)

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + step, 100)
        if (next >= 100) {
          clearInterval(interval)
          setTimeout(() => router.push("/dashboard"), 150)
        }
        return next
      })
    }, tickMs)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
            <LexoraLogo size="medium" theme="dark" />
          </div>
          <div className="flex justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--ink)]" />
          </div>
          <CardTitle className="font-display text-3xl">Lexora está analizando tu empresa...</CardTitle>
          <p className="text-sm text-[var(--ink-60)]">
            Esto tarda unos segundos. Estamos leyendo tus documentos y preparando tus
            primeras recomendaciones.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={progress} />
          <p className="text-right text-sm text-[var(--ink-60)]">
            {Math.round(progress)}%
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

