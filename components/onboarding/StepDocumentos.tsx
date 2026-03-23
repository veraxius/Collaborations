"use client"

import { useMemo, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StepDocumentosData } from "@/components/onboarding/types"
import { getSupabase } from "@/lib/supabase"

interface StepDocumentosProps {
  userId: string
  data: StepDocumentosData
  onChange: (data: StepDocumentosData) => void
}

const MAX_SIZE_BYTES = 20 * 1024 * 1024
const acceptedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"]

export function StepDocumentos({ userId, data, onChange }: StepDocumentosProps) {
  const supabase = getSupabase()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalFiles = useMemo(() => data.archivos.length, [data.archivos.length])

  const hasValidExtension = (fileName: string) => {
    const lowerName = fileName.toLowerCase()
    return acceptedExtensions.some((extension) => lowerName.endsWith(extension))
  }

  const onFilesSelected = async (files: FileList | null) => {
    if (!files?.length) return

    setError(null)
    setUploading(true)

    try {
      const uploaded = [...data.archivos]

      for (const file of Array.from(files)) {
        if (!hasValidExtension(file.name)) {
          setError("Solo se permiten PDF, Word, Excel y CSV.")
          continue
        }
        if (file.size > MAX_SIZE_BYTES) {
          setError("Cada archivo debe pesar máximo 20MB.")
          continue
        }

        const safeName = file.name.replace(/\s+/g, "_")
        const path = `${userId}/${Date.now()}-${safeName}`
        const { error: uploadError } = await supabase.storage
          .from("documentos")
          .upload(path, file, { upsert: false })

        if (uploadError) {
          setError(uploadError.message || "No se pudo subir un archivo.")
          continue
        }

        uploaded.push({
          name: file.name,
          path,
          size: file.size,
        })
      }

      onChange({
        ...data,
        archivos: uploaded,
      })
    } finally {
      setUploading(false)
    }
  }

  const removeFile = async (path: string) => {
    await supabase.storage.from("documentos").remove([path])
    onChange({
      ...data,
      archivos: data.archivos.filter((item) => item.path !== path),
    })
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div
        className={`rounded-md border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted"
        }`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDrop={async (event) => {
          event.preventDefault()
          setIsDragging(false)
          await onFilesSelected(event.dataTransfer.files)
        }}
      >
        <p className="text-sm font-medium">Arrastrá y soltá tus documentos acá</p>
        <p className="text-xs text-muted-foreground">
          PDF, Word, Excel, CSV - máximo 20MB por archivo
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Subiendo..." : "Seleccionar archivos"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(event) => onFilesSelected(event.target.files)}
        />
      </div>

      <div className="space-y-2">
        <Label>Archivos subidos</Label>
        <div className="space-y-2">
          {data.archivos.length === 0 && (
            <p className="text-sm text-muted-foreground">No subiste archivos todavía.</p>
          )}
          {data.archivos.map((file) => (
            <div
              key={file.path}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{(file.size / (1024 * 1024)).toFixed(2)} MB</Badge>
                <span className="text-sm">{file.name}</span>
              </div>
              <Button type="button" variant="ghost" onClick={() => removeFile(file.path)}>
                Eliminar
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Total de archivos: {totalFiles}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcionProcesos">
          ¿No tenés documentos? Describí tus procesos principales
        </Label>
        <Textarea
          id="descripcionProcesos"
          value={data.descripcionProcesos}
          onChange={(event) =>
            onChange({ ...data, descripcionProcesos: event.target.value })
          }
          placeholder="Por ejemplo: cómo captan clientes, cómo venden y cómo entregan el servicio."
        />
      </div>
    </div>
  )
}

