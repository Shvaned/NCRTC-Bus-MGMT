"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FileEdit, CheckCircle, Archive } from "lucide-react"

const variants: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground border-muted",
  PUBLISHED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  ARCHIVED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
}

const labels: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
}

const icons: Record<string, React.ReactNode> = {
  DRAFT: <FileEdit className="size-3" />,
  PUBLISHED: <CheckCircle className="size-3" />,
  ARCHIVED: <Archive className="size-3" />,
}

export function NoticeStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium capitalize", variants[status] ?? variants.DRAFT)}>
      {icons[status]}
      {labels[status] ?? status}
    </Badge>
  )
}
