"use client"

import { PageHeader } from "@/components/enterprise/page-header"
import { EmptyState } from "@/components/enterprise/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, Activity, Gauge, Bus } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Operational reports and analytics" />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Fleet Utilization", desc: "Vehicle usage metrics", icon: Bus },
          { title: "Driver Performance", desc: "Duty completion rates", icon: Activity },
          { title: "Incident Summary", desc: "By severity and type", icon: Gauge },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-6 text-center">
              <div className="rounded-full bg-muted p-3 mx-auto w-fit mb-3">
                <item.icon className="size-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <EmptyState
        icon={BarChart3}
        title="Reporting Dashboard"
        description="Comprehensive reports and analytics will be available here."
      />
    </div>
  )
}
