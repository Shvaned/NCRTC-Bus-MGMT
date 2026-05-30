"use client"

import { PageHeader } from "@/components/enterprise/page-header"
import { KPICard } from "@/components/enterprise/kpi-card"
import { Bus, Users, Calendar, AlertTriangle } from "lucide-react"
import { EmptyState } from "@/components/enterprise/empty-state"

export default function DepotDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Depot Management"
        description="Depot-level fleet and personnel overview"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Depot Vehicles" value="0" subtitle="Assigned fleet" icon={Bus} />
        <KPICard title="Drivers" value="0" subtitle="Active drivers" icon={Users} />
        <KPICard title="Today's Duties" value="0" subtitle="Scheduled" icon={Calendar} />
        <KPICard title="Incidents" value="0" subtitle="Depot incidents" icon={AlertTriangle} />
      </div>

      <EmptyState
        title="Depot Dashboard Ready"
        description="Fleet management and scheduling will be available in Phase 2."
      />
    </div>
  )
}
