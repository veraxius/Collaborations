"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getSupabase } from "@/lib/supabase"

type AppLanguage = "es" | "en"

interface LanguageContextValue {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => Promise<void>
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = "lexora_language"

const esToEn: Record<string, string> = {
  "Configuración": "Settings",
  "Ajustes generales": "General settings",
  "Preferencias de cuenta, alertas e integraciones.": "Account preferences, alerts, and integrations.",
  "Visión general de tu operación": "Overview of your operations",
  "Cargando... ": "Loading... ",
  "Idioma": "Language",
  "Español": "Spanish",
  "Inglés": "English",
  "Guardado en tu cuenta": "Saved in your account",
  "Acciones rápidas": "Quick actions",
  "Principal": "Main",
  "Gestión": "Management",
  "Dashboard": "Dashboard",
  "Mejoras": "Improvements",
  "Documentos": "Documents",
  "Chat IA": "AI Chat",
  "Tareas": "Tasks",
  "Reportes": "Reports",
  "Activo": "Active",
  "Todo funcionando": "Everything running",
  "Ver todas las mejoras": "View all improvements",
  "Hablar con IA": "Talk to AI",
  "Subir documentos": "Upload documents",
  "Recomendaciones": "Recommendations",
  "pendientes de revisión": "pending review",
  "Score IA": "AI Score",
  "Estado": "Status",
  "vs mes pasado": "vs last month",
  "completado": "completed",
  "Completar configuración": "Complete setup",
  "Guardando...": "Saving...",
  "Siguiente": "Next",
  "Anterior": "Previous",
  "Paso": "Step",
  "de": "of",
  "Empresa": "Company",
  "Equipo": "Team",
  "Objetivos": "Goals",
  "Confirmación": "Confirmation",
  "Iniciar sesión": "Sign in",
  "Registrarse": "Sign up",
  "Crea tu cuenta": "Create your account",
  "Comienza a analizar tu negocio con IA": "Start analyzing your business with AI",
  "Nombre completo": "Full name",
  "Tu nombre": "Your name",
  "Confirmar contraseña": "Confirm password",
  "Repite tu contraseña": "Repeat your password",
  "Las contraseñas no coinciden": "Passwords do not match",
  "Email y contraseña son requeridos": "Email and password are required",
  "No se pudo completar el registro": "Could not complete registration",
  "Error al registrar": "Registration error",
  "Creando cuenta...": "Creating account...",
  "Crear cuenta": "Create account",
  "O regístrate con": "Or sign up with",
  "¿Ya tienes una cuenta?": "Already have an account?",
  "Inicia sesión": "Sign in",
  "Acepto los": "I accept the",
  "Términos de servicio": "Terms of service",
  "y la": "and the",
  "Política de privacidad": "Privacy policy",
  "Bienvenido de vuelta": "Welcome back",
  "Contraseña": "Password",
  "¿Olvidaste tu contraseña?": "Forgot your password?",
  "Recordarme": "Remember me",
  "O continúa con": "Or continue with",
  "Continuar con Google": "Continue with Google",
  "Regístrate gratis": "Sign up free",
  "¿No tienes una cuenta?": "Don't have an account?",
  "Inicia sesión para continuar con tu análisis": "Sign in to continue with your analysis",
  "Ingresando...": "Signing in...",
  "Configuración inicial": "Initial setup",
  "¿Necesitas ayuda?": "Need help?",
  "Nuestro asistente de IA puede guiarte en el proceso.": "Our AI assistant can guide you through the process.",
  "EN BASE A TUS TAREAS": "BASED ON YOUR TASKS",
  "Progreso operativo de tu empresa": "Your company's operational progress",
  "completadas esta semana": "completed this week",
  "Tareas completadas": "Completed tasks",
  "Tareas pendientes": "Pending tasks",
  "Generá tus primeras tareas para ver el progreso de tu empresa": "Generate your first tasks to see your company's progress",
  "Generar tareas": "Generate tasks",
  // /dashboard/tareas
  "Tareas de esta semana": "This week's tasks",
  "Generar nuevas tareas": "Generate new tasks",
  "Generar tareas con IA": "Generate tasks with AI",
  "No hay tareas esta semana.": "No tasks this week.",
  "Esta semana": "This week",
  "Completadas": "Completed",
  "Pendientes": "Pending",
  "alta": "high",
  "media": "medium",
  "baja": "low",
  // ScoreWidget
  "ÍNDICE DE MADUREZ OPERATIVA": "OPERATIONAL MATURITY INDEX",
  "Tu empresa está": "Your company is",
  "No pudimos calcular el score": "We couldn't calculate the score",
  "Reintentar": "Retry",
  "Todavía no hay score disponible.": "No score available yet.",
  "Generando...": "Generating...",
  "Generar análisis": "Generate analysis",
  "Sin cambios este mes": "No changes this month",
  "Actualizar score": "Update score",
  "Actualizando...": "Updating...",
  // ResumenWidget
  "No pudimos generar el resumen": "We couldn't generate the summary",
  "OPORTUNIDAD ESTA SEMANA": "OPPORTUNITY THIS WEEK",
  // RecomendacionesWidget
  "Mejoras prioritarias": "Priority improvements",
  "Ver todas →": "See all →",
  "No pudimos cargar recomendaciones": "We couldn't load recommendations",
  "Todavía no tenemos recomendaciones para tu empresa": "We don't have recommendations for your company yet",
  "Hacé tu primer análisis para ver tus mejoras": "Run your first analysis to see your improvements",
  "Analizando...": "Analyzing...",
  "Impacto": "Impact",
  "Esfuerzo": "Effort",
  // MetricasWidget
  "Documentos analizados": "Analyzed documents",
  "archivos procesados": "files processed",
  "Último análisis": "Last analysis",
  "Hoy": "Today",
  "Score vs mes anterior": "Score vs last month",
  "↑ mejorando": "↑ improving",
  "↓ bajando": "↓ decreasing",
  "sin cambios": "no change",
  "al día": "up to date",
  // /dashboard/documentos
  "archivo": "file",
  "archivos": "files",
  "✦ Actualizar análisis con IA": "✦ Update analysis with AI",
  "Actualizar": "Refresh",
  "✓ Análisis actualizado correctamente": "✓ Analysis updated successfully",
  "Hacé clic o arrastrá archivos acá": "Click or drag files here",
  "PDF, Word, Excel, CSV — máximo 20MB": "PDF, Word, Excel, CSV — max 20MB",
  "Subiendo...": "Uploading...",
  "Todavía no subiste documentos": "You haven't uploaded documents yet",
  "Podés subirlos desde el onboarding para analizarlos luego en Lexora.": "You can upload them from onboarding to analyze them later in Lexora.",
  "Archivo": "File",
  "Tamaño": "Size",
  "Fecha": "Date",
  "Acciones": "Actions",
  "Descargar": "Download",
  "Solo se permiten PDF, Word, Excel y CSV.": "Only PDF, Word, Excel, and CSV are allowed.",
  "Cada archivo debe pesar máximo 20MB.": "Each file must be at most 20MB.",
  "No se pudo subir un archivo.": "A file could not be uploaded.",
  "No se pudo actualizar el análisis": "Could not update the analysis",
  "Error al actualizar análisis con IA": "Error updating analysis with AI",
  "No se pudo descargar el archivo": "Could not download the file",
  "No se pudo descargar": "Could not download",
  "No se pudo eliminar": "Could not delete",
  "Error cargando documentos": "Error loading documents",
  "No autenticado": "Not authenticated",
  // /dashboard/reportes
  "Generá reportes ejecutivos con indicadores y evolución.": "Generate executive reports with indicators and trends.",
  "Historial de reportes": "Reports history",
  "Próximamente disponible en este nuevo módulo unificado.": "Coming soon in this new unified module.",
  // /dashboard/mejoras
  "Cargando análisis...": "Loading analysis...",
  "Mejoras recomendadas": "Recommended improvements",
  "Recomendaciones priorizadas por IA para tu empresa.": "AI-prioritized recommendations for your company.",
  "Actualizar análisis": "Refresh analysis",
  "Resumen ejecutivo": "Executive summary",
  "Todavía no hay análisis guardado para esta cuenta.": "There is no saved analysis for this account yet.",
  "Acción esta semana:": "Action this week:",
  "No autenticado.": "Not authenticated.",
  // /onboarding full
  "Información básica": "Basic information",
  "Tamaño y áreas": "Size and areas",
  "Archivos y procesos": "Files and processes",
  "Metas y prioridades": "Goals and priorities",
  "Revisar y enviar": "Review and submit",
  "Completá los campos obligatorios del paso Empresa.": "Complete the required fields in the Company step.",
  "Seleccioná la cantidad de empleados y al menos un área.": "Select employee count and at least one area.",
  "Definí al menos un objetivo y el problema principal.": "Define at least one goal and the main problem.",
  "Completa estos pasos para personalizar tu experiencia": "Complete these steps to personalize your experience",
  "Ocultar pasos": "Hide steps",
  "Ver pasos": "View steps",
  "Paso 1 de 5": "Step 1 of 5",
  "Iniciar análisis con IA": "Start AI analysis",
  "Resumen de tu configuración": "Summary of your setup",
  "Nombre de la empresa *": "Company name *",
  "Ej: Lexora SRL": "Ex: Lexora LLC",
  "Rubro / industria *": "Industry / sector *",
  "Seleccionar": "Select",
  "Comercio/Retail": "Commerce/Retail",
  "Manufactura": "Manufacturing",
  "Servicios profesionales": "Professional services",
  "Logística": "Logistics",
  "Tecnología": "Technology",
  "Salud": "Healthcare",
  "Construcción": "Construction",
  "Gastronomía": "Hospitality",
  "Educación": "Education",
  "Finanzas": "Finance",
  "Agropecuario": "Agribusiness",
  "Otro": "Other",
  "Años en el mercado": "Years in the market",
  "Menos de 1 año": "Less than 1 year",
  "1-3 años": "1-3 years",
  "3-5 años": "3-5 years",
  "5-10 años": "5-10 years",
  "Más de 10 años": "More than 10 years",
  "País *": "Country *",
  "Argentina": "Argentina",
  "México": "Mexico",
  "Colombia": "Colombia",
  "Chile": "Chile",
  "Uruguay": "Uruguay",
  "España": "Spain",
  "Sitio web": "Website",
  "Descripción breve *": "Short description *",
  "Contanos qué hace tu empresa y su propuesta de valor.": "Tell us what your company does and its value proposition.",
  "Cantidad de empleados *": "Number of employees *",
  "Facturación anual": "Annual revenue",
  "Prefiero no decir": "Prefer not to say",
  "Menos de $1M": "Less than $1M",
  "$1M-$10M": "$1M-$10M",
  "$10M-$50M": "$10M-$50M",
  "Más de $50M": "More than $50M",
  "Áreas (mínimo 1) *": "Areas (minimum 1) *",
  "Ventas": "Sales",
  "Operaciones": "Operations",
  "Finanzas/Contabilidad": "Finance/Accounting",
  "RRHH": "HR",
  "Producción": "Production",
  "Atención al cliente": "Customer support",
  "IT/Tecnología": "IT/Technology",
  "Legal": "Legal",
  "Compras": "Purchasing",
  "Herramientas actuales": "Current tools",
  "Excel/Google Sheets": "Excel/Google Sheets",
  "WhatsApp Business": "WhatsApp Business",
  "Gmail/Outlook": "Gmail/Outlook",
  "Trello/Asana": "Trello/Asana",
  "Slack": "Slack",
  "Facturación electrónica": "E-invoicing",
  "ERP": "ERP",
  "CRM": "CRM",
  "Ninguna": "None",
  "Objetivos (mínimo 1) *": "Goals (minimum 1) *",
  "Reducir costos operativos": "Reduce operating costs",
  "Automatizar tareas manuales": "Automate manual tasks",
  "Mejorar tiempos de entrega": "Improve delivery times",
  "Aumentar ventas": "Increase sales",
  "Mejorar atención al cliente": "Improve customer service",
  "Organizar la información": "Organize information",
  "Mejorar comunicación interna": "Improve internal communication",
  "Control financiero": "Financial control",
  "Escalar el negocio": "Scale the business",
  "Retener talento": "Retain talent",
  "¿Cuál es el principal problema que querés resolver? *": "What is the main problem you want to solve? *",
  "Tiempo esperado de resultados": "Expected time for results",
  "En el próximo mes": "In the next month",
  "En 3 meses": "In 3 months",
  "En 6 meses": "In 6 months",
  "En el próximo año": "In the next year",
  "Arrastrá y soltá tus documentos acá": "Drag and drop your documents here",
  "PDF, Word, Excel, CSV - máximo 20MB por archivo": "PDF, Word, Excel, CSV - max 20MB per file",
  "Seleccionar archivos": "Select files",
  "Archivos subidos": "Uploaded files",
  "No subiste archivos todavía.": "You haven't uploaded files yet.",
  "Total de archivos:": "Total files:",
  "¿No tenés documentos? Describí tus procesos principales": "No documents? Describe your main processes",
  "Por ejemplo: cómo captan clientes, cómo venden y cómo entregan el servicio.": "For example: how you attract customers, how you sell, and how you deliver the service.",
  "Empresa:": "Company:",
  "Rubro:": "Industry:",
  "Empleados:": "Employees:",
  "Áreas:": "Areas:",
  "Objetivos:": "Goals:",
  "Archivos subidos:": "Uploaded files:",
}

const nivelesMap: Record<string, string> = {
  "inicial": "initial",
  "en desarrollo": "in progress",
  "consolidado": "consolidated",
  "avanzado": "advanced",
  "excelente": "excellent",
}

const impactoMap: Record<string, string> = {
  "alto": "high",
  "medio": "medium",
  "bajo": "low",
}

function translateDynamicEsToEn(text: string): string | null {
  // 1) N% completado
  let m = text.match(/^(\s*)(\d+)\s*%\s*completado(\s*)$/i)
  if (m) return `${m[1]}${m[2]}% completed${m[3]}`

  // 2) N pendientes de revisión
  m = text.match(/^(\s*)(\d+)\s+pendientes de revisión(\s*)$/i)
  if (m) return `${m[1]}${m[2]} pending review${m[3]}`

  // 2b) A/B completadas
  m = text.match(/^(\s*)(\d+)\s*\/\s*(\d+)\s+completadas(\s*)$/i)
  if (m) return `${m[1]}${m[2]}/${m[3]} completed${m[4]}`

  // 3) Tu empresa está {nivel}
  m = text.match(/^(\s*)Tu empresa está\s+(inicial|en desarrollo|consolidado|avanzado|excelente)(\s*)$/i)
  if (m) {
    const levelEs = m[2].toLowerCase()
    const levelEn = nivelesMap[levelEs] ?? levelEs
    return `${m[1]}Your company is ${levelEn}${m[3]}`
  }

  // 4) Impacto {alto|medio|bajo}
  m = text.match(/^(\s*)Impacto\s+(alto|medio|bajo)(\s*)$/i)
  if (m) {
    const v = m[2].toLowerCase()
    const vEn = impactoMap[v] ?? v
    return `${m[1]}Impact ${vEn}${m[3]}`
  }

  // 5) Esfuerzo {alto|medio|bajo}
  m = text.match(/^(\s*)Esfuerzo\s+(alto|medio|bajo)(\s*)$/i)
  if (m) {
    const v = m[2].toLowerCase()
    const vEn = impactoMap[v] ?? v
    return `${m[1]}Effort ${vEn}${m[3]}`
  }

  // 6) ↑ +X puntos este mes / ↓ -X puntos este mes
  m = text.match(/^(\s*)(↑|\u2191|↓|\u2193)\s*\+?(-?\d+)\s+puntos este mes(\s*)$/i)
  if (m) {
    return `${m[1]}${m[2]} ${m[3]} points this month${m[4]}`
  }

  // 7) Buenos días / Buenas tardes
  m = text.match(/^(\s*)Buenos días(\s*)$/i)
  if (m) return `${m[1]}Good morning${m[2]}`
  m = text.match(/^(\s*)Buenas tardes(\s*)$/i)
  if (m) return `${m[1]}Good afternoon${m[2]}`

  // 8) Paso X de Y
  m = text.match(/^(\s*)Paso\s+(\d+)\s+de\s+(\d+)(\s*)$/i)
  if (m) return `${m[1]}Step ${m[2]} of ${m[3]}${m[4]}`

  return null
}

function translateTextNodeContent(content: string): string | null {
  const trimmed = content.trim()
  if (!trimmed) return null
  // Exact dictionary match
  if (esToEn[trimmed]) {
    const leading = content.match(/^\s*/)?.[0] ?? ""
    const trailing = content.match(/\s*$/)?.[0] ?? ""
    return `${leading}${esToEn[trimmed]}${trailing}`
  }
  // Dynamic patterns
  const dyn = translateDynamicEsToEn(content)
  if (dyn) return dyn
  // Substring fallback for small labels within longer text (rare)
  // Example: replace "vs mes pasado" inside a longer text node
  let replaced = content
  let changed = false
  Object.entries(esToEn).forEach(([es, en]) => {
    if (replaced.includes(es)) {
      replaced = replaced.split(es).join(en)
      changed = true
    }
  })
  return changed ? replaced : null
}

function applyTranslation(language: AppLanguage) {
  if (typeof document === "undefined") return

  document.documentElement.lang = language

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text)
  }

  textNodes.forEach((node) => {
    const parent = node.parentElement
    if (!parent) return
    const current = node.nodeValue ?? ""
    if (!current.trim()) return

    if (language === "en") {
      const translated = translateTextNodeContent(current)
      if (translated) {
        if (!parent.dataset.lexOriginalText) {
          parent.dataset.lexOriginalText = current
        }
        node.nodeValue = translated
        return
      }
      return // keep Spanish if not in dictionary
    }

    if (parent.dataset.lexOriginalText) {
      node.nodeValue = parent.dataset.lexOriginalText
      delete parent.dataset.lexOriginalText
    }
  })

  const translatableAttrs = ["placeholder", "title", "aria-label"] as const
  const elements = Array.from(document.querySelectorAll<HTMLElement>("*"))
  elements.forEach((element) => {
    translatableAttrs.forEach((attr) => {
      const value = element.getAttribute(attr)
      if (!value) return

      if (language === "en") {
        const translated = translateTextNodeContent(value) ?? esToEn[value]
        if (!translated) return
        const datasetKey = `lexOriginalAttr${attr.replace("-", "")}`
        if (!element.dataset[datasetKey]) {
          element.dataset[datasetKey] = value
        }
        element.setAttribute(attr, translated)
        return
      }

      const datasetKey = `lexOriginalAttr${attr.replace("-", "")}`
      const original = element.dataset[datasetKey]
      if (original) {
        element.setAttribute(attr, original)
        delete element.dataset[datasetKey]
      }
    })
  })
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en")

  useEffect(() => {
    let mounted = true
    const loadLanguage = async () => {
      const local = localStorage.getItem(STORAGE_KEY)
      if (local === "es" || local === "en") {
        setLanguageState(local)
        applyTranslation(local)
      } else {
        applyTranslation("en")
      }

      try {
        const supabase = getSupabase()
        const { data } = await supabase.auth.getUser()
        const remoteLang = data.user?.user_metadata?.preferred_language
        if (!mounted) return
        if (remoteLang === "es" || remoteLang === "en") {
          setLanguageState(remoteLang)
          localStorage.setItem(STORAGE_KEY, remoteLang)
          applyTranslation(remoteLang)
        }
      } catch {
        // noop
      }
    }
    void loadLanguage()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    applyTranslation(language)
    let isApplying = false
    const observer = new MutationObserver(() => {
      if (isApplying) return
      isApplying = true
      applyTranslation(language)
      isApplying = false
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [language])

  const setLanguage = async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage)
    localStorage.setItem(STORAGE_KEY, nextLanguage)
    applyTranslation(nextLanguage)

    try {
      const supabase = getSupabase()
      await supabase.auth.updateUser({
        data: {
          preferred_language: nextLanguage,
        },
      })
    } catch {
      // noop
    }
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
    }),
    [language]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

