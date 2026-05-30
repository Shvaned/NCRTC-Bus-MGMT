"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  variant?: "default" | "success" | "warning" | "danger" | "info"
  className?: string
}

const variantMap: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  inactive: "bg-muted text-muted-foreground border-muted",
  maintenance: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  decommissioned: "bg-red-500/15 text-red-400 border-red-500/30",
  open: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  closed: "bg-muted text-muted-foreground border-muted",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  planned: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  medium: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  low: "bg-muted text-muted-foreground border-muted",
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const colorClass = variantMap[status] ?? variantMap.default

  return (
    <Badge variant="outline" className={cn("capitalize font-medium", colorClass, className)}>
      {status.replace(/_/g, " ")}
    </Badge>
  )
}
