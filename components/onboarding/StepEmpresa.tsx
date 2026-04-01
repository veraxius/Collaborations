"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { StepEmpresaData } from "@/components/onboarding/types"

interface StepEmpresaProps {
  data: StepEmpresaData
  onChange: (data: StepEmpresaData) => void
}

export function StepEmpresa({ data, onChange }: StepEmpresaProps) {
  const updateField = (field: keyof StepEmpresaData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombreEmpresa">Nombre de la empresa *</Label>
        <Input
          id="nombreEmpresa"
          value={data.nombreEmpresa}
          onChange={(event) => updateField("nombreEmpresa", event.target.value)}
          placeholder="Ej: Lexora SRL"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rubro">Rubro / industria *</Label>
          <Select
            id="rubro"
            value={data.rubro}
            onChange={(event) => updateField("rubro", event.target.value)}
            required
          >
            <option value="">Seleccionar</option>
            <option value="Comercio/Retail">Comercio/Retail</option>
            <option value="Manufactura">Manufactura</option>
            <option value="Servicios profesionales">Servicios profesionales</option>
            <option value="Logística">Logística</option>
            <option value="Tecnología">Tecnología</option>
            <option value="Salud">Salud</option>
            <option value="Construcción">Construcción</option>
            <option value="Gastronomía">Gastronomía</option>
            <option value="Educación">Educación</option>
            <option value="Finanzas">Finanzas</option>
            <option value="Agropecuario">Agropecuario</option>
            <option value="Otro">Otro</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aniosMercado">Años en el mercado</Label>
          <Select
            id="aniosMercado"
            value={data.aniosMercado}
            onChange={(event) => updateField("aniosMercado", event.target.value)}
          >
            <option value="">Seleccionar</option>
            <option value="Menos de 1 año">Menos de 1 año</option>
            <option value="1-3 años">1-3 años</option>
            <option value="3-5 años">3-5 años</option>
            <option value="5-10 años">5-10 años</option>
            <option value="Más de 10 años">Más de 10 años</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pais">País *</Label>
          <Select
            id="pais"
            value={data.pais}
            onChange={(event) => updateField("pais", event.target.value)}
            required
          >
            <option value="">Seleccionar</option>
            <option value="Argentina">Argentina</option>
            <option value="México">México</option>
            <option value="Colombia">Colombia</option>
            <option value="Chile">Chile</option>
            <option value="Uruguay">Uruguay</option>
            <option value="España">España</option>
            <option value="United States">United States</option>
            <option value="Otro">Otro</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sitioWeb">Sitio web</Label>
          <Input
            id="sitioWeb"
            value={data.sitioWeb}
            onChange={(event) => updateField("sitioWeb", event.target.value)}
            placeholder="https://tuempresa.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción breve *</Label>
        <Textarea
          id="descripcion"
          value={data.descripcion}
          onChange={(event) => updateField("descripcion", event.target.value)}
          placeholder="Contanos qué hace tu empresa y su propuesta de valor."
          required
        />
      </div>
    </div>
  )
}

