export type DutyStatusEnum = "DRAFT" | "PUBLISHED" | "ACKNOWLEDGED" | "COMPLETED" | "MISSED"
export type RouteStatusEnum = "ACTIVE" | "INACTIVE" | "ARCHIVED"

export interface StopItem {
  id: string
  name: string
  code: string | null
  address: string | null
  latitude: number
  longitude: number
}

export interface RouteStopItem extends StopItem {
  sequence: number
  arrivalMin: number | null
}

export interface RouteListItem {
  id: string
  name: string
  code: string
  origin: string | null
  destination: string | null
  depotId: string | null
  depotName: string | null
  stopCount: number
  status: RouteStatusEnum
  distanceKm: string | null
  estimatedTimeMin: number | null
}

export interface RouteDetail extends RouteListItem {
  stops: RouteStopItem[]
  createdAt: string
  updatedAt: string
}

export interface DutyListItem {
  id: string
  date: string
  driverId: string | null
  driverName: string | null
  conductorId: string | null
  conductorName: string | null
  vehicleId: string | null
  vehicleReg: string | null
  routeId: string | null
  routeName: string | null
  depotId: string
  depotName: string | null
  startTime: string | null
  endTime: string | null
  status: DutyStatusEnum
  publishedAt: string | null
  ackAt: string | null
}

export interface RosterDay {
  date: string
  dayLabel: string
  duty: DutyListItem | null
}

export interface RosterDriver {
  driverId: string
  driverName: string
  days: RosterDay[]
}

export interface WeeklyRoster {
  weekStart: string
  weekEnd: string
  dates: string[]
  depotName: string
  drivers: RosterDriver[]
}
