"use client"

import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet"
import L from "leaflet"
import { MAP_DEFAULTS } from "@/modules/avls/constants"

export default function HistoryMap({ pathPositions }: { pathPositions: [number, number][] }) {
  if (pathPositions.length < 2) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
        No GPS data for this date
      </div>
    )
  }

  const lats = pathPositions.map((p) => p[0])
  const lngs = pathPositions.map((p) => p[1])
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
    [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01],
  ]

  return (
    <MapContainer bounds={bounds} className="w-full h-full" zoomControl={false}>
      <TileLayer url={MAP_DEFAULTS.tileUrl} attribution={MAP_DEFAULTS.attribution} />
      <Polyline positions={pathPositions} color="#3b82f6" weight={4} opacity={0.8} />
      <Marker position={pathPositions[0]} icon={L.divIcon({
        html: '<div style="width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid #fff"></div>',
        className: "", iconSize: [12, 12], iconAnchor: [6, 6],
      })} />
      <Marker position={pathPositions[pathPositions.length - 1]} icon={L.divIcon({
        html: '<div style="width:12px;height:12px;border-radius:50%;background:#ef4444;border:2px solid #fff"></div>',
        className: "", iconSize: [12, 12], iconAnchor: [6, 6],
      })} />
    </MapContainer>
  )
}
