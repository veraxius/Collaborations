"use client"

export const dynamic = "force-dynamic"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, Languages } from "lucide-react"
import { getSupabase } from "@/lib/supabase"
import { LexoraLogo } from "@/components/ui/lexora-logo"
import { useRedirectIfAuth } from "@/hooks/useAuth"
import { useLanguage } from "@/components/providers/language-provider"

export default function RegisterPage() {
  // Redirigir a dashboard si ya está autenticado
  useRedirectIfAuth("/dashboard")
  const { language, setLanguage } = useLanguage()

  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="min-h-screen w-full bg-background flex flex-col">
      <div className="fixed top-4 left-4 z-50">
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangOpen((prev) => !prev)}
            className="h-10 w-10 rounded-full border border-[var(--border)] bg-surface/90 backdrop-blur-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors flex items-center justify-center"
            aria-label="Cambiar idioma"
            title="Cambiar idioma"
          >
            <Languages className="w-5 h-5" />
          </button>
          {langOpen && (
            <div className="absolute left-0 mt-2 min-w-[130px] rounded-lg border border-light bg-surface shadow-lg p-1">
              <button
                type="button"
                onClick={async () => {
                  await setLanguage("es")
                  setLangOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  language === "es"
                    ? "bg-primary-50 text-primary-700"
                    : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                }`}
              >
                Español
              </button>
              <button
                type="button"
                onClick={async () => {
                  await setLanguage("en")
                  setLangOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  language === "en"
                    ? "bg-primary-50 text-primary-700"
                    : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                }`}
              >
                English
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex items-center justify-between">
        <LexoraLogo size="medium" theme="dark" />
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-surface rounded-xl border border-light shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-display text-text-primary mb-2">
                Crea tu cuenta
              </h1>
              <p className="text-text-secondary text-sm">
                Comienza a analizar tu negocio con IA
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm">
                  {error}
                </div>
              )}

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="lex-input pl-10"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="lex-input pl-10 pr-10"
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-0.5 rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <p className="text-xs text-text-secondary">
                  Acepto los{" "}
                  <Link href="/terms" className="text-primary-600 hover:text-primary-700">
                    Términos de servicio
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                    Política de privacidad
                  </Link>
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="lex-btn lex-btn-primary w-full"
              >
                <span>
                  {loading
                    ? language === "en"
                      ? "Creating account..."
                      : "Creando cuenta..."
                    : language === "en"
                      ? "Create account"
                      : "Crear cuenta"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-light"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-text-tertiary">O regístrate con</span>
              </div>
            </div>

            {/* Social Login */}
            <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-light rounded-lg hover:bg-surface-elevated transition-colors">
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
              <span className="text-sm font-medium text-text-primary">Google</span>
            </button>
          </div>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
