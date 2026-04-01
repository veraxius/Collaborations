"use client"

export const dynamic = "force-dynamic"

import { useCallback, useEffect, useRef, useState } from "react"
import { getSupabase } from "@/lib/supabase"
import { useLanguage } from "@/components/providers/language-provider"

interface Documento {
  name: string
  path: string
  size: number
  created_at: string
}

interface StorageListItem {
  name: string
  created_at?: string
  metadata?: { size?: number }
}

const MAX_SIZE_BYTES = 20 * 1024 * 1024
const acceptedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"]

function getFileIcon(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith(".pdf")) return "📄"
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv")) return "📊"
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "📝"
  return "📁"
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string, language: "es" | "en"): string {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString(language === "en" ? "en-US" : "es-AR")
}

function cleanFileName(name: string): string {
  return name.replace(/^\d+-/, "").replace(/_/g, " ")
}

export default function DocumentosPage() {
  const { language } = useLanguage()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploadHover, setIsUploadHover] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analizando, setAnalizando] = useState(false)
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null)
  const [analysisMessageColor, setAnalysisMessageColor] = useState<string>("#0A7B6B")
  const [deletingPath, setDeletingPath] = useState<string | null>(null)

  const loadDocumentos = useCallback(async (currentUserId: string, showRefreshState = false) => {
    const supabase = getSupabase()
    if (showRefreshState) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const { data, error: listError } = await supabase.storage
        .from("documentos")
        .list(currentUserId, {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        })

      if (listError) {
        throw new Error(listError.message)
      }

      const mapped: Documento[] = ((data ?? []) as StorageListItem[])
        .filter((item) => item.name !== ".emptyFolderPlaceholder")
        .map((item) => ({
          name: item.name,
          path: `${currentUserId}/${item.name}`,
          size: typeof item.metadata?.size === "number" ? item.metadata.size : 0,
          created_at: item.created_at ?? "",
        }))

      setDocumentos(mapped)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Error cargando documentos"
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      const supabase = getSupabase()
      setLoading(true)
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw new Error(userError.message)
        if (!user) {
          setDocumentos([])
          throw new Error("No autenticado")
        }

        setUserId(user.id)
        await loadDocumentos(user.id)
      } catch (caughtError) {
        const message =
          caughtError instanceof Error ? caughtError.message : "Error cargando documentos"
        setError(message)
        setLoading(false)
      }
    }

    void bootstrap()
  }, [loadDocumentos])

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    }
  }, [])

  const hasValidExtension = (fileName: string): boolean => {
    const lowerName = fileName.toLowerCase()
    return acceptedExtensions.some((extension) => lowerName.endsWith(extension))
  }

  const onFilesSelected = async (files: FileList | null) => {
    const supabase = getSupabase()
    if (!files?.length || !userId) return

    setUploadError(null)
    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        if (!hasValidExtension(file.name)) {
          setUploadError("Solo se permiten PDF, Word, Excel y CSV.")
          continue
        }
        if (file.size > MAX_SIZE_BYTES) {
          setUploadError("Cada archivo debe pesar máximo 20MB.")
          continue
        }

        const safeName = file.name.replace(/\s+/g, "_")
        const path = `${userId}/${Date.now()}-${safeName}`
        const { error: uploadErrorResult } = await supabase.storage
          .from("documentos")
          .upload(path, file, { upsert: false })

        if (uploadErrorResult) {
          setUploadError(uploadErrorResult.message || "No se pudo subir un archivo.")
        }
      }

      await loadDocumentos(userId, true)
    } finally {
      setUploading(false)
    }
  }

  const triggerAnalysis = async () => {
    if (analizando) return
    setAnalizando(true)
    setAnalysisMessage(null)

    try {
      const response = await fetch("/api/ai/analizar", { method: "POST" })
      const body = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        throw new Error(body.error || "No se pudo actualizar el análisis")
      }

      setAnalysisMessage("✓ Análisis actualizado correctamente")
      setAnalysisMessageColor("#0A7B6B")
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Error al actualizar análisis con IA"
      setAnalysisMessage(message)
      setAnalysisMessageColor("#E8503A")
    } finally {
      setAnalizando(false)
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
      messageTimeoutRef.current = setTimeout(() => {
        setAnalysisMessage(null)
      }, 3000)
    }
  }

  const isUploadActive = isDragging || isUploadHover

  const handleRefresh = () => {
    if (!userId) return
    void loadDocumentos(userId, true)
  }

  const handleDownload = async (doc: Documento) => {
    const supabase = getSupabase()
    try {
      const { data, error: downloadError } = await supabase.storage
        .from("documentos")
        .download(doc.path)

      if (downloadError || !data) {
        throw new Error(downloadError?.message || "No se pudo descargar el archivo")
      }

      const url = URL.createObjectURL(data)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = cleanFileName(doc.name)
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "No se pudo descargar"
      setError(message)
    }
  }

  const handleDelete = async (doc: Documento) => {
    const supabase = getSupabase()
    setDeletingPath(doc.path)
    setError(null)

    try {
      const { error: removeError } = await supabase.storage
        .from("documentos")
        .remove([doc.path])

      if (removeError) {
        throw new Error(removeError.message)
      }

      setDocumentos((prev) => prev.filter((item) => item.path !== doc.path))
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "No se pudo eliminar"
      setError(message)
    } finally {
      setDeletingPath(null)
    }
  }

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        color: "#0D0D0F",
        minHeight: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "#0D0D0F",
            }}
          >
            Documentos
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "13px",
              color: "rgba(13,13,15,0.5)",
            }}
          >
            {documentos.length} {documentos.length === 1 ? "archivo" : "archivos"}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {documentos.length > 0 && (
            <button
              onClick={() => void triggerAnalysis()}
              disabled={analizando}
              style={{
                background: "#0D0D0F",
                color: "#fff",
                padding: "9px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                border: "none",
                cursor: analizando ? "not-allowed" : "pointer",
                opacity: analizando ? 0.7 : 1,
                transform: "translateY(0)",
                transition: "background 0.15s ease, transform 0.15s ease",
              }}
              onMouseEnter={(event) => {
                if (!analizando) {
                  event.currentTarget.style.background = "#2a2a35"
                  event.currentTarget.style.transform = "translateY(-1px)"
                }
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "#0D0D0F"
                event.currentTarget.style.transform = "translateY(0)"
              }}
            >
              {analizando ? "Analizando..." : "✦ Actualizar análisis con IA"}
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              border: "1px solid rgba(13,13,15,0.1)",
              background: "transparent",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 500,
              color: "#0D0D0F",
              cursor: refreshing ? "not-allowed" : "pointer",
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            {refreshing ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {analysisMessage && (
        <p
          style={{
            margin: "0 0 12px",
            color: analysisMessageColor,
            fontSize: "13px",
          }}
        >
          {analysisMessage}
        </p>
      )}

      <div
        style={{
          border: `1px dashed ${isUploadActive ? "#2563EB" : "rgba(59,130,246,0.4)"}`,
          borderRadius: "12px",
          padding: "28px",
          background: isUploadActive ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.03)",
          textAlign: "center",
          marginBottom: "16px",
          transition: "border-color 0.15s ease, background 0.15s ease",
          cursor: uploading ? "not-allowed" : "pointer",
          opacity: uploading ? 0.8 : 1,
        }}
        onClick={() => {
          if (!uploading) inputRef.current?.click()
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!uploading) setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          if (!uploading) void onFilesSelected(event.dataTransfer.files)
        }}
        onMouseEnter={() => setIsUploadHover(true)}
        onMouseLeave={() => setIsUploadHover(false)}
      >
        <div style={{ fontSize: "24px", lineHeight: 1, marginBottom: "8px" }}>📎</div>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 500,
            color: "#0D0D0F",
          }}
        >
          Hacé clic o arrastrá archivos acá
        </p>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "12px",
            color: "rgba(13,13,15,0.4)",
          }}
        >
          PDF, Word, Excel, CSV — máximo 20MB
        </p>
        {uploading && (
          <p
            className="animate-pulse"
            style={{
              margin: "10px 0 0",
              fontSize: "13px",
              color: "rgba(13,13,15,0.65)",
            }}
          >
            Subiendo...
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(event) => {
            void onFilesSelected(event.target.files)
            event.currentTarget.value = ""
          }}
        />
      </div>

      {uploadError && (
        <p
          style={{
            margin: "0 0 14px",
            color: "#E8503A",
            fontSize: "13px",
          }}
        >
          {uploadError}
        </p>
      )}

      {error && (
        <p
          style={{
            margin: "0 0 14px",
            color: "#E8503A",
            fontSize: "13px",
          }}
        >
          {error}
        </p>
      )}

      {loading ? (
        <div style={{ display: "grid", gap: "10px" }}>
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="animate-pulse"
              style={{
                height: "56px",
                borderRadius: "12px",
                background: "rgba(13,13,15,0.08)",
              }}
            />
          ))}
        </div>
      ) : documentos.length === 0 ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(13,13,15,0.1)",
            borderRadius: "16px",
            padding: "48px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "34px", lineHeight: 1, marginBottom: "12px" }}>📁</div>
          <p
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 500,
              color: "#0D0D0F",
            }}
          >
            Todavía no subiste documentos
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "13px",
              color: "rgba(13,13,15,0.5)",
            }}
          >
            Podés subirlos desde el onboarding para analizarlos luego en Lexora.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(13,13,15,0.1)",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 120px 120px",
              gap: "12px",
              alignItems: "center",
              padding: "12px 16px",
              fontSize: "11px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(13,13,15,0.4)",
              background: "rgba(13,13,15,0.02)",
            }}
          >
            <span>Archivo</span>
            <span>Tamaño</span>
            <span>Fecha</span>
            <span style={{ textAlign: "right" }}>Acciones</span>
          </div>

          {documentos.map((doc, index) => (
            <div
              key={doc.path}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 120px 120px",
                gap: "12px",
                alignItems: "center",
                padding: "12px 16px",
                borderBottom:
                  index === documentos.length - 1 ? "none" : "1px solid rgba(13,13,15,0.08)",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = "rgba(13,13,15,0.02)"
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "transparent"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(59,130,246,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "16px",
                  }}
                >
                  {getFileIcon(doc.name)}
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#0D0D0F",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={cleanFileName(doc.name)}
                >
                  {cleanFileName(doc.name)}
                </span>
              </div>

              <span style={{ fontSize: "12px", color: "rgba(13,13,15,0.5)" }}>
                {formatSize(doc.size)}
              </span>

              <span style={{ fontSize: "12px", color: "rgba(13,13,15,0.5)" }}>
                {formatDate(doc.created_at, language)}
              </span>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  onClick={() => void handleDownload(doc)}
                  style={{
                    background: "rgba(10,123,107,0.08)",
                    color: "#0A7B6B",
                    border: "none",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Descargar
                </button>

                <button
                  onClick={() => void handleDelete(doc)}
                  disabled={deletingPath === doc.path}
                  style={{
                    background: "rgba(232,80,58,0.08)",
                    color: "#E8503A",
                    border: "none",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: deletingPath === doc.path ? "not-allowed" : "pointer",
                    opacity: deletingPath === doc.path ? 0.4 : 1,
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
