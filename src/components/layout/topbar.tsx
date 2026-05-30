"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { useQuery } from "@tanstack/react-query"
import { ROLE_LABELS } from "@/lib/constants/roles"
import type { SystemRole } from "@/types"
import { Sun, Moon, LogOut, User, ChevronDown, Menu, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSidebarStore } from "@/store"
import { useState, useEffect, useCallback } from "react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

export function Topbar() {
  const { data: session } = useSession()
  const { setTheme, theme } = useTheme()
  const { setMobileOpen } = useSidebarStore()
  const [cmdOpen, setCmdOpen] = useState(false)

  const user = session?.user
  const role = (user as Record<string, unknown>)?.role as SystemRole | undefined
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase() : "U"

  // Notification unread count
  const { data: notifData } = useQuery<{ success: true; data: { count: number } }>({
    queryKey: ["notifications-unread-count"],
    queryFn: () => fetch("/api/v1/notifications/unread-count").then((r) => r.json()),
    refetchInterval: 30000,
  })
  const unreadCount = notifData?.data?.count ?? 0

  // CMD+K handler
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

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
          <Menu className="size-5" />
        </Button>
        <div>
          <p className="text-sm font-medium text-foreground">{role ? ROLE_LABELS[role] : "Dashboard"}</p>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {/* Command palette trigger */}
        <Button
          variant="outline"
          size="sm"
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

        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="size-7"><AvatarFallback className="text-xs">{initials}</AvatarFallback></Avatar>
              <span className="text-sm hidden md:inline">{user?.name}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{role ? ROLE_LABELS[role] : ""}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = "/notifications"}><Bell className="size-4 mr-2" />Notifications{unreadCount > 0 && <span className="ml-auto text-xs text-muted-foreground">{unreadCount}</span>}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="size-4 mr-2" />Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </header>
  )
}

// ── Command Palette ──
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
