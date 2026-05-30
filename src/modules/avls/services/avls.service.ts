import { avlsRepository } from "../repositories/avls.repository"
import { db } from "@/lib/db"
import { logAuditEvent } from "@/lib/audit"
import type { VehicleLiveInfo, VehicleTrail, FleetStats } from "../types"

export const avlsService = {
  async getLiveVehicles(params: { organizationId: string; depotId?: string; search?: string }): Promise<VehicleLiveInfo[]> {
    const vehicles = await avlsRepository.getLiveVehicles(params)
    const driverIds = vehicles.map((v) => v.driverId).filter(Boolean) as string[]
    const routeIds = vehicles.map((v) => v.routeId).filter(Boolean) as string[]

    const [drivers, routes] = await Promise.all([
      driverIds.length > 0
        ? db.user.findMany({ where: { id: { in: driverIds } }, select: { id: true, firstName: true, lastName: true } })
        : [],
      routeIds.length > 0
        ? db.route.findMany({ where: { id: { in: routeIds } }, select: { id: true, name: true } })
        : [],
    ])

    const driverMap = new Map(drivers.map((d) => [d.id, `${d.firstName} ${d.lastName}`]))
    const routeMap = new Map(routes.map((r) => [r.id, r.name]))

    return vehicles.map((v) => ({
      ...v,
      driverName: v.driverId ? driverMap.get(v.driverId) ?? null : null,
      routeName: v.routeId ? routeMap.get(v.routeId) ?? null : null,
    }))
  },

  async getVehicleDetail(vehicleId: string): Promise<VehicleLiveInfo | null> {
    const state = await avlsRepository.getVehicleState(vehicleId)
    if (!state?.vehicle) return null

    const [drivers, routes] = await Promise.all([
      state.driverId
        ? db.user.findMany({ where: { id: { in: [state.driverId] } }, select: { id: true, firstName: true, lastName: true } })
        : [],
      state.routeId
        ? db.route.findMany({ where: { id: { in: [state.routeId] } }, select: { id: true, name: true } })
        : [],
    ])

    const driver = drivers[0]
    const route = routes[0]

    return {
      vehicleId: state.vehicleId,
      registrationNumber: state.vehicle.registrationNumber,
      vehicleType: state.vehicle.vehicleType,
      depotId: state.vehicle.depotId,
      depotName: state.vehicle.depot?.name ?? null,
      latitude: Number(state.vehicle.currentLatitude ?? 0),
      longitude: Number(state.vehicle.currentLongitude ?? 0),
      speed: Number(state.speed ?? 0),
      heading: Number(state.heading ?? 0),
      status: state.status as VehicleLiveInfo["status"],
      driverId: state.driverId,
      driverName: driver ? `${driver.firstName} ${driver.lastName}` : null,
      routeId: state.routeId,
      routeName: route?.name ?? null,
      ignition: state.ignition ?? false,
      lastPingAt: state.lastPingAt?.toISOString() ?? null,
      tripStatus: state.tripStatus,
    }
  },

  async getVehicleTrail(vehicleId: string, userId: string): Promise<VehicleTrail | null> {
    const state = await avlsRepository.getVehicleState(vehicleId)
    if (!state?.vehicle) return null
    const pings = await avlsRepository.getVehicleTrail(vehicleId, 30)
    await logAuditEvent({ userId, action: "view", entity: "vehicle_trail", entityId: vehicleId })
    return { vehicleId, registrationNumber: state.vehicle.registrationNumber, pings, latestStatus: state.status as VehicleTrail["latestStatus"] }
  },

  async getVehicleHistory(vehicleId: string, date: string, userId: string) {
    await logAuditEvent({ userId, action: "view", entity: "vehicle_history", entityId: vehicleId, details: { date } })
    return avlsRepository.getVehicleHistory(vehicleId, date)
  },

  async getFleetStats(organizationId: string, depotId?: string): Promise<FleetStats> {
    return avlsRepository.getFleetStats(organizationId, depotId)
  },

  async runSimulationTick(): Promise<{ updated: number }> {
    const vehicleDuties = await avlsRepository.getVehiclesForSimulation()
    let updated = 0
    for (const vd of vehicleDuties) {
      try {
        const result = this.simulateVehicleMovement(vd)
        if (result) {
          await avlsRepository.insertGpsPing({ vehicleId: vd.vehicleId, latitude: result.latitude, longitude: result.longitude, speed: result.speed, heading: result.heading, ignition: true })
          await avlsRepository.updateVehicleLiveState({ vehicleId: vd.vehicleId, latitude: result.latitude, longitude: result.longitude, speed: result.speed, heading: result.heading, status: "ACTIVE", driverId: vd.driverId, routeId: vd.routeId, ignition: true, tripStatus: "IN_PROGRESS" })
          updated++
        }
      } catch { /* skip failed vehicle */ }
    }
    return { updated }
  },

  simulateVehicleMovement(vd: { vehicleId: string; routeStops: { latitude: number; longitude: number; sequence: number }[] }): { latitude: number; longitude: number; speed: number; heading: number } | null {
    if (vd.routeStops.length < 2) return null
    const now = Date.now()
    const cycleMs = 30 * 60 * 1000
    const progress = (now % cycleMs) / cycleMs
    const totalSegments = vd.routeStops.length - 1
    const rawIndex = progress * totalSegments
    const segmentIndex = Math.floor(rawIndex)
    const segmentFraction = rawIndex - segmentIndex
    const clampedIndex = Math.min(segmentIndex, totalSegments - 1)
    const from = vd.routeStops[clampedIndex]
    const to = vd.routeStops[clampedIndex + 1] ?? vd.routeStops[clampedIndex]
    const lat = from.latitude + (to.latitude - from.latitude) * segmentFraction
    const lng = from.longitude + (to.longitude - from.longitude) * segmentFraction
    const jitter = 0.0003
    const finalLat = lat + (Math.random() - 0.5) * jitter
    const finalLng = lng + (Math.random() - 0.5) * jitter
    const distToNearestStop = Math.min(segmentFraction, 1 - segmentFraction)
    const baseSpeed = 25 + Math.random() * 30
    const speed = distToNearestStop < 0.1 ? baseSpeed * 0.3 : distToNearestStop < 0.3 ? baseSpeed * 0.7 : baseSpeed
    const heading = Math.atan2(to.longitude - from.longitude, to.latitude - from.latitude) * (180 / Math.PI)
    return { latitude: finalLat, longitude: finalLng, speed: Math.round(speed), heading: Math.round(heading) }
  },
}
