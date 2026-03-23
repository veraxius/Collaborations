import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LexoraLogo } from "@/components/ui/lexora-logo"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="flex w-full max-w-5xl flex-col gap-12 p-8">
        <nav className="flex items-center justify-between">
          <LexoraLogo size="medium" theme="dark" />
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">Crear Cuenta</Link>
            </Button>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center gap-8 text-center">
          <LexoraLogo size="hero" theme="dark" />
        <p className="max-w-2xl text-lg text-muted-foreground">
          Analiza el estado de tu negocio con inteligencia artificial. 
          Descubre problemas, oportunidades y mejora tu rendimiento.
        </p>
        </div>
      </main>
    </div>
  )
}
