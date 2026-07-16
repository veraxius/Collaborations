"use client"

import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { StepObjetivosData } from "@/components/onboarding/types"

interface StepObjetivosProps {
  data: StepObjetivosData
  onChange: (data: StepObjetivosData) => void
}

const objetivosOptions = [
  "Reduce operating costs",
  "Automate manual tasks",
  "Improve delivery times",
  "Increase sales",
  "Improve customer service",
  "Organize information",
  "Improve internal communication",
  "Financial control",
  "Scale the business",
  "Retain talent",
]

export function StepObjetivos({ data, onChange }: StepObjetivosProps) {
  const toggleObjetivo = (value: string) => {
    const alreadySelected = data.objetivos.includes(value)
    const updated = alreadySelected
      ? data.objetivos.filter((item) => item !== value)
      : [...data.objetivos, value]
    onChange({ ...data, objetivos: updated })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Goals (minimum 1) *</Label>
        <div className="flex flex-wrap gap-2">
          {objetivosOptions.map((item) => (
            <button
              key={item}
              type="button"
              className={`lex-chip ${data.objetivos.includes(item) ? "lex-chip-active" : ""}`}
              onClick={() => toggleObjetivo(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="problemaPrincipal">
          What is the main problem you want to solve? *
        </Label>
        <Textarea
          id="problemaPrincipal"
          value={data.problemaPrincipal}
          onChange={(event) => onChange({ ...data, problemaPrincipal: event.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tiempoResultados">Expected time to results</Label>
        <Select
          id="tiempoResultados"
          value={data.tiempoResultados}
          onChange={(event) => onChange({ ...data, tiempoResultados: event.target.value })}
        >
          <option value="">Select</option>
          <option value="In the next month">In the next month</option>
          <option value="In 3 months">In 3 months</option>
          <option value="In 6 months">In 6 months</option>
          <option value="In the next year">In the next year</option>
        </Select>
      </div>
    </div>
  )
}

