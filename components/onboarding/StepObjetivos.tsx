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
  "Reducir costos operativos",
  "Automatizar tareas manuales",
  "Mejorar tiempos de entrega",
  "Aumentar ventas",
  "Mejorar atención al cliente",
  "Organizar la información",
  "Mejorar comunicación interna",
  "Control financiero",
  "Escalar el negocio",
  "Retener talento",
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
        <Label>Objetivos (mínimo 1) *</Label>
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
          ¿Cuál es el principal problema que querés resolver? *
        </Label>
        <Textarea
          id="problemaPrincipal"
          value={data.problemaPrincipal}
          onChange={(event) => onChange({ ...data, problemaPrincipal: event.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tiempoResultados">Tiempo esperado de resultados</Label>
        <Select
          id="tiempoResultados"
          value={data.tiempoResultados}
          onChange={(event) => onChange({ ...data, tiempoResultados: event.target.value })}
        >
          <option value="">Seleccionar</option>
          <option value="En el próximo mes">En el próximo mes</option>
          <option value="En 3 meses">En 3 meses</option>
          <option value="En 6 meses">En 6 meses</option>
          <option value="En el próximo año">En el próximo año</option>
        </Select>
      </div>
    </div>
  )
}

