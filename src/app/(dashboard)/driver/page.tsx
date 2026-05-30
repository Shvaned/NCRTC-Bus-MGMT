"use client"

import Link from "next/link"
import { useUnreadCount } from "@/modules/cms/hooks/use-notices"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/enterprise/page-header"
import { KPICard } from "@/components/enterprise/kpi-card"
import { EmptyState } from "@/components/enterprise/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { DutyStatusBadge } from "@/modules/scheduling/components/duty-status-badge"
import { Bus, Calendar, FileText, Bell, Megaphone, ChevronRight, Clock } from "lucide-react"
import { format } from "date-fns"

export default function DriverDashboard() {
  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.data?.count ?? 0

  const { data: dutyData } = useQuery<{ success: true; data: any }>({
    queryKey: ["today-duty"],
    queryFn: () => fetch("/api/v1/scheduling/duties/today").then((r) => r.json()),
  })

  const duty = dutyData?.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver Dashboard"
        description="Your daily schedule and updates"
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Today's Duty"
          value={duty ? duty.route?.name ?? "Assigned" : "None"}
          subtitle={duty ? duty.status : "No duty today"}
          icon={Calendar}
        />
        <KPICard title="Assigned Vehicle" value={duty?.vehicleId ?? "-"} subtitle="Vehicle info" icon={Bus} />
        <KPICard title="Notices" value={String(unreadCount)} subtitle="Unread notices" icon={FileText} />
        <KPICard title="Alerts" value="0" subtitle="New alerts" icon={Bell} />
      </div>

      {/* Today's Duty Widget */}
      {duty ? (
        <Link href="/driver/duty">
          <Card className="border-l-2 border-l-blue-500 hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/15">
                    <Clock className="size-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{duty.route?.name ?? "Today's Duty"}</p>
                      <DutyStatusBadge status={duty.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {duty.startTime ? format(new Date(duty.startTime), "h:mm a") : "-"} —{" "}
                      {duty.endTime ? format(new Date(duty.endTime), "h:mm a") : "-"}
                      {" · "}{duty.depot?.name ?? ""}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <Card className="border-l-2 border-l-muted">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Clock className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">No Duty Today</p>
                <p className="text-xs text-muted-foreground">No duties assigned for today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unread Notices Widget */}
      {unreadCount > 0 && (
        <Link href="/driver/notices">
          <Card className="border-l-2 border-l-blue-500 hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/15">
                  <Megaphone className="size-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {unreadCount} unread notice{unreadCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">Tap to view notices</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      <EmptyState
        title="Driver Dashboard Ready"
        description="Duty assignments and schedules are now available."
      />
    </div>
  )
}
