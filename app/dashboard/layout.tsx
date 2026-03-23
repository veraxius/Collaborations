"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen max-w-full overflow-hidden overflow-x-hidden bg-[var(--paper)]">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 md:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-[220px]" onClick={(event) => event.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      <main className="flex-1 max-w-full overflow-x-hidden overflow-y-auto bg-[var(--paper)]">
        <div className="md:hidden px-4 pt-4">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-w-full p-4 md:p-[36px_40px]">{children}</div>
      </main>
    </div>
  )
}
