"use client"

import { PageHeader } from "@/components/enterprise/page-header"
import { EmptyState } from "@/components/enterprise/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Settings, User } from "lucide-react"
import { useSession } from "next-auth/react"
import { ROLE_LABELS } from "@/lib/constants/roles"
import type { SystemRole } from "@/types"

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user
  const role = (user as Record<string, unknown>)?.role as SystemRole

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Settings" description="Account and application preferences" />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-muted p-3 shrink-0">
              <User className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{user?.name ?? "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? ""}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {role ? ROLE_LABELS[role] : "Unknown"} Role
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <EmptyState
        icon={Settings}
        title="Settings"
        description="Additional configuration options will be available in a future update."
      />
    </div>
  )
}
