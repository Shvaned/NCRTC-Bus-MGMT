"use client"

import { useMemo } from "react"
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet"
import L from "leaflet"
import { MAP_DEFAULTS, VEHICLE_STATUS_COLORS, VEHICLE_STATUS_LABELS } from "@/modules/avls/constants"
import type { VehicleLiveInfo } from "@/modules/avls/types"

// Icon cache
const iconCache = new Map<string, L.DivIcon>()
function getIcon(color: string): L.DivIcon {
  if (!iconCache.has(color)) {
    iconCache.set(color, L.divIcon({
      html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.5);transform:translate(-8px,-8px)"></div>`,
      className: "", iconSize: [16, 16], iconAnchor: [8, 8],
    }))
  }
  return iconCache.get(color)!
}

interface LiveMapProps {
  vehicles: VehicleLiveInfo[]
  selectedVehicleId: string | null
  onVehicleClick: (id: string) => void
}

export default function LiveMap({ vehicles, selectedVehicleId, onVehicleClick }: LiveMapProps) {
  const markers = useMemo(() =>
    vehicles.map((v) => (
      <Marker
        key={v.vehicleId}
        position={[v.latitude, v.longitude]}
        icon={getIcon(VEHICLE_STATUS_COLORS[v.status] ?? "#6b7280")}
        eventHandlers={{ click: () => onVehicleClick(v.vehicleId) }}
      >
        <Tooltip>
          <div className="text-xs">
            <div className="font-medium">{v.registrationNumber}</div>
            <div>{v.speed} km/h · {VEHICLE_STATUS_LABELS[v.status]}</div>
          </div>
        </Tooltip>
      </Marker>
    )), [vehicles, selectedVehicleId, onVehicleClick])

  return (
    <MapContainer
      center={MAP_DEFAULTS.center}
      zoom={MAP_DEFAULTS.zoom}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {markers}
    </MapContainer>
  )
}
