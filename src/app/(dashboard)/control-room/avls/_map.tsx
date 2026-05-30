"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import { MAP_DEFAULTS, VEHICLE_STATUS_COLORS, VEHICLE_STATUS_LABELS } from "@/modules/avls/constants"
import type { VehicleLiveInfo } from "@/modules/avls/types"

const createIcon = (color: string) => L.divIcon({
  html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.5);transform:translate(-8px,-8px)"></div>`,
  className: "", iconSize: [16, 16], iconAnchor: [8, 8],
})

const selectedIcon = (color: string) => L.divIcon({
  html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 8px rgba(0,0,0,0.6);transform:translate(-11px,-11px)"></div>`,
  className: "", iconSize: [22, 22], iconAnchor: [11, 11],
})

function RecenterMap({ vehicles, selectedId }: { vehicles: VehicleLiveInfo[]; selectedId: string | null }) {
  const map = useMap()
  useEffect(() => {
    if (selectedId) {
      const v = vehicles.find((v) => v.vehicleId === selectedId)
      if (v) map.setView([v.latitude, v.longitude], map.getZoom())
    }
  }, [selectedId, vehicles, map])
  return null
}

export default function LiveMap({
  vehicles,
  selectedVehicleId,
  trailPositions,
  onVehicleClick,
}: {
  vehicles: VehicleLiveInfo[]
  selectedVehicleId: string | null
  trailPositions: [number, number][]
  onVehicleClick: (id: string) => void
}) {
  return (
    <MapContainer
      center={MAP_DEFAULTS.center}
      zoom={MAP_DEFAULTS.zoom}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer url={MAP_DEFAULTS.tileUrl} attribution={MAP_DEFAULTS.attribution} />
      <RecenterMap vehicles={vehicles} selectedId={selectedVehicleId} />

      {vehicles.map((v) => {
        const color = VEHICLE_STATUS_COLORS[v.status] ?? "#6b7280"
        const isSelected = v.vehicleId === selectedVehicleId
        return (
          <Marker
            key={v.vehicleId}
            position={[v.latitude, v.longitude]}
            icon={isSelected ? selectedIcon(color) : createIcon(color)}
            eventHandlers={{ click: () => onVehicleClick(v.vehicleId) }}
          >
            <Tooltip>
              <div className="text-xs">
                <div className="font-medium">{v.registrationNumber}</div>
                <div>{v.speed} km/h · {VEHICLE_STATUS_LABELS[v.status]}</div>
              </div>
            </Tooltip>
          </Marker>
        )
      })}

      {trailPositions.length > 1 && (
        <Polyline positions={trailPositions} color="#3b82f6" weight={3} opacity={0.7} />
      )}
    </MapContainer>
  )
}
