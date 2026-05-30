"use client"

import { Badge } from "@/components/ui/badge"
import { Users, Building2, UserCog } from "lucide-react"
import type { NoticeAudience } from "../types"

const config: Record<string, { label: string; icon: React.ReactNode }> = {
  ALL_DRIVERS: { label: "All Drivers", icon: <Users className="size-3" /> },
  DEPOT: { label: "Depot Specific", icon: <Building2 className="size-3" /> },
  ROLE: { label: "Role Specific", icon: <UserCog className="size-3" /> },
}

export function AudienceBadge({ audience }: { audience: NoticeAudience | null }) {
  if (!audience) {
    return (
      <Badge variant="outline" className="gap-1">
        <Users className="size-3" />
        Everyone
      </Badge>
    )
  }

  const c = config[audience.type] ?? { label: audience.type, icon: null }
  return (
    <Badge variant="outline" className="gap-1">
      {c.icon}
      {c.label}
    </Badge>
  )
}
