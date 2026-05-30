"use client"

import { PageHeader } from "@/components/enterprise/page-header"
import { KPICard } from "@/components/enterprise/kpi-card"
import { Bus, AlertTriangle, Radio, MapPin } from "lucide-react"
import { EmptyState } from "@/components/enterprise/empty-state"

export default function ControlRoomDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Control Room"
        description="Real-time operations overview"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Vehicles On Road" value="0" subtitle="Currently active" icon={Bus} />
        <KPICard title="Active Incidents" value="0" subtitle="Open incidents" icon={AlertTriangle} />
        <KPICard title="Live GPS Signals" value="0" subtitle="Signals/minute" icon={Radio} />
        <KPICard title="Active Routes" value="0" subtitle="In operation" icon={MapPin} />
      </div>

      <EmptyState
        title="Control Room Ready"
        description="AVLS and real-time monitoring will be available in Phase 2."
      />
    </div>
  )
}
