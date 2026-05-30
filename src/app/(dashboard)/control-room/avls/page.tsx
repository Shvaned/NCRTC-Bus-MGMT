"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/enterprise/page-header"
import { SlidingDrawer } from "@/components/enterprise/sliding-drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Search, Navigation, Gauge, Clock, MapPin, User, Bus } from "lucide-react"
import { cn } from "@/lib/utils"
import { VEHICLE_STATUS_COLORS, VEHICLE_STATUS_LABELS, MAP_DEFAULTS, POLL_INTERVAL } from "@/modules/avls/constants"
import type { VehicleLiveInfo, VehicleTrail } from "@/modules/avls/types"

// Dynamically import Leaflet map to avoid SSR window error
const LiveMap = dynamic(() => import("./_map"), { ssr: false })

function FleetKPIs({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {[
        { label: "Total", value: stats.total, color: "bg-muted-foreground" },
        { label: "Active", value: stats.active, color: "bg-emerald-500" },
        { label: "Idle", value: stats.idle, color: "bg-gray-400" },
        { label: "Offline", value: stats.offline, color: "bg-gray-700" },
        { label: "Off Route", value: stats.offRoute, color: "bg-amber-500" },
      ].map((kpi) => (
        <div key={kpi.label} className="text-center p-2 rounded-lg bg-card border border-border">
          <div className={cn("w-2 h-2 rounded-full mx-auto mb-1", kpi.color)} />
          <div className="text-lg font-bold tabular-nums">{kpi.value}</div>
          <div className="text-[10px] text-muted-foreground">{kpi.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function ControlRoomAVLSPage() {
  const { data: session } = useSession()
  const user = session?.user as unknown as Record<string, unknown>

  const [depotFilter, setDepotFilter] = useState("")
  const [search, setSearch] = useState("")
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const params = new URLSearchParams()
  if (depotFilter) params.set("depotId", depotFilter)
  if (search) params.set("search", search)

  const { data: liveData, isLoading: liveLoading } = useQuery<{ success: true; data: VehicleLiveInfo[] }>({
    queryKey: ["avls-live", depotFilter, search],
    queryFn: () => fetch(`/api/v1/avls/live?${params}`).then((r) => r.json()),
    refetchInterval: POLL_INTERVAL,
  })

  const { data: statsData } = useQuery<{ success: true; data: any }>({
    queryKey: ["avls-stats", depotFilter],
    queryFn: () => fetch(`/api/v1/avls/stats?${params}`).then((r) => r.json()),
    refetchInterval: POLL_INTERVAL,
  })

  const { data: trailData } = useQuery<{ success: true; data: VehicleTrail }>({
    queryKey: ["avls-trail", selectedVehicleId],
    queryFn: () => fetch(`/api/v1/avls/vehicle/${selectedVehicleId}/trail`).then((r) => r.json()),
    enabled: !!selectedVehicleId,
    refetchInterval: POLL_INTERVAL,
  })

  const vehicles = liveData?.data ?? []
  const stats = statsData?.data ?? { total: 0, active: 0, idle: 0, offline: 0, maintenance: 0, offRoute: 0 }
  const selectedVehicle = vehicles.find((v) => v.vehicleId === selectedVehicleId)
  const trail = trailData?.data

  const depots = useMemo(() => {
    const seen = new Map<string, string>()
    vehicles.forEach((v) => { if (v.depotId && v.depotName) seen.set(v.depotId, v.depotName) })
    return Array.from(seen.entries())
  }, [vehicles])

  const trailPositions: [number, number][] = useMemo(() =>
    trail?.pings?.map((p) => [p.latitude, p.longitude] as [number, number]) ?? []
  , [trail])

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-4 md:-m-6">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Navigation className="size-5 text-emerald-400" />
          <span className="font-semibold text-sm">Live Fleet Tracking</span>
          <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-400">LIVE</Badge>
        </div>
        <div className="flex-1" />
        <select
          value={depotFilter}
          onChange={(e) => setDepotFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs"
        >
          <option value="">All Depots</option>
          {depots.map(([id, name]) => (<option key={id} value={id}>{name}</option>))}
        </select>
        <div className="relative w-48">
          <Search className="absolute left-2 top-1.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search vehicle..."
            className="pl-7 h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="px-4 py-2 border-b border-border bg-card/50 shrink-0">
        <FleetKPIs stats={stats} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map — 70% */}
        <div className="flex-1 relative bg-muted">
          {liveLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : (
            <LiveMap
              vehicles={vehicles}
              selectedVehicleId={selectedVehicleId}
              trailPositions={trailPositions}
              onVehicleClick={(id: string) => { setSelectedVehicleId(id); setDrawerOpen(true) }}
            />
          )}
        </div>

        {/* Side Panel — 30% */}
        <div className="w-80 border-l border-border bg-card overflow-auto shrink-0 hidden lg:block">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-medium">Vehicles ({vehicles.length})</h3>
          </div>
          <div className="divide-y divide-border">
            {vehicles.map((v) => (
              <button
                key={v.vehicleId}
                className={cn(
                  "w-full text-left p-3 hover:bg-accent/50 transition-colors",
                  selectedVehicleId === v.vehicleId && "bg-accent"
                )}
                onClick={() => { setSelectedVehicleId(v.vehicleId); setDrawerOpen(true) }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{v.registrationNumber}</span>
                  <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: VEHICLE_STATUS_COLORS[v.status] }} />
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Gauge className="size-3" /><span>{v.speed} km/h</span>
                  <span>·</span><span>{VEHICLE_STATUS_LABELS[v.status]}</span>
                </div>
                {v.routeName && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    <MapPin className="size-3 inline mr-1" />{v.routeName}
                  </div>
                )}
              </button>
            ))}
            {vehicles.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">No vehicles found</div>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Detail Drawer */}
      <SlidingDrawer
        open={drawerOpen}
        onOpenChange={(o) => { setDrawerOpen(o); if (!o) setSelectedVehicleId(null) }}
        title="Vehicle Details"
      >
        {selectedVehicle ? (
          <div className="space-y-4 px-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedVehicle.registrationNumber}</h2>
                <p className="text-sm text-muted-foreground">{selectedVehicle.vehicleType}</p>
              </div>
              <Badge variant="outline" style={{
                backgroundColor: VEHICLE_STATUS_COLORS[selectedVehicle.status] + "20",
                color: VEHICLE_STATUS_COLORS[selectedVehicle.status],
                borderColor: VEHICLE_STATUS_COLORS[selectedVehicle.status] + "40",
              }}>
                {VEHICLE_STATUS_LABELS[selectedVehicle.status]}
              </Badge>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Gauge, label: "Speed", value: `${selectedVehicle.speed} km/h` },
                { icon: Navigation, label: "Heading", value: `${selectedVehicle.heading}°` },
                { icon: MapPin, label: "Depot", value: selectedVehicle.depotName ?? "-" },
                { icon: User, label: "Driver", value: selectedVehicle.driverName ?? "-" },
                { icon: Bus, label: "Route", value: selectedVehicle.routeName ?? "Not assigned", span: 2 },
                { icon: Clock, label: "Last Update", value: selectedVehicle.lastPingAt ? new Date(selectedVehicle.lastPingAt).toLocaleTimeString() : "-", span: 2 },
              ].map((item, i) => (
                <div key={i} className={cn("flex items-center gap-2 text-sm", item.span === 2 && "col-span-2")}>
                  <item.icon className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            {trailPositions.length > 1 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-1">Last 30 Min Trail</h4>
                  <p className="text-xs text-muted-foreground">{trailPositions.length} GPS points</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">Select a vehicle to view details</div>
        )}
      </SlidingDrawer>
    </div>
  )
}
