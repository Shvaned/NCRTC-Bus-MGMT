"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/enterprise/page-header"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/enterprise/error-state"
import { EmptyState } from "@/components/enterprise/empty-state"
import { Separator } from "@/components/ui/separator"
import { Search, Clock } from "lucide-react"
import { format } from "date-fns"

const HistoryMap = dynamic(() => import("./_history-map"), { ssr: false })

export default function AVLSHistoryPage() {
  const [vehicleId, setVehicleId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const { data: vehiclesData } = useQuery<{ success: true; data: any[] }>({
    queryKey: ["avls-vehicles-list"],
    queryFn: () => fetch("/api/v1/avls/live?limit=200").then((r) => r.json()),
  })

  const params = new URLSearchParams()
  if (vehicleId) params.set("vehicleId", vehicleId)
  if (date) params.set("date", date)

  const { data: historyData, isLoading, isError } = useQuery<{ success: true; data: any }>({
    queryKey: ["avls-history", vehicleId, date],
    queryFn: () => fetch(`/api/v1/avls/history?${params}`).then((r) => r.json()),
    enabled: !!vehicleId,
  })

  const vehicles = vehiclesData?.data ?? []
  const history = historyData?.data
  const pings = history?.pings ?? []
  const sessions = history?.sessions ?? []

  const pathPositions: [number, number][] = useMemo(
    () => pings.map((p: any) => [p.latitude, p.longitude] as [number, number]),
    [pings]
  )

  const avgSpeed = pings.length > 0
    ? Math.round(pings.reduce((sum: number, p: any) => sum + (p.speed ?? 0), 0) / pings.length)
    : 0

  return (
    <div className="space-y-4">
      <PageHeader title="GPS History" description="View historical vehicle paths and trip data" />

      <Card>
        <CardContent className="flex items-end gap-4 pt-6 flex-wrap">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <Label>Vehicle</Label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((v: any) => (
                <option key={v.vehicleId} value={v.vehicleId}>
                  {v.registrationNumber} {v.routeName ? `— ${v.routeName}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <input
              type="date"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {!vehicleId ? (
        <EmptyState icon={Search} title="Select a vehicle" description="Choose a vehicle and date to view GPS history" />
      ) : isLoading ? (
        <Skeleton className="h-[500px] w-full rounded-lg" />
      ) : isError ? (
        <ErrorState message="Failed to load history" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border overflow-hidden h-[500px]">
              <HistoryMap pathPositions={pathPositions} />
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="text-sm font-medium">Trip Summary</h3>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Pings</span>
                    <span className="font-medium">{pings.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Speed</span>
                    <span className="font-medium">{avgSpeed} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sessions</span>
                    <span className="font-medium">{sessions.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {sessions.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="font-medium">Trip Session</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Start: {s.startTime ? format(new Date(s.startTime), "p") : "-"}</p>
                    <p>End: {s.endTime ? format(new Date(s.endTime), "p") : "Ongoing"}</p>
                    <p>Status: {s.sessionStatus}</p>
                    <p>Distance: {s.distanceKm ? `${s.distanceKm} km` : "-"}</p>
                    <p>Pings: {s.pingCount}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
