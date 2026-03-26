"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession, onAuthStateChange } from "@/lib/auth"

export function useAuth() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Verificar sesión inicial
    const checkSession = async () => {
      const currentSession = await getSession()
      setSession(currentSession)
      setUser(currentSession?.user || null)
      setLoading(false)
    }

    checkSession()

    // Escuchar cambios en la autenticación
    const subscription = onAuthStateChange((event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user || null)
      setLoading(false)

      // Redirigir según el estado
      if (event === "SIGNED_IN") {
        router.refresh()
      }
      if (event === "SIGNED_OUT") {
        router.push("/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return { session, user, loading }
}

// Hook para proteger rutas (redirigir a login si no hay sesión)
export function useRequireAuth() {
  const router = useRouter()
  const { session, user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login")
    }
  }, [session, loading, router])

  return { session, user, loading }
}

// Hook para redirigir si ya está autenticado
export function useRedirectIfAuth(redirectTo: string = "/dashboard") {
  const router = useRouter()
  const { session, loading } = useAuth()

  useEffect(() => {
    if (!loading && session) {
      router.push(redirectTo)
    }
  }, [session, loading, router, redirectTo])

  return { session, loading }
}
