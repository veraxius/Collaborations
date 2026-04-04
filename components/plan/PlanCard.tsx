"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"

export type PlanId = "free" | "starter" | "pro" | "enterprise"

export interface PlanDefinition {
  id: PlanId
  name: string
  price: string
  period?: string
  features: string[]
  highlighted?: boolean
}

interface PlanCardProps {
  plan: PlanDefinition
  currentPlan?: PlanId | null
  onCheckoutCreated?: (url: string) => void
}

export function PlanCard({ plan, currentPlan, onCheckoutCreated }: PlanCardProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const isCurrent = currentPlan === plan.id
  const isFree = plan.id === "free"
  const isStarter = plan.id === "starter"

  // Starter debe ser elegible incluso si es el plan actual; Free siempre deshabilitado
  const isDisabled = loading || isFree || (isCurrent && !isStarter)

  const handleChoose = async () => {
    if (isDisabled) return

    try {
      setLoading(true)
      // Mapear a URLs de checkout directas de Lemon Squeezy
      if (isFree) {
        // Plan gratuito: no inicia checkout
        return
      }

      const CHECKOUT_LINKS: Partial<Record<PlanId, string>> = {
        starter: "https://lexoracompany.lemonsqueezy.com/checkout/buy/09f8e397-8ad4-41d6-b9c8-094d4e8dec0b?enabled=1486123",
        pro: "https://lexoracompany.lemonsqueezy.com/checkout/buy/555c9ac0-a489-4bae-9054-d48357d85166?enabled=1486155",
        enterprise: "https://lexoracompany.lemonsqueezy.com/checkout/buy/fca6f83f-bcfd-4718-8a12-ddaca702827b?enabled=1486156",
      }

      const baseUrl = CHECKOUT_LINKS[plan.id]
      if (!baseUrl) {
        throw new Error("Checkout no disponible para este plan")
      }

      const url = user?.id
        ? `${baseUrl}&checkout[custom][user_id]=${encodeURIComponent(user.id)}`
        : baseUrl

      onCheckoutCreated?.(url)
      window.location.href = url
    } catch (error) {
      alert("Ocurrió un error al iniciar el checkout. Intentalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border ${
        plan.highlighted ? "border-secondary-400 shadow-lg shadow-secondary-100" : "border-light"
      } bg-white p-6`}
    >
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-display text-xl text-text-primary">{plan.name}</h3>
        {plan.highlighted && (
          <span className="rounded-full bg-secondary-50 px-2.5 py-1 text-xs font-medium text-secondary-700">
            Recomendado
          </span>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="font-display text-3xl text-text-primary">{plan.price}</span>
          {plan.period && <span className="text-sm text-text-tertiary">/{plan.period}</span>}
        </div>
      </div>

      <ul className="mb-6 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="text-sm text-text-secondary">
            • {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={() => void handleChoose()}
        disabled={isDisabled}
        className={`mt-auto w-full rounded-lg px-4 py-2 text-sm font-medium transition ${
          isDisabled
            ? "bg-gray-100 text-text-tertiary cursor-not-allowed"
            : plan.highlighted
              ? "bg-secondary-600 text-white hover:bg-secondary-700"
              : "bg-primary-600 text-white hover:bg-primary-700"
        }`}
      >
        {isFree
          ? "Incluido"
          : isCurrent && !isStarter
            ? "Plan actual"
            : loading
              ? "Procesando..."
              : "Elegir plan"}
      </button>
    </div>
  )
}
