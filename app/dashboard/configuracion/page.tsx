"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { useLanguage } from "@/components/providers/language-provider"

export default function ConfiguracionPage() {
  const { language, setLanguage } = useLanguage()
  const [saving, setSaving] = useState(false)

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
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--ink-60)]">
            Espacio listo para centralizar opciones de perfil y seguridad.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">Idioma</p>
            <div className="max-w-xs">
              <Select
                value={language}
                onChange={async (event) => {
                  const next = event.target.value === "en" ? "en" : "es"
                  setSaving(true)
                  await setLanguage(next)
                  setSaving(false)
                }}
                disabled={saving}
              >
                <option value="es">Español</option>
                <option value="en">Inglés</option>
              </Select>
            </div>
            <p className="text-xs text-text-tertiary">
              {saving ? "Guardando..." : "Guardado en tu cuenta"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

