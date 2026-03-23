"use client"

export const dynamic = "force-dynamic"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Mail, Lock, ArrowRight } from "lucide-react"
import { getSupabase } from "@/lib/supabase"
import { LexoraLogoAnimated } from "@/components/ui/lexora-logo-animated"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const neonText = {
    color: "#fff",
    textShadow:
      "0 0 6px rgba(91,206,250,0.6), 0 0 12px rgba(91,206,250,0.35)",
  } as const

  const neonIcon = {
    filter: "drop-shadow(0 0 8px rgba(91,206,250,0.55))",
    color: "#fff",
  } as const

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return
    setError(null)

    if (!email || !password) {
      setError("Email y contraseña son requeridos")
      return
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabase()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message || "Error al registrar")
        return
      }
      router.push("/onboarding")
    } catch {
      setError("No se pudo completar el registro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: "url('/fondo-1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom right, rgba(0,0,0,0.45), rgba(0,0,0,0.35))",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 36,
          right: 48,
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: "22px",
        }}
      >
        <Link
          href="/login"
          style={{
            ...neonText,
            fontSize: "24px",
            textDecoration: "none",
            opacity: 0.95,
          }}
        >
          Iniciar sesión
        </Link>
        <Link
          href="/register"
          style={{
            ...neonText,
            fontSize: "24px",
            textDecoration: "none",
            opacity: 0.95,
          }}
        >
          Registrarse
        </Link>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "380px",
        }}
      >
        <div style={{ transform: "translateY(-18px)" }}>
          <LexoraLogoAnimated />
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "380px",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "14px",
            padding: "28px 26px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              margin: 0,
              marginBottom: "18px",
              textAlign: "center",
              ...neonText,
            }}
          >
            Crear cuenta
          </h1>

          <form onSubmit={handleRegister} style={{ display: "grid", gap: "16px" }}>
            {error && (
              <p
                style={{
                  margin: 0,
                  color: "#ffd2d2",
                  fontSize: "13px",
                  textAlign: "center",
                  textShadow: "0 0 6px rgba(255,120,120,0.5)",
                }}
              >
                {error}
              </p>
            )}

            <div style={{ position: "relative" }}>
              <User
                size={18}
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  ...neonIcon,
                  opacity: 0.9,
                }}
              />
              <input
                id="name"
                type="text"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 0 10px 28px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.85)",
                  outline: "none",
                  color: "#fff",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <Mail
                size={18}
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  ...neonIcon,
                  opacity: 0.9,
                }}
              />
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 0 10px 28px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.85)",
                  outline: "none",
                  color: "#fff",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  ...neonIcon,
                  opacity: 0.9,
                }}
              />
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 0 10px 28px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.85)",
                  outline: "none",
                  color: "#fff",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  ...neonIcon,
                  opacity: 0.9,
                }}
              />
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 0 10px 28px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.85)",
                  outline: "none",
                  color: "#fff",
                  fontSize: "14px",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                margin: "6px auto 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                width: "70%",
                background: "rgba(13,13,15,0.92)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "999px",
                padding: "10px 16px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "transform 0.15s, background 0.15s",
                filter: "drop-shadow(0 0 8px rgba(91,206,250,0.35))",
              }}
              onMouseDown={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"
              }}
              onMouseUp={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"
              }}
            >
              <span style={{ ...neonText, textShadow: "0 0 6px rgba(91,206,250,0.5)" }}>
                {loading ? "Creando..." : "Enter"}
              </span>
              <ArrowRight size={18} style={neonIcon} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
