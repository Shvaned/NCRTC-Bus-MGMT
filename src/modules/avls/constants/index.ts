import type { VehicleLiveStatusEnum } from "../types"

export const VEHICLE_STATUS_LABELS: Record<VehicleLiveStatusEnum, string> = {
  ACTIVE: "Active",
  IDLE: "Idle",
  OFFLINE: "Offline",
  MAINTENANCE: "Maintenance",
  OFF_ROUTE: "Off Route",
}

export const VEHICLE_STATUS_COLORS: Record<VehicleLiveStatusEnum, string> = {
  ACTIVE: "#22c55e",
  IDLE: "#6b7280",
  OFFLINE: "#374151",
  MAINTENANCE: "#f59e0b",
  OFF_ROUTE: "#f97316",
}

export const MAP_DEFAULTS = {
  center: [28.65, 77.23] as [number, number],
  zoom: 11,
  tileUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
}

export const POLL_INTERVAL = 5000
export const TRAIL_MINUTES = 30
