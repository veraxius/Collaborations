"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ConfiguracionPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-5xl">Configuración</h1>
        <p className="text-[13px] text-[var(--ink-60)]">
          Preferencias de cuenta, alertas e integraciones.
        </p>
      </div>
      <Card className="lex-card">
        <CardHeader>
          <CardTitle>Ajustes generales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--ink-60)]">
            Espacio listo para centralizar opciones de perfil y seguridad.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

