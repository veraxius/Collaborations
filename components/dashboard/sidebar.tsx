"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Bot, Wrench, ClipboardList, BarChart3, Settings, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { LexoraFavicon } from "@/components/ui/lexora-logo"
import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase"

const principalItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/mejoras", label: "Improvements", icon: Wrench },
  { href: "/dashboard/documentos", label: "Documents", icon: FileText },
  { href: "/dashboard/chat", label: "AI Chat", icon: Bot, isAI: true },
]

const gestionItems = [
  { href: "/dashboard/tareas", label: "Tasks", icon: ClipboardList },
  { href: "/dashboard/reportes", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/configuracion", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [companyName, setCompanyName] = useState<string>("")

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const supabase = getSupabase()
        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user) return
        const { data: profile } = await supabase
          .from("profiles")
          .select("empresa_data")
          .eq("id", user.id)
          .single()
        const nombre = (profile as any)?.empresa_data?.empresa?.nombreEmpresa
        if (typeof nombre === "string" && nombre.trim().length > 0) {
          setCompanyName(nombre.trim())
        }
      } catch {
        // noop
      }
    }
    void loadCompany()
  }, [])

  return (
    <aside
      className="flex h-full w-[260px] flex-col bg-surface border-r border-light"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-light">
        <LexoraFavicon />
        <span className="font-display text-lg text-text-primary">
          Lexora
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6">
        {/* Main Section */}
        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            Main
          </p>
          <div className="space-y-1">
            {principalItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : item.isAI
                        ? "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-700"
                        : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-primary-600" : item.isAI ? "text-secondary-500" : "text-text-tertiary"
                  )} />
                  <span>{item.label}</span>
                  {item.isAI && (
                    <Sparkles className="w-3.5 h-3.5 ml-auto text-secondary-500" />
                  )}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Management Section */}
        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            Management
          </p>
          <div className="space-y-1">
            {gestionItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-primary-600" : "text-text-tertiary"
                  )} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-light">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-semibold">
            {(companyName?.[0] ?? "U").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {companyName || "Your company"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
