"use client"

import { PageHeader } from "@/components/enterprise/page-header"
import { KPICard } from "@/components/enterprise/kpi-card"
import { Bus, Users, AlertTriangle, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/enterprise/empty-state"
import { useSession } from "next-auth/react"
import { ROLE_LABELS } from "@/lib/constants/roles"
import type { SystemRole } from "@/types"

export default function AdminDashboard() {
  const { data: session } = useSession()
  const role = (session?.user as Record<string, unknown>)?.role as SystemRole

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${role ? ROLE_LABELS[role] : ""} Dashboard`}
        description="System overview and key metrics"
      >
        <Button variant="outline" size="sm">Export Report</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Vehicles"
          value="0"
          subtitle="Active fleet size"
          icon={Bus}
        />
        <KPICard
          title="Active Users"
          value="0"
          subtitle="Currently online"
          icon={Users}
        />
        <KPICard
          title="Active Incidents"
          value="0"
          subtitle="Requiring attention"
          icon={AlertTriangle}
        />
        <KPICard
          title="Routes"
          value="0"
          subtitle="Active routes"
          icon={MapPin}
        />
      </div>

      <EmptyState
        title="Welcome to NCRTC BMS"
        description="The system foundation is ready. Business modules will be implemented in upcoming phases."
      />
    </div>
  )
}
