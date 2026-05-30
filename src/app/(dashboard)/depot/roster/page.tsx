"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/enterprise/page-header"
import { ErrorState } from "@/components/enterprise/error-state"
import { TableSkeleton } from "@/components/enterprise/loading-skeletons"
import { SlidingDrawer } from "@/components/enterprise/sliding-drawer"
import { DutyStatusBadge } from "@/modules/scheduling/components/duty-status-badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Send, User, Bus, MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function getWeekRange() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    weekStart: monday.toISOString().split("T")[0],
    weekEnd: sunday.toISOString().split("T")[0],
  }
}

export default function DepotRosterPage() {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const user = session?.user as unknown as Record<string, unknown>
  const depotId = (user?.depotId as string) ?? ""
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const { weekStart, weekEnd } = getWeekRange()

  const { data, isLoading, isError, refetch } = useQuery<{ success: true; data: any }>({
    queryKey: ["roster", depotId, weekStart],
    queryFn: () => fetch(`/api/v1/scheduling/roster?depotId=${depotId}&weekStart=${weekStart}&weekEnd=${weekEnd}`).then((r) => r.json()),
    enabled: !!depotId,
  })

  // Fetch resources for assignment drawer
  const { data: drivers } = useQuery<{ success: true; data: any[] }>({
    queryKey: ["depot-drivers", depotId],
    queryFn: () => fetch(`/api/v1/scheduling/stops?limit=1`).then(() => ({ success: true, data: [] })),
    enabled: false,
  })
  const { data: vehicles } = useQuery<{ success: true; data: any[] }>({
    queryKey: ["depot-vehicles", depotId],
    queryFn: () => fetch(`/api/v1/scheduling/stops?limit=1`).then(() => ({ success: true, data: [] })),
    enabled: false,
  })
  const { data: routes } = useQuery<{ success: true; data: any[] }>({
    queryKey: ["depot-routes", depotId],
    queryFn: () => fetch(`/api/v1/scheduling/routes?depotId=${depotId}&limit=100`).then((r) => r.json()),
    enabled: !!depotId,
  })

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: (ids: string[]) =>
      fetch("/api/v1/scheduling/duties/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roster"] })
      toast.success("Duties published")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Assign duty mutation
  const assignMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch("/api/v1/scheduling/duties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roster"] })
      setDrawerOpen(false)
      toast.success("Duty assigned")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const roster = data?.data
  const dates = roster?.dates ?? []
  const rosterDrivers = roster?.drivers ?? []

  if (isLoading) return <TableSkeleton rows={7} cols={8} />
  if (isError) return <ErrorState message="Failed to load roster" onRetry={() => refetch()} />

  return (
    <div className="space-y-4">
      <PageHeader title="Weekly Roster" description={roster?.depotName ?? "Depot Schedule"}>
        <Button
          size="sm"
          onClick={() => {
            const draftIds = rosterDrivers.flatMap((d: any) =>
              d.days.filter((day: any) => day.duty?.status === "DRAFT").map((day: any) => day.duty.id)
            )
            if (draftIds.length === 0) { toast.info("No draft duties to publish"); return }
            publishMutation.mutate(draftIds)
          }}
        >
          <Send className="size-4 mr-2" />
          Publish All
        </Button>
      </PageHeader>

      <div className="overflow-auto rounded-lg border border-border">
        <div className="min-w-[800px]">
          <div className="grid" style={{ gridTemplateColumns: `180px repeat(${dates.length}, 1fr)` }}>
            {/* Header */}
            <div className="p-3 border-b border-r border-border bg-muted/50 font-medium text-sm">Driver</div>
            {dates.map((date: string) => {
              const d = new Date(date)
              return (
                <div key={date} className="p-3 border-b border-r border-border bg-muted/50 text-center">
                  <div className="text-xs text-muted-foreground">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}</div>
                  <div className="text-sm font-medium">{d.getDate()}</div>
                </div>
              )
            })}

            {/* Rows */}
            {rosterDrivers.map((drv: any) => (
              <>
                <div key={drv.driverId} className="p-3 border-r border-b border-border text-sm font-medium">
                  {drv.driverName}
                </div>
                {drv.days.map((day: any) => (
                  <button
                    key={`${drv.driverId}-${day.date}`}
                    className={cn(
                      "p-2 border-r border-b border-border text-xs transition-colors hover:bg-accent/50 min-h-[60px]",
                      !day.duty && "hover:bg-accent/30"
                    )}
                    onClick={() => {
                      setSelectedDate(day.date)
                      setSelectedDriverId(drv.driverId)
                      setDrawerOpen(true)
                    }}
                  >
                    {day.duty ? (
                      <div className="text-left space-y-0.5">
                        <div className="font-medium">{day.duty.routeName ?? "Duty"}</div>
                        <div className="text-muted-foreground">{day.duty.vehicleReg ?? "-"}</div>
                        <DutyStatusBadge status={day.duty.status} />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </button>
                ))}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Drawer */}
      <AssignmentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        date={selectedDate}
        driverId={selectedDriverId}
        depotId={depotId}
        routes={routes?.data ?? []}
        onSubmit={(body) => assignMutation.mutate(body)}
        submitting={assignMutation.isPending}
      />
    </div>
  )
}

function AssignmentDrawer({
  open, onOpenChange, date, driverId, depotId, routes, onSubmit, submitting,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  date: string | null; driverId: string | null; depotId: string
  routes: any[]; onSubmit: (body: Record<string, unknown>) => void; submitting: boolean
}) {
  const [vehicleId, setVehicleId] = useState("")
  const [routeId, setRouteId] = useState("")
  const [startTime, setStartTime] = useState("06:00")
  const [endTime, setEndTime] = useState("14:00")
  const [conductorId, setConductorId] = useState("")

  function handleSubmit() {
    if (!date || !driverId) return
    onSubmit({
      date,
      driverId,
      depotId,
      vehicleId: vehicleId || "placeholder",
      routeId: routeId || routes[0]?.id || "placeholder",
      startTime: `${date}T${startTime}:00.000Z`,
      endTime: `${date}T${endTime}:00.000Z`,
      conductorId: conductorId || null,
    })
  }

  return (
    <SlidingDrawer open={open} onOpenChange={onOpenChange} title="Assign Duty">
      <div className="space-y-4 px-1">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2 text-sm">
              <User className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Driver:</span>
              <span className="font-medium">{driverId ?? "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{date ?? "-"}</span>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Route</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
              >
                <option value="">Select route...</option>
                {routes.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Input
                placeholder="Vehicle ID"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Assign Duty
            </Button>
          </CardContent>
        </Card>
      </div>
    </SlidingDrawer>
  )
}
