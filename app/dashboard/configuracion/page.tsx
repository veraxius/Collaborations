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
        <h1 className="font-display text-5xl">Settings</h1>
        <p className="text-[13px] text-[var(--ink-60)]">
          Account preferences, alerts, and integrations.
        </p>
      </div>
      <Card className="lex-card">
        <CardHeader>
          <CardTitle>General settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--ink-60)]">
            Space ready to centralize profile and security options.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">Language</p>
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
                <option value="es">Spanish</option>
                <option value="en">English</option>
              </Select>
            </div>
            <p className="text-xs text-text-tertiary">
              {saving ? "Saving..." : "Saved to your account"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

