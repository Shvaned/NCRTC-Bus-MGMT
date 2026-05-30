"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/store"
import { useSession } from "next-auth/react"
import { ROUTE_BY_ROLE } from "@/lib/constants/roles"
import type { SystemRole } from "@/types"
import {
  LayoutDashboard,
  Bus,
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  Menu,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  permission?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "Fleet", href: "/fleet", icon: Bus, permission: "vehicle.read" },
  { label: "Routes", href: "/routes", icon: MapPin, permission: "route.read" },
  { label: "Scheduling", href: "/scheduling", icon: Calendar, permission: "duty.read" },
  { label: "Incidents", href: "/incidents", icon: AlertTriangle, permission: "incident.read" },
  { label: "Notices", href: "/notices", icon: FileText, permission: "notice.read" },
  { label: "Reports", href: "/reports", icon: BarChart3, permission: "reporting.read" },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isCollapsed, toggle, isMobileOpen, setMobileOpen } = useSidebarStore()

  const role = (session?.user as Record<string, unknown>)?.role as SystemRole | undefined
  const basePath = role ? ROUTE_BY_ROLE[role] : "/admin"

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
          {!isCollapsed && (
            <Link href={basePath} className="flex items-center gap-2">
              <Bus className="size-6 text-primary" />
              <span className="font-bold text-sm text-sidebar-foreground">NCRTC BMS</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent hidden lg:flex"
          >
            <ChevronLeft className={cn("size-4 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="text-sidebar-foreground lg:hidden"
          >
            <Menu className="size-4" />
          </Button>
        </div>

        {/* Nav items */}
        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const href = `${basePath}${item.href}`
              const isActive = pathname === href || (item.href ? pathname.startsWith(href) : pathname === basePath)

              const link = (
                <Link
                  key={item.label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="size-5 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                )
              }

              return link
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          {!isCollapsed && (
            <p className="text-xs text-muted-foreground text-center">
              NCRTC Bus Management v1.0
            </p>
          )}
        </div>
      </aside>
    </>
  )
}
