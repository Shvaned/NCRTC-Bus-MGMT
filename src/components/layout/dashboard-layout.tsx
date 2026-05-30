"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { DriverBottomNav } from "./driver-bottom-nav"
import { PWAInstallPrompt } from "./pwa-install"
import { OfflineBanner } from "./offline-banner"
import { useSidebarStore } from "@/store"
import { cn } from "@/lib/utils"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarStore()
  const pathname = usePathname()
  const isDriver = pathname.startsWith("/driver")

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          "flex flex-1 flex-col transition-[margin] duration-300",
          "ml-0 lg:ml-64",
          isCollapsed && "lg:ml-16",
          isDriver && "pb-14" // space for bottom nav
        )}
      >
        <OfflineBanner />
        <Topbar />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
      {isDriver && <DriverBottomNav />}
      <PWAInstallPrompt />
    </div>
  )
}
