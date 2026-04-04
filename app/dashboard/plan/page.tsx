"use client"

import { useEffect, useMemo, useState } from "react"
import { useRequireAuth } from "@/hooks/useAuth"
import { getSupabase } from "@/lib/supabase"
import { PlanCard, type PlanDefinition, type PlanId } from "@/components/plan/PlanCard"

export default function PlanPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabase()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          setCurrentPlan("free")
          return
        }
        // Intentar leer plan/estado desde users (webhook escribe aquí)
        const { data: usersRow } = await supabase
          .from("users")
          .select("plan,status")
          .eq("id", user.id)
          .maybeSingle()

        // Fallback: intentar leer plan desde profiles.plan si existe
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single()

        // Determinar plan solamente si el status es active; si no, Free
        let planFromDb: string | null = null
        const statusFromUsers = (usersRow as any)?.status as string | undefined
        const planUsers = (usersRow as any)?.plan as string | undefined
        const planProfiles = (profileData as any)?.plan as string | undefined

        if (statusFromUsers === "active" && planUsers) {
          planFromDb = String(planUsers)
        } else if (!statusFromUsers && planProfiles) {
          // Compat: si aún no usamos users.status, aceptar profiles.plan
          planFromDb = String(planProfiles)
        }

        if (planFromDb) {
          const normalized = planFromDb.toLowerCase()
          if (["starter", "pro", "enterprise"].includes(normalized)) {
            setCurrentPlan(normalized as PlanId)
          } else {
            setCurrentPlan("free")
          }
        } else {
          setCurrentPlan("free")
        }
      } catch {
        // Ignorar errores silenciosamente; la UI seguirá funcionando
        setCurrentPlan("free")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const plans = useMemo<PlanDefinition[]>(
    () => [
      {
        id: "free",
        name: "Free",
        price: "$0",
        period: "mes",
        features: ["1 proyecto", "Reportes básicos", "Soporte comunitario"],
      },
      {
        id: "starter",
        name: "Starter",
        price: "$14",
        period: "mes",
        features: ["Hasta 3 proyectos", "Soporte por email", "Reportes básicos"],
      },
      {
        id: "pro",
        name: "Pro",
        price: "$39",
        period: "mes",
        features: ["Proyectos ilimitados", "IA avanzada", "Reportes detallados", "Soporte prioritario"],
        highlighted: true,
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: "$79",
        period: "mes",
        features: ["SLA dedicado", "Integraciones a medida", "Cuenta manager", "Seguridad avanzada"],
      },
    ],
    []
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl text-text-primary">Elige tu plan</h1>
          <p className="text-sm text-text-secondary">Gestiona tu suscripción con Lemon Squeezy</p>
        </div>
        {!authLoading && user && currentPlan && (
          <div className="rounded-lg border border-light bg-white px-3 py-1.5 text-sm text-text-secondary">
            Plan actual: <span className="font-medium text-text-primary capitalize">{currentPlan}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 grid-cols-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
          />
        ))}
      </div>
    </div>
  )
}
