"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FileEdit, Send, CheckCircle, Flag, XCircle } from "lucide-react"
import type { DutyStatusEnum } from "../types"

const config: Record<DutyStatusEnum, { label: string; icon: React.ReactNode; className: string }> = {
  DRAFT: { label: "Draft", icon: <FileEdit className="size-3" />, className: "bg-muted text-muted-foreground border-muted" },
  PUBLISHED: { label: "Published", icon: <Send className="size-3" />, className: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  ACKNOWLEDGED: { label: "Acknowledged", icon: <CheckCircle className="size-3" />, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  COMPLETED: { label: "Completed", icon: <Flag className="size-3" />, className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  MISSED: { label: "Missed", icon: <XCircle className="size-3" />, className: "bg-red-500/15 text-red-400 border-red-500/30" },
}

export function DutyStatusBadge({ status }: { status: string }) {
  const c = config[status as DutyStatusEnum] ?? config.DRAFT
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", c.className)}>
      {c.icon}
      {c.label}
    </Badge>
  )
}
