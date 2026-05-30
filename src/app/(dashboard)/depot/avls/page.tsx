"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/enterprise/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MAP_DEFAULTS, POLL_INTERVAL } from "@/modules/avls/constants"
import type { VehicleLiveInfo } from "@/modules/avls/types"

const DepotMap = dynamic(() => import("./_depot-map"), { ssr: false })

export default function DepotAVLSPage() {
  const { data: session } = useSession()
  const user = session?.user as unknown as Record<string, unknown>
  const depotId = (user?.depotId as string) ?? ""

  const params = new URLSearchParams({ depotId })

  const { data: liveData, isLoading } = useQuery<{ success: true; data: VehicleLiveInfo[] }>({
    queryKey: ["avls-live", depotId],
    queryFn: () => fetch(`/api/v1/avls/live?${params}`).then((r) => r.json()),
    refetchInterval: POLL_INTERVAL,
    enabled: !!depotId,
  })

  const vehicles = liveData?.data ?? []
  const activeCount = vehicles.filter((v) => v.status === "ACTIVE").length

  const center = useMemo(() => {
    if (vehicles.length === 0) return MAP_DEFAULTS.center
    const avgLat = vehicles.reduce((s, v) => s + v.latitude, 0) / vehicles.length
    const avgLng = vehicles.reduce((s, v) => s + v.longitude, 0) / vehicles.length
    return [avgLat, avgLng] as [number, number]
  }, [vehicles])

  return (
    <div className="space-y-4">
      <PageHeader title="Depot Fleet Tracking" description={`${vehicles.length} vehicles · ${activeCount} active`} />

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{vehicles.length}</div><div className="text-xs text-muted-foreground">Total</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-emerald-400">{activeCount}</div><div className="text-xs text-muted-foreground">Active</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{vehicles.filter((v) => v.status === "IDLE").length}</div><div className="text-xs text-muted-foreground">Idle</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{vehicles.filter((v) => v.status === "OFFLINE").length}</div><div className="text-xs text-muted-foreground">Offline</div></CardContent></Card>
      </div>

      <div className="rounded-lg border border-border overflow-hidden h-[500px]">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <DepotMap center={center} vehicles={vehicles} />
        )}
      </div>
    </div>
  )
}
