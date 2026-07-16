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
        <Label htmlFor="nombreEmpresa">Company name *</Label>
        <Input
          id="nombreEmpresa"
          value={data.nombreEmpresa}
          onChange={(event) => updateField("nombreEmpresa", event.target.value)}
          placeholder="E.g. Lexora LLC"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rubro">Industry / sector *</Label>
          <Select
            id="rubro"
            value={data.rubro}
            onChange={(event) => updateField("rubro", event.target.value)}
            required
          >
            <option value="">Select</option>
            <option value="Commerce/Retail">Commerce/Retail</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Professional services">Professional services</option>
            <option value="Logistics">Logistics</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Construction">Construction</option>
            <option value="Hospitality">Hospitality</option>
            <option value="Education">Education</option>
            <option value="Finance">Finance</option>
            <option value="Agribusiness">Agribusiness</option>
            <option value="Other">Other</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aniosMercado">Years in the market</Label>
          <Select
            id="aniosMercado"
            value={data.aniosMercado}
            onChange={(event) => updateField("aniosMercado", event.target.value)}
          >
            <option value="">Select</option>
            <option value="Less than 1 year">Less than 1 year</option>
            <option value="1-3 years">1-3 years</option>
            <option value="3-5 years">3-5 years</option>
            <option value="5-10 years">5-10 years</option>
            <option value="More than 10 years">More than 10 years</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pais">Country *</Label>
          <Select
            id="pais"
            value={data.pais}
            onChange={(event) => updateField("pais", event.target.value)}
            required
          >
            <option value="">Select</option>
            <option value="Argentina">Argentina</option>
            <option value="Mexico">Mexico</option>
            <option value="Colombia">Colombia</option>
            <option value="Chile">Chile</option>
            <option value="Uruguay">Uruguay</option>
            <option value="Spain">Spain</option>
            <option value="United States">United States</option>
            <option value="Other">Other</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sitioWeb">Website</Label>
          <Input
            id="sitioWeb"
            value={data.sitioWeb}
            onChange={(event) => updateField("sitioWeb", event.target.value)}
            placeholder="https://yourcompany.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Short description *</Label>
        <Textarea
          id="descripcion"
          value={data.descripcion}
          onChange={(event) => updateField("descripcion", event.target.value)}
          placeholder="Tell us what your company does and its value proposition."
          required
        />
      </div>
    </div>
  )
}

