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
      // Extract the domain from the website
      let domain = website.trim()
      
      // If it has a protocol, extract just the domain
      try {
        const url = new URL(domain)
        domain = url.hostname.replace("www.", "")
      } catch {
        // If it's not a valid URL, use the value as-is
        domain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "")
      }

      // Call the API to analyze SEO and Performance
      const response = await axios.post("/api/analyze", { domain })
      
      // Save the data in localStorage (in production you would use a database)
      const companyData = {
        companyName,
        website: domain,
        seoAnalysis: response.data.seo,
        performanceAnalysis: response.data.performance,
        aiRecommendations: response.data.aiRecommendations,
        createdAt: new Date().toISOString(),
      }
      
      // Get existing companies
      const existingCompanies = JSON.parse(
        localStorage.getItem("companies") || "[]"
      )
      existingCompanies.push(companyData)
      localStorage.setItem("companies", JSON.stringify(existingCompanies))
      
      // Save the currently selected company
      localStorage.setItem("currentCompany", JSON.stringify(companyData))

      // Save the results to show them in the popup
      setAnalysisResults({
        companyName,
        website: domain,
        seoAnalysis: response.data.seo,
        performanceAnalysis: response.data.performance,
        aiRecommendations: response.data.aiRecommendations,
      })

      // Close the add-company dialog and open the results dialog
      setOpen(false)
      setCompanyName("")
      setWebsite("")
      setResultsOpen(true)
      
      // Reload the page to refresh the dashboard
      router.refresh()
    } catch (err) {
      console.error("Error analyzing company:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Error analyzing the site. Please check that the URL is correct."
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
            Add Company
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>
              Enter the information of the company you want to analyze.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="E.g.: My Company Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.example.com"
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
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Add Company"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Results Popup */}
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
