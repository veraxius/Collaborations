"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { ResultsDialog } from "./results-dialog"

export function AddCompanyDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [website, setWebsite] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResults, setAnalysisResults] = useState<{
    companyName: string
    website: string
    seoAnalysis: any
    performanceAnalysis: any
    aiRecommendations?: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Extraer el dominio del sitio web
      let domain = website.trim()
      
      // Si tiene protocolo, extraer solo el dominio
      try {
        const url = new URL(domain)
        domain = url.hostname.replace("www.", "")
      } catch {
        // Si no es una URL válida, usar el valor tal cual
        domain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "")
      }

      // Llamar al API para analizar el SEO y Performance
      const response = await axios.post("/api/analyze", { domain })
      
      // Guardar los datos en localStorage (en producción usarías una base de datos)
      const companyData = {
        companyName,
        website: domain,
        seoAnalysis: response.data.seo,
        performanceAnalysis: response.data.performance,
        aiRecommendations: response.data.aiRecommendations,
        createdAt: new Date().toISOString(),
      }
      
      // Obtener empresas existentes
      const existingCompanies = JSON.parse(
        localStorage.getItem("companies") || "[]"
      )
      existingCompanies.push(companyData)
      localStorage.setItem("companies", JSON.stringify(existingCompanies))
      
      // Guardar la empresa actual seleccionada
      localStorage.setItem("currentCompany", JSON.stringify(companyData))

      // Guardar los resultados para mostrarlos en el popup
      setAnalysisResults({
        companyName,
        website: domain,
        seoAnalysis: response.data.seo,
        performanceAnalysis: response.data.performance,
        aiRecommendations: response.data.aiRecommendations,
      })

      // Cerrar el diálogo de añadir empresa y abrir el de resultados
      setOpen(false)
      setCompanyName("")
      setWebsite("")
      setResultsOpen(true)
      
      // Recargar la página para actualizar el dashboard
      router.refresh()
    } catch (err) {
      console.error("Error al analizar empresa:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Error al analizar el sitio. Verifica que la URL sea correcta."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Añadir Empresa
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Añadir Nueva Empresa</DialogTitle>
            <DialogDescription>
              Ingresa la información de la empresa que deseas analizar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="company-name">Nombre de la Empresa</Label>
                <Input
                  id="company-name"
                  placeholder="Ej: Mi Empresa S.A."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Sitio Web</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.ejemplo.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && (
              <div className="text-sm text-destructive px-4">{error}</div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  setError(null)
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  "Añadir Empresa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Popup de Resultados */}
      {analysisResults && (
        <ResultsDialog
          open={resultsOpen}
          onOpenChange={setResultsOpen}
          companyName={analysisResults.companyName}
          website={analysisResults.website}
          seoAnalysis={analysisResults.seoAnalysis}
          performanceAnalysis={analysisResults.performanceAnalysis}
          aiRecommendations={analysisResults.aiRecommendations}
        />
      )}
    </>
  )
}
