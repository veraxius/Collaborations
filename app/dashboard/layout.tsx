"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { LanguageProvider } from "@/components/providers/language-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <LanguageProvider>
      <div className="flex h-screen max-w-full overflow-hidden bg-background">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {open && (
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setOpen(false)}>
            <div className="h-full w-[260px]" onClick={(event) => event.stopPropagation()}>
              <Sidebar />
            </div>
          </div>
        )}

        <main className="flex-1 max-w-full overflow-x-hidden overflow-y-auto bg-background">
          <div className="md:hidden px-4 pt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(true)}
              className="hover:bg-surface-elevated"
            >
              <Menu className="h-5 w-5 text-text-secondary" />
            </Button>
          </div>
          <div className="max-w-full p-4 md:p-8 lg:p-10">{children}</div>
        </main>
      </div>
    </LanguageProvider>
  )
}
