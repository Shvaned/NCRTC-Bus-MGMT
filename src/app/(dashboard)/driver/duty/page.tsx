"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PageHeader } from "@/components/enterprise/page-header"
import { ErrorState } from "@/components/enterprise/error-state"
import { EmptyState } from "@/components/enterprise/empty-state"
import { DutyStatusBadge } from "@/modules/scheduling/components/duty-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, Bus, MapPin, User, CheckCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

export default function DriverDutyPage() {
  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery<{ success: true; data: any }>({
    queryKey: ["today-duty"],
    queryFn: () => fetch("/api/v1/scheduling/duties/today").then((r) => r.json()),
  })

  const ackMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/v1/scheduling/duties/${id}/acknowledge`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["today-duty"] })
      toast.success("Duty acknowledged")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const duty = data?.data

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError) {
    return <ErrorState message="Failed to load duty" onRetry={() => refetch()} />
  }

  if (!duty) {
    return (
      <div className="max-w-lg mx-auto">
        <EmptyState
          icon={Calendar}
          title="No Duty Today"
          description="You don't have any duties assigned for today. Check back later or contact your depot manager."
        />
      </div>
    )
  }

  const startTime = duty.startTime ? format(new Date(duty.startTime), "h:mm a") : "-"
  const endTime = duty.endTime ? format(new Date(duty.endTime), "h:mm a") : "-"
  const dateStr = duty.date ? format(new Date(duty.date), "EEEE, MMMM d, yyyy") : "-"

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <PageHeader title="Today's Duty" description={dateStr} />

      <Card className="border-l-2 border-l-blue-500">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">{duty.route?.name ?? "Duty"}</h2>
              {duty.route?.code && (
                <p className="text-sm text-muted-foreground font-mono">{duty.route.code}</p>
              )}
            </div>
            <DutyStatusBadge status={duty.status} />
          </div>

          <Separator />

          <div className="grid gap-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/15 shrink-0">
                <Clock className="size-4 text-blue-400" />
              </div>
              <div>
                <p className="text-muted-foreground">Shift Time</p>
                <p className="font-medium">{startTime} — {endTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/15 shrink-0">
                <Bus className="size-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-muted-foreground">Vehicle</p>
                <p className="font-medium">{duty.vehicleId ?? "Not assigned"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/15 shrink-0">
                <MapPin className="size-4 text-purple-400" />
              </div>
              <div>
                <p className="text-muted-foreground">Depot</p>
                <p className="font-medium">{duty.depot?.name ?? "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/15 shrink-0">
                <User className="size-4 text-amber-400" />
              </div>
              <div>
                <p className="text-muted-foreground">Conductor</p>
                <p className="font-medium">{duty.conductorName ?? "Not assigned"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {duty.status === "PUBLISHED" && (
            <Button
              className="w-full h-12 text-base"
              onClick={() => ackMutation.mutate(duty.id)}
              disabled={ackMutation.isPending}
            >
              {ackMutation.isPending ? (
                <Loader2 className="size-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="size-5 mr-2" />
              )}
              Acknowledge Duty
            </Button>
          )}

          {duty.status === "ACKNOWLEDGED" && (
            <div className="flex items-center justify-center gap-2 py-2 text-emerald-400">
              <CheckCircle className="size-5" />
              <span className="text-sm font-medium">Duty Acknowledged</span>
              {duty.ackAt && (
                <span className="text-xs text-muted-foreground">
                  at {format(new Date(duty.ackAt), "h:mm a")}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
