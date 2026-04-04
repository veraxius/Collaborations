import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

type PlanId = "starter" | "pro" | "enterprise"

const PLAN_MAP: Record<string, PlanId> = {
  "1486123": "starter",
  "1486155": "pro",
  "1486156": "enterprise",
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "hex")
  const bBuf = Buffer.from(b, "hex")
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

function verifySignature(rawBody: string, signature: string | null, secret: string | undefined): boolean {
  if (!signature || !secret) return false
  const computed = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")
  return timingSafeEqual(computed, signature)
}

export async function POST(request: Request) {
  try {
    // 1) Leer body RAW
    const rawBody = await request.text()

    // 2) Obtener firma
    const signature = request.headers.get("x-signature")

    // 3) Validar firma
    const secret = process.env.LEMON_WEBHOOK_SECRET
    const valid = verifySignature(rawBody, signature, secret)
    if (!valid) {
      console.error("[webhook] Invalid signature")
      return new Response("unauthorized", { status: 401 })
    }

    // 4) Parsear JSON después de validar
    const payload = JSON.parse(rawBody) as any

    const event = payload?.meta?.event_name || payload?.event || "unknown"
    const attrs = payload?.data?.attributes
    const custom = attrs?.custom_data
    const userId: string | undefined = custom?.user_id
    const variantIdRaw = String(attrs?.variant_id ?? "")
    const variantId = variantIdRaw || ""
    const status = attrs?.status || attrs?.subscription_status || null

    console.log("[webhook] event:", event)
    console.log("[webhook] user_id:", userId || "MISSING")
    console.log("[webhook] variant_id:", variantId || "MISSING")

    const plan = PLAN_MAP[variantId]
    if (plan) {
      console.log("[webhook] plan asignado:", plan)
    } else {
      console.warn("[webhook] variant_id no mapeado:", variantId)
    }

    if (!userId) {
      console.error("[webhook] user_id faltante en custom_data")
      return new Response("ok", { status: 200 })
    }

    // Determinar nueva asignación de estado
    let newPlan: PlanId | undefined
    let newStatus: string | undefined

    if (event === "subscription_created" || event === "subscription_updated") {
      newPlan = plan
      newStatus = "active"
      if (!variantId) {
        console.error("[webhook] variant_id faltante")
      }
      if (!newPlan) {
        console.error("[webhook] No se pudo mapear plan desde variant_id:", variantId)
      }
    } else if (event === "subscription_cancelled") {
      newStatus = "cancelled"
    } else {
      // Evento desconocido: no romper
      console.log("[webhook] evento ignorado:", event)
      return new Response("ok", { status: 200 })
    }

    // 10) Actualizar base de datos (tabla: users, buscar por user_id)
    // Usar SERVICE ROLE si está disponible; si no, loggear y continuar
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      console.warn("[webhook] Falta SUPABASE service credentials; no se actualiza DB")
      return new Response("ok", { status: 200 })
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    const updates: Record<string, unknown> = {}
    if (typeof newPlan !== "undefined") updates.plan = newPlan
    if (typeof newStatus !== "undefined") updates.status = newStatus

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await admin
        .from("users")
        .update(updates)
        .eq("id", userId)

      if (updateError) {
        console.error("[webhook] Error actualizando users:", updateError.message)
      } else {
        console.log("[webhook] Actualizado users:", { user_id: userId, ...updates })
      }
    } else {
      console.log("[webhook] Nada para actualizar")
    }

    return new Response("ok", { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    console.error("[webhook] exception:", message)
    // Responder 200 para no reintentar indefinidamente desde el proveedor
    return new Response("ok", { status: 200 })
  }
}

