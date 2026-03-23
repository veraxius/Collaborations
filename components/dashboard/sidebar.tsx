"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Bot, Wrench, ClipboardList, BarChart3, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { LexoraFavicon, LexoraLogo } from "@/components/ui/lexora-logo"

const principalItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/mejoras", label: "Mejoras", icon: Wrench },
  { href: "/dashboard/documentos", label: "Documentos", icon: FileText },
  { href: "/dashboard/chat", label: "Chat IA", icon: Bot },
]

const gestionItems = [
  { href: "/dashboard/tareas", label: "Tareas", icon: ClipboardList },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="flex h-full w-[220px] flex-col p-[28px_20px] text-white"
      style={{
        background: "rgba(200, 110, 35, 0.62)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderRight: "1px solid rgba(220, 140, 60, 0.4)",
        backgroundImage:
          "radial-gradient(circle at 12px 12px, rgba(255,255,255,0.10) 1px, rgba(0,0,0,0) 1.2px), radial-gradient(circle at 6px 6px, rgba(255,255,255,0.05) 1px, rgba(0,0,0,0) 1.2px), linear-gradient(180deg, rgba(220,140,60,0.14), rgba(180,90,30,0.08))",
        backgroundSize: "24px 24px, 24px 24px, 100% 100%",
        backgroundBlendMode: "overlay, overlay, normal",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px" }}>
        <LexoraFavicon />
        <LexoraLogo size="small" theme="light" />
      </div>

      <nav className="flex-1">
        <p className="mb-[6px] ml-2 mt-4 text-[10px] font-medium uppercase tracking-[0.1em] text-white/25">
          Principal
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
                  "flex items-center justify-between rounded-[8px] px-[10px] py-[9px] text-[13px] font-medium transition-all",
                  isActive
                    ? "bg-[rgba(201,168,76,0.15)] text-[var(--gold-light)]"
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {isActive ? <span className="text-[var(--gold)]">•</span> : null}
              </Link>
            )
          })}
        </div>

        <p className="mb-[6px] ml-2 mt-4 text-[10px] font-medium uppercase tracking-[0.1em] text-white/25">
          Gestión
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
                  "flex items-center justify-between rounded-[8px] px-[10px] py-[9px] text-[13px] font-medium transition-all",
                  isActive
                    ? "bg-[rgba(201,168,76,0.15)] text-[var(--gold-light)]"
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {isActive ? <span className="text-[var(--gold)]">•</span> : null}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-white/[0.06] pt-4">
        <div className="flex items-center gap-2">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[var(--gold)] text-[12px] font-medium text-[var(--ink)]">
            A
          </div>
          <div>
            <p className="text-[12px] font-medium text-white">Adriel</p>
            <p className="text-[11px] text-white/30">Plan Pro</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
