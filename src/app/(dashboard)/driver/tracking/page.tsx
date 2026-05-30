"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/enterprise/page-header"
import { EmptyState } from "@/components/enterprise/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Navigation, Gauge, MapPin, Clock, Bus } from "lucide-react"
import { VEHICLE_STATUS_LABELS, VEHICLE_STATUS_COLORS } from "@/modules/avls/constants"

export default function DriverTrackingPage() {
  const { data: dutyData } = useQuery<{ success: true; data: any }>({
    queryKey: ["today-duty"],
    queryFn: () => fetch("/api/v1/scheduling/duties/today").then((r) => r.json()),
  })

  const duty = dutyData?.data
  const vehicleId = duty?.vehicleId

  const { data: vehicleData, isLoading } = useQuery<{ success: true; data: any }>({
    queryKey: ["avls-vehicle", vehicleId],
    queryFn: () => fetch(`/api/v1/avls/vehicle/${vehicleId}`).then((r) => r.json()),
    enabled: !!vehicleId,
    refetchInterval: 30000,
  })

  const vehicle = vehicleData?.data

  if (!duty) {
    return (
      <div className="max-w-lg mx-auto">
        <EmptyState icon={Bus} title="No Active Duty" description="You don't have an active duty with an assigned vehicle." />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <PageHeader title="Vehicle Tracking" description="Your assigned vehicle status" />

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
      ) : vehicle ? (
        <Card className="border-l-2 border-l-emerald-500">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{vehicle.registrationNumber}</h2>
                <p className="text-sm text-muted-foreground">{vehicle.vehicleType}</p>
              </div>
              <Badge
                variant="outline"
                style={{
                  backgroundColor: VEHICLE_STATUS_COLORS[vehicle.status as keyof typeof VEHICLE_STATUS_COLORS] + "20",
                  color: VEHICLE_STATUS_COLORS[vehicle.status as keyof typeof VEHICLE_STATUS_COLORS],
                  borderColor: VEHICLE_STATUS_COLORS[vehicle.status as keyof typeof VEHICLE_STATUS_COLORS] + "40",
                }}
              >
                {VEHICLE_STATUS_LABELS[vehicle.status as keyof typeof VEHICLE_STATUS_LABELS] ?? vehicle.status}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Gauge className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Speed</p>
                  <p className="font-medium">{vehicle.speed} km/h</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Heading</p>
                  <p className="font-medium">{vehicle.heading}°</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Depot</p>
                  <p className="font-medium">{vehicle.depotName ?? "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Last Update</p>
                  <p className="font-medium">{vehicle.lastPingAt ? new Date(vehicle.lastPingAt).toLocaleTimeString() : "-"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Vehicle data not available</CardContent></Card>
      )}
    </div>
  )
}
