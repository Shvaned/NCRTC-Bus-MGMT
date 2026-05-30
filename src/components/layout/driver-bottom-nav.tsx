"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, Megaphone, AlertTriangle, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/driver", icon: Home, label: "Home" },
  { href: "/driver/duty", icon: Calendar, label: "Duty" },
  { href: "/driver/notices", icon: Megaphone, label: "Notices" },
  { href: "/driver/incidents", icon: AlertTriangle, label: "Incidents" },
  { href: "/driver/panic", icon: Shield, label: "Panic" },
]

export function DriverBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card lg:hidden safe-area-inset-bottom">
      <div className="flex justify-around items-center h-14">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/driver" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[60px] h-full px-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
