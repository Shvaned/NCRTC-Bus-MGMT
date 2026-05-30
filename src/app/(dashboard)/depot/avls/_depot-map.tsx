"use client"

import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet"
import L from "leaflet"
import { MAP_DEFAULTS, VEHICLE_STATUS_COLORS, VEHICLE_STATUS_LABELS } from "@/modules/avls/constants"
import type { VehicleLiveInfo } from "@/modules/avls/types"

const createIcon = (color: string) => L.divIcon({
  html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.5);transform:translate(-8px,-8px)"></div>`,
  className: "", iconSize: [16, 16], iconAnchor: [8, 8],
})

export default function DepotMap({ center, vehicles }: { center: [number, number]; vehicles: VehicleLiveInfo[] }) {
  return (
    <MapContainer center={center} zoom={12} className="w-full h-full" zoomControl={false}>
      <TileLayer url={MAP_DEFAULTS.tileUrl} attribution={MAP_DEFAULTS.attribution} />
      {vehicles.map((v) => {
        const color = VEHICLE_STATUS_COLORS[v.status] ?? "#6b7280"
        return (
          <Marker key={v.vehicleId} position={[v.latitude, v.longitude]} icon={createIcon(color)}>
            <Tooltip>
              <div className="text-xs">
                <div className="font-medium">{v.registrationNumber}</div>
                <div>{v.speed} km/h · {VEHICLE_STATUS_LABELS[v.status]}</div>
                {v.routeName && <div>{v.routeName}</div>}
              </div>
            </Tooltip>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
