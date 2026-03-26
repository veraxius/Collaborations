"use client"

export const dynamic = "force-dynamic"

import { FormEvent, useState } from "react"
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase"
import { signInWithGoogle } from "@/lib/auth"
import { LexoraLogo } from "@/components/ui/lexora-logo"
import { useRedirectIfAuth } from "@/hooks/useAuth"

export default function LoginPage() {
  // Redirigir a dashboard si ya está autenticado
  useRedirectIfAuth("/dashboard")

  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      const supabase = getSupabase()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message || "Error al iniciar sesión")
        return
      }

      if (!data.user) {
        setError("No se pudo recuperar el usuario autenticado")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", data.user.id)
        .single()

      if (!profile?.onboarding_completed) {
        router.push("/onboarding")
      } else {
        router.push("/dashboard")
      }
    } catch {
      setError("No se pudo completar el inicio de sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[60%_40%]">
      {/* Left side - Image (60%) */}
      <div className="hidden md:block relative">
        <img
          src="/fondo-1.jpg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Right side - Form (40%) */}
      <div className="flex flex-col bg-background rounded-l-lg">
        {/* Navbar */}
        <nav className="w-full px-6 py-4 flex items-center justify-end">
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Registrarse
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <LexoraLogo size="hero" theme="light" />
                </div>
                <h2 className="text-xl font-display text-text-primary mb-2">
                  Bienvenido de vuelta
                </h2>
                <p className="text-text-secondary text-sm">
                  Inicia sesión para continuar con tu análisis
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@empresa.com"
                      required
                      className="lex-input pl-10"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="lex-input pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-text-secondary">Recordarme</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="lex-btn lex-btn-primary w-full"
                >
                  <span>{loading ? "Ingresando..." : "Iniciar sesión"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-light"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-text-tertiary">O continúa con</span>
                </div>
              </div>

              {/* Social Login */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithGoogle()
                  } catch (err: any) {
                    setError(err?.message || "Error al iniciar sesión con Google")
                  }
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-light rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm font-medium text-text-primary">Continuar con Google</span>
              </button>

            {/* Sign Up Link */}
            <p className="mt-6 text-center text-sm text-text-secondary">
              ¿No tienes una cuenta?{" "}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
