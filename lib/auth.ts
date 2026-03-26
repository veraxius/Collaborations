"use client"

import { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { getSupabase } from "./supabase"

// Login con Google OAuth
export async function signInWithGoogle() {
  const supabase = getSupabase()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
    },
  })

  if (error) {
    console.error("Error al iniciar sesión con Google:", error.message)
    throw error
  }

  return data
}

// Obtener sesión actual
export async function getSession() {
  const supabase = getSupabase()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error("Error al obtener sesión:", error.message)
    return null
  }

  return data.session
}

// Obtener usuario actual
export async function getUser() {
  const supabase = getSupabase()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    console.error("Error al obtener usuario:", error.message)
    return null
  }

  if (data.user) {
    console.log("Usuario autenticado:", data.user.email)
  }

  return data.user
}

// Cerrar sesión
export async function signOut() {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Error al cerrar sesión:", error.message)
    throw error
  }
}

// Escuchar cambios en la autenticación
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  const supabase = getSupabase()
  const { data } = supabase.auth.onAuthStateChange(
    (event: AuthChangeEvent, session: Session | null) => {
      callback(event, session)
    }
  )

  return data.subscription
}
