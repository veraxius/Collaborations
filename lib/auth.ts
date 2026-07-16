"use client"

import { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { getSupabase } from "./supabase"

// Login with Google OAuth
export async function signInWithGoogle() {
  const supabase = getSupabase()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
    },
  })

  if (error) {
    console.error("Error signing in with Google:", error.message)
    throw error
  }

  return data
}

// Get current session
export async function getSession() {
  const supabase = getSupabase()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error("Error getting session:", error.message)
    return null
  }

  return data.session
}

// Get current user
export async function getUser() {
  const supabase = getSupabase()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    console.error("Error getting user:", error.message)
    return null
  }

  if (data.user) {
    console.log("Authenticated user:", data.user.email)
  }

  return data.user
}

// Sign out
export async function signOut() {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Error signing out:", error.message)
    throw error
  }
}

// Listen for authentication state changes
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
