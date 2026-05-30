"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { useQuery } from "@tanstack/react-query"
import { ROLE_LABELS } from "@/lib/constants/roles"
import type { SystemRole } from "@/types"
import { Sun, Moon, LogOut, User, ChevronDown, Menu, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSidebarStore } from "@/store"
import { useState, useEffect } from "react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

export function Topbar() {
  const { data: session } = useSession()
  const { setTheme, theme } = useTheme()
  const { setMobileOpen } = useSidebarStore()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch — only render theme/icons after mount
  useEffect(() => { setMounted(true) }, [])

  const user = session?.user
  const role = (user as Record<string, unknown>)?.role as SystemRole | undefined
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase() : "U"

  const { data: notifData } = useQuery<{ success: true; data: { count: number } }>({
    queryKey: ["notifications-unread-count"],
    queryFn: () => fetch("/api/v1/notifications/unread-count").then((r) => r.json()),
    refetchInterval: 30000,
  })
  const unreadCount = notifData?.data?.count ?? 0

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault()
        setCmdOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Format date only after mount to avoid SSR mismatch
  const todayStr = mounted
    ? new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : ""

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
          <Menu className="size-5" />
        </Button>
        <div>
          <p className="text-sm font-medium text-foreground">{role ? ROLE_LABELS[role] : "Dashboard"}</p>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {todayStr}
          </p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => setCmdOpen(true)}
          className="hidden md:inline-flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Search className="size-3" />
          Search...
          <kbd className="ml-4 rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        {/* Theme toggle — only render icons after mount to avoid hydration mismatch */}
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {mounted ? (
            theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />
          ) : (
            <span className="size-4" />
          )}
        </Button>

        {/* User menu — fix: remove nested button, style trigger directly */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors">
            <Avatar className="size-7"><AvatarFallback className="text-xs">{initials}</AvatarFallback></Avatar>
            <span className="text-sm hidden md:inline max-w-[120px] truncate">{user?.name}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{role ? ROLE_LABELS[role] : ""}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = "/notifications"}>
              <Bell className="size-4 mr-2" />Notifications{unreadCount > 0 && <span className="ml-auto text-xs text-muted-foreground">{unreadCount}</span>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="size-4 mr-2" />Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </header>
  )
}

function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search vehicles, routes, drivers, incidents..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => { window.location.href = "/control-room/avls"; onOpenChange(false) }}>
            <Search className="size-4 mr-2" />Live Fleet Map
          </CommandItem>
          <CommandItem onSelect={() => { window.location.href = "/control-room/incidents"; onOpenChange(false) }}>
            <Search className="size-4 mr-2" />Incident Command Center
          </CommandItem>
          <CommandItem onSelect={() => { window.location.href = "/admin/routes"; onOpenChange(false) }}>
            <Search className="size-4 mr-2" />Route Management
          </CommandItem>
          <CommandItem onSelect={() => { window.location.href = "/admin/cms"; onOpenChange(false) }}>
            <Search className="size-4 mr-2" />Notice Management
          </CommandItem>
          <CommandItem onSelect={() => { window.location.href = "/executive"; onOpenChange(false) }}>
            <Search className="size-4 mr-2" />Executive Dashboard
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
