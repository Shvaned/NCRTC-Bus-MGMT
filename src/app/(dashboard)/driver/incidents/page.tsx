"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/enterprise/page-header"
import { EmptyState } from "@/components/enterprise/empty-state"
import { ErrorState } from "@/components/enterprise/error-state"
import { TableSkeleton } from "@/components/enterprise/loading-skeletons"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Shield, ChevronRight } from "lucide-react"
import { SEVERITY_LABELS, SEVERITY_COLORS, STATUS_LABELS, STATUS_COLORS, INCIDENT_TYPE_LABELS } from "@/modules/ims/constants"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"

export default function DriverIncidentsPage() {
  const { data: session } = useSession()
  const user = session?.user as unknown as Record<string, unknown>
  const userId = (user?.id as string) ?? ""

  const sp = new URLSearchParams({ mine: userId, limit: "50" })
  const { data, isLoading, isError, refetch } = useQuery<{ success: true; data: any[] }>({
    queryKey: ["my-incidents", userId],
    queryFn: () => fetch(`/api/v1/ims/incidents?${sp}`).then((r) => r.json()),
    enabled: !!userId,
  })

  const incidents = data?.data ?? []

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <PageHeader title="My Incidents" description="Your reported incidents">
        <Link href="/driver/incidents/new">
          <Button size="sm"><Plus className="size-4 mr-2" />Report</Button>
        </Link>
        <Link href="/driver/panic" className="ml-2">
          <Button size="sm" variant="destructive"><Shield className="size-4 mr-2" />Panic</Button>
        </Link>
      </PageHeader>

      {isLoading ? <TableSkeleton rows={4} cols={3} /> :
       isError ? <ErrorState message="Failed to load incidents" onRetry={() => refetch()} /> :
       !incidents.length ? <EmptyState icon={Shield} title="No incidents" description="You haven't reported any incidents yet" /> : (
        <div className="space-y-2">
          {incidents.map((inc: any) => (
            <Card key={inc.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("font-bold text-xs", SEVERITY_COLORS[inc.severity as keyof typeof SEVERITY_COLORS])}>{inc.severity}</Badge>
                      <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[inc.status as keyof typeof STATUS_COLORS])}>{STATUS_LABELS[inc.status as keyof typeof STATUS_LABELS] ?? inc.status}</Badge>
                      <span className="text-xs text-muted-foreground">{INCIDENT_TYPE_LABELS[inc.type as keyof typeof INCIDENT_TYPE_LABELS] ?? inc.type}</span>
                    </div>
                    <h3 className="text-sm font-medium mt-1">{inc.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
