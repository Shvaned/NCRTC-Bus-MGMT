"use client"

import { memo, useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import { MAP_DEFAULTS, VEHICLE_STATUS_COLORS, VEHICLE_STATUS_LABELS } from "@/modules/avls/constants"
import { useSidebarStore } from "@/store"
import type { VehicleLiveInfo } from "@/modules/avls/types"

// Icon cache — create once per color, not per render
const iconCache = new Map<string, L.DivIcon>()
const selIconCache = new Map<string, L.DivIcon>()

function getIcon(color: string, selected: boolean): L.DivIcon {
  const cache = selected ? selIconCache : iconCache
  const key = color
  if (!cache.has(key)) {
    cache.set(key, L.divIcon({
      html: `<div style="width:${selected ? 22 : 16}px;height:${selected ? 22 : 16}px;border-radius:50%;background:${color};border:${selected ? 3 : 2}px solid #fff;box-shadow:0 0 ${selected ? 8 : 4}px rgba(0,0,0,0.5);transform:translate(-${selected ? 11 : 8}px,-${selected ? 11 : 8}px)"></div>`,
      className: "",
      iconSize: selected ? [22, 22] : [16, 16],
      iconAnchor: selected ? [11, 11] : [8, 8],
    }))
  }
  return cache.get(key)!
}

// Invalidate map size on sidebar toggle / drawer toggle / window resize
function MapController({ isDrawerOpen }: { isDrawerOpen: boolean }) {
  const map = useMap()
  const isCollapsed = useSidebarStore((s) => s.isCollapsed)

  // Invalidate on mount
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50)
    return () => clearTimeout(t)
  }, [map])

  // Invalidate on sidebar collapse
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 350)
    return () => clearTimeout(t)
  }, [isCollapsed, map])

  // Invalidate on drawer open/close
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50)
    return () => clearTimeout(t)
  }, [isDrawerOpen, map])

  // ResizeObserver for any other layout changes
  useEffect(() => {
    const container = map.getContainer()
    if (!container) return
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(container)
    return () => ro.disconnect()
  }, [map])

  return null
}

// Keep existing RecenterMap logic
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

interface LiveMapProps {
  vehicles: VehicleLiveInfo[]
  selectedVehicleId: string | null
  trailPositions: [number, number][]
  onVehicleClick: (id: string) => void
  isDrawerOpen: boolean
}

const LiveMap = memo(function LiveMap({
  vehicles,
  selectedVehicleId,
  trailPositions,
  onVehicleClick,
  isDrawerOpen,
}: LiveMapProps) {
  // Memoize markers array — re-compute only when vehicles or selection changes
  const markers = useMemo(() =>
    vehicles.map((v) => {
      const color = VEHICLE_STATUS_COLORS[v.status] ?? "#6b7280"
      const selected = v.vehicleId === selectedVehicleId
      return (
        <Marker
          key={v.vehicleId}
          position={[v.latitude, v.longitude]}
          icon={getIcon(color, selected)}
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
    }),
  [vehicles, selectedVehicleId, onVehicleClick])

  return (
    <MapContainer
      center={MAP_DEFAULTS.center}
      zoom={MAP_DEFAULTS.zoom}
      className="w-full h-full"
      zoomControl={false}
      maxZoom={18}
      minZoom={5}
    >
      <TileLayer url={MAP_DEFAULTS.tileUrl} attribution={MAP_DEFAULTS.attribution} />
      <MapController isDrawerOpen={isDrawerOpen} />
      <RecenterMap vehicles={vehicles} selectedId={selectedVehicleId} />
      {markers}
      {trailPositions.length > 1 && (
        <Polyline positions={trailPositions} color="#3b82f6" weight={3} opacity={0.7} />
      )}
    </MapContainer>
  )
}, (prev, next) => {
  // Custom comparator: only re-render if vehicle IDs changed or selection changed
  if (prev.selectedVehicleId !== next.selectedVehicleId) return false
  if (prev.isDrawerOpen !== next.isDrawerOpen) return false
  if (prev.trailPositions.length !== next.trailPositions.length) return false
  if (prev.vehicles.length !== next.vehicles.length) return false
  // Same length and same first/last ID = stable (Leaflet handles position updates internally)
  if (prev.vehicles.length > 0 && next.vehicles.length > 0) {
    if (prev.vehicles[0].vehicleId !== next.vehicles[0].vehicleId) return false
    if (prev.vehicles[prev.vehicles.length - 1].vehicleId !== next.vehicles[next.vehicles.length - 1].vehicleId) return false
  }
  return true
})

export default LiveMap
