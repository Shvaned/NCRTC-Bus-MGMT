"use client"

import { useMemo } from "react"
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

type NavItemKey = "dashboard" | "fleet" | "routes" | "scheduling" | "incidents" | "notices" | "reports" | "notifications" | "settings"

interface NavItemTemplate {
  key: NavItemKey
  label: string
  icon: LucideIcon
  permission?: string
}

const NAV_TEMPLATES: NavItemTemplate[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "fleet", label: "Fleet", icon: Bus, permission: "vehicle.read" },
  { key: "routes", label: "Routes", icon: MapPin, permission: "route.read" },
  { key: "scheduling", label: "Scheduling", icon: Calendar, permission: "duty.read" },
  { key: "incidents", label: "Incidents", icon: AlertTriangle, permission: "incident.read" },
  { key: "notices", label: "Notices", icon: FileText, permission: "notice.read" },
  { key: "reports", label: "Reports", icon: BarChart3, permission: "reporting.read" },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "settings", label: "Settings", icon: Settings },
]

// Every link resolves to an existing page — no dead ends
const NAV_HREF_BY_ROLE: Record<SystemRole, Record<NavItemKey, string>> = {
  admin: {
    dashboard: "/admin",
    fleet: "/control-room/avls",
    routes: "/admin/routes",
    scheduling: "/depot/roster",
    incidents: "/control-room/incidents",
    notices: "/admin/cms",
    reports: "/reports",
    notifications: "/notifications",
    settings: "/settings",
  },
  control_operator: {
    dashboard: "/control-room",
    fleet: "/control-room/avls",
    routes: "/admin/routes",
    scheduling: "/depot/roster",
    incidents: "/control-room/incidents",
    notices: "/admin/cms",
    reports: "/reports",
    notifications: "/notifications",
    settings: "/settings",
  },
  depot_manager: {
    dashboard: "/depot",
    fleet: "/depot/avls",
    routes: "/admin/routes",
    scheduling: "/depot/roster",
    incidents: "/control-room/incidents",
    notices: "/admin/cms",
    reports: "/reports",
    notifications: "/notifications",
    settings: "/settings",
  },
  driver: {
    dashboard: "/driver",
    fleet: "/driver/tracking",
    routes: "/admin/routes",
    scheduling: "/driver/duty",
    incidents: "/driver/incidents",
    notices: "/driver/notices",
    reports: "/reports",
    notifications: "/notifications",
    settings: "/settings",
  },
  conductor: {
    dashboard: "/driver",
    fleet: "/driver/tracking",
    routes: "/admin/routes",
    scheduling: "/driver/duty",
    incidents: "/driver/incidents",
    notices: "/driver/notices",
    reports: "/reports",
    notifications: "/notifications",
    settings: "/settings",
  },
  executive: {
    dashboard: "/executive",
    fleet: "/control-room/avls",
    routes: "/admin/routes",
    scheduling: "/depot/roster",
    incidents: "/control-room/incidents",
    notices: "/admin/cms",
    reports: "/reports",
    notifications: "/notifications",
    settings: "/settings",
  },
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isCollapsed, toggle, isMobileOpen, setMobileOpen } = useSidebarStore()

  const role = (session?.user as Record<string, unknown>)?.role as SystemRole | undefined
  const basePath = role ? ROUTE_BY_ROLE[role] : "/admin"

  const navItems = useMemo(() => {
    if (!role) return [] as { key: NavItemKey; label: string; href: string; icon: LucideIcon; permission?: string }[]
    const hrefMap = NAV_HREF_BY_ROLE[role]
    return NAV_TEMPLATES.map((t) => ({
      key: t.key,
      label: t.label,
      href: hrefMap[t.key],
      icon: t.icon,
      permission: t.permission,
    }))
  }, [role])

  return (
    <>
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
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
          {!isCollapsed && (
            <Link href={basePath} className="flex items-center gap-2">
              <Bus className="size-6 text-primary" />
              <span className="font-bold text-sm text-sidebar-foreground">NCRTC BMS</span>
            </Link>
          )}
          <Button
            variant="ghost" size="icon"
            onClick={toggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent hidden lg:flex"
          >
            <ChevronLeft className={cn("size-4 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={() => setMobileOpen(false)}
            className="text-sidebar-foreground lg:hidden"
          >
            <Menu className="size-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = item.key === "dashboard"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/")

              const link = (
                <Link
                  key={item.key}
                  href={item.href}
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
                  <Tooltip key={item.key}>
                    <TooltipTrigger>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                )
              }

              return link
            })}
          </nav>
        </ScrollArea>

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
