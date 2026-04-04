import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic"

type PlanId = "starter" | "pro" | "enterprise"

export async function POST(request: Request) {
  try {
    const { plan } = (await request.json()) as { plan?: PlanId }

    // Validar plan
    const validPlans: PlanId[] = ["starter", "pro", "enterprise"]
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 })
    }

    // Obtener usuario autenticado (para logging y validación)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) {
      console.error("[create-checkout] Missing user.id")
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // API key
    const apiKey = process.env.LEMON_API_KEY
    // Log de debug sin exponer clave
    console.log("[create-checkout] LEMON_API_KEY:", apiKey ? "OK" : "MISSING")

    if (!apiKey) {
      return NextResponse.json({ error: "LEMON_API_KEY no está definida" }, { status: 500 })
    }

    // Opcional: mapping de variantes por plan vía envs (si están configuradas)
    const storeId = process.env.LEMON_STORE_ID
    const variantMap: Record<PlanId, string | undefined> = {
      starter: process.env.LEMON_VARIANT_STARTER,
      pro: process.env.LEMON_VARIANT_PRO,
      enterprise: process.env.LEMON_VARIANT_ENTERPRISE,
    }

    const variantId = variantMap[plan]

    // Logs previos al fetch
    console.log("[create-checkout] plan:", plan)
    console.log("[create-checkout] user.id:", user.id)
    console.log("[create-checkout] variantId:", variantId ? "OK" : "MISSING")

    // Validaciones específicas
    if (!storeId) {
      return NextResponse.json({ error: "LEMON_STORE_ID no está definida" }, { status: 500 })
    }
    if (!variantId) {
      return NextResponse.json({ error: "No hay variantId configurado para el plan seleccionado" }, { status: 500 })
    }

    // Construir payload mínimo para Lemon Squeezy Checkouts API
    // Docs: https://docs.lemonsqueezy.com/api/checkouts#create-a-checkout
    const lemonPayload = {
      data: {
        type: "checkouts",
        attributes: {
          // Opcional: redirect URLs, modo test, etc.
        },
        relationships: {
          store: {
            data: { type: "stores", id: String(storeId) },
          },
          variant: {
            data: { type: "variants", id: String(variantId) },
          },
        },
      },
    }

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(lemonPayload),
    })

    // Logs de respuesta de Lemon
    console.log("[create-checkout] lemon response.status:", response.status)
    console.log("[create-checkout] lemon response.ok:", response.ok)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "<no-body>")
      console.error("LEMON ERROR:", errorText)
      return NextResponse.json(
        {
          error: "Error creando checkout",
          lemonStatus: response.status,
          lemonBody: errorText,
        },
        { status: 502 }
      )
    }

    const json = (await response.json()) as any

    // Extraer URL: Lemon suele devolver en data.attributes.url
    const checkoutUrl: string | undefined = json?.data?.attributes?.url

    if (!checkoutUrl) {
      console.error("[create-checkout] Respuesta sin URL:", JSON.stringify(json))
      return NextResponse.json(
        { error: "Respuesta inválida de Lemon", lemonBody: JSON.stringify(json) },
        { status: 502 }
      )
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Error desconocido"
    console.error("[create-checkout] Exception:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

