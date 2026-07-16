"use client"

import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { StepEquipoData } from "@/components/onboarding/types"

interface StepEquipoProps {
  data: StepEquipoData
  onChange: (data: StepEquipoData) => void
}

const areasOptions = [
  "Sales",
  "Marketing",
  "Operations",
  "Finance/Accounting",
  "HR",
  "Logistics",
  "Production",
  "Customer support",
  "IT/Technology",
  "Legal",
  "Purchasing",
]

const herramientasOptions = [
  "Excel/Google Sheets",
  "WhatsApp Business",
  "Gmail/Outlook",
  "Trello/Asana",
  "Slack",
  "E-invoicing",
  "ERP",
  "CRM",
  "None",
]

export function StepEquipo({ data, onChange }: StepEquipoProps) {
  const updateField = (field: keyof StepEquipoData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  const toggleValue = (field: "areas" | "herramientas", value: string) => {
    const currentValues = data[field]
    const alreadySelected = currentValues.includes(value)
    const updatedValues = alreadySelected
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value]

    onChange({ ...data, [field]: updatedValues })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="empleados">Number of employees *</Label>
          <Select
            id="empleados"
            value={data.empleados}
            onChange={(event) => updateField("empleados", event.target.value)}
            required
          >
            <option value="">Select</option>
            <option value="1-5">1-5</option>
            <option value="6-20">6-20</option>
            <option value="21-50">21-50</option>
            <option value="51-100">51-100</option>
            <option value="More than 100">More than 100</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="facturacion">Annual revenue</Label>
          <Select
            id="facturacion"
            value={data.facturacion}
            onChange={(event) => updateField("facturacion", event.target.value)}
          >
            <option value="">Select</option>
            <option value="Prefer not to say">Prefer not to say</option>
            <option value="Less than $1M">Less than $1M</option>
            <option value="$1M-$10M">$1M-$10M</option>
            <option value="$10M-$50M">$10M-$50M</option>
            <option value="More than $50M">More than $50M</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Areas (minimum 1) *</Label>
        <div className="flex flex-wrap gap-2">
          {areasOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleValue("areas", item)}
              className={`lex-chip ${data.areas.includes(item) ? "lex-chip-active" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Current tools</Label>
        <div className="flex flex-wrap gap-2">
          {herramientasOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleValue("herramientas", item)}
              className={`lex-chip ${data.herramientas.includes(item) ? "lex-chip-active" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

