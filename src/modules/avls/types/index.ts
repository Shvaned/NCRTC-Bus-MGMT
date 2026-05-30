export type VehicleLiveStatusEnum = "ACTIVE" | "IDLE" | "OFFLINE" | "MAINTENANCE" | "OFF_ROUTE"

export interface VehicleLiveInfo {
  vehicleId: string
  registrationNumber: string
  vehicleType: string
  depotId: string
  depotName: string | null
  latitude: number
  longitude: number
  speed: number
  heading: number
  status: VehicleLiveStatusEnum
  driverId: string | null
  driverName: string | null
  routeId: string | null
  routeName: string | null
  ignition: boolean
  lastPingAt: string | null
  tripStatus: string | null
}

export interface GpsPingItem {
  id: string
  vehicleId: string
  latitude: number
  longitude: number
  speed: number
  heading: number
  ignition: boolean
  ts: string
}

export interface VehicleTrail {
  vehicleId: string
  registrationNumber: string
  pings: GpsPingItem[]
  latestStatus: VehicleLiveStatusEnum
}

export interface FleetStats {
  total: number
  active: number
  idle: number
  offline: number
  maintenance: number
  offRoute: number
}

export interface TripSessionInfo {
  id: string
  vehicleId: string
  routeId: string | null
  routeName: string | null
  sessionStatus: string
  startTime: string
  endTime: string | null
  distanceKm: number | null
  pingCount: number
}
