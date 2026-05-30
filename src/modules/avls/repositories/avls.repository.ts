import { db } from "@/lib/db"
import type { VehicleLiveInfo, GpsPingItem, FleetStats } from "../types"

export const avlsRepository = {
  async getLiveVehicles(params: { organizationId: string; depotId?: string; search?: string }) {
    const { organizationId, depotId, search } = params

    const states = await db.vehicleLiveState.findMany({
      include: {
        vehicle: {
          include: {
            depot: { select: { id: true, name: true } },
          },
        },
      },
      where: {
        vehicle: {
          organizationId,
          deletedAt: null,
          ...(depotId ? { depotId } : {}),
          ...(search ? { registrationNumber: { contains: search, mode: "insensitive" } } : {}),
        },
      },
    })

    return states
      .filter((s) => s.vehicle)
      .map((s): VehicleLiveInfo => ({
        vehicleId: s.vehicleId,
        registrationNumber: s.vehicle.registrationNumber,
        vehicleType: s.vehicle.vehicleType,
        depotId: s.vehicle.depotId,
        depotName: s.vehicle.depot?.name ?? null,
        latitude: Number(s.vehicle.currentLatitude ?? 0),
        longitude: Number(s.vehicle.currentLongitude ?? 0),
        speed: Number(s.speed ?? 0),
        heading: Number(s.heading ?? 0),
        status: s.status as VehicleLiveInfo["status"],
        driverId: s.driverId,
        driverName: null,
        routeId: s.routeId,
        routeName: null,
        ignition: s.ignition ?? false,
        lastPingAt: s.lastPingAt?.toISOString() ?? null,
        tripStatus: s.tripStatus,
      }))
  },

  async getVehicleState(vehicleId: string) {
    return db.vehicleLiveState.findUnique({
      where: { vehicleId },
      include: {
        vehicle: {
          include: { depot: { select: { id: true, name: true } } },
        },
      },
    })
  },

  async getVehicleTrail(vehicleId: string, minutes: number): Promise<GpsPingItem[]> {
    const since = new Date(Date.now() - minutes * 60 * 1000)
    const pings = await db.gpsPing.findMany({
      where: { vehicleId, ts: { gte: since } },
      orderBy: { ts: "desc" },
      take: 300,
    })
    return pings.map((p) => ({
      id: p.id,
      vehicleId: p.vehicleId,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      speed: Number(p.speed ?? 0),
      heading: Number(p.heading ?? 0),
      ignition: p.ignition ?? false,
      ts: p.ts.toISOString(),
    }))
  },

  async getVehicleHistory(vehicleId: string, date: string) {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const [pings, sessions] = await Promise.all([
      db.gpsPing.findMany({
        where: { vehicleId, ts: { gte: dayStart, lte: dayEnd } },
        orderBy: { ts: "asc" },
      }),
      db.tripGpsSession.findMany({
        where: {
          vehicleId,
          startTime: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { startTime: "asc" },
      }),
    ])

    const pingItems: GpsPingItem[] = pings.map((p) => ({
      id: p.id,
      vehicleId: p.vehicleId,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      speed: Number(p.speed ?? 0),
      heading: Number(p.heading ?? 0),
      ignition: p.ignition ?? false,
      ts: p.ts.toISOString(),
    }))

    const tripSessions = sessions.map((s) => ({
      id: s.id,
      vehicleId: s.vehicleId,
      routeId: s.routeId,
      routeName: null,
      sessionStatus: s.sessionStatus,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime?.toISOString() ?? null,
      distanceKm: s.distanceKm ? Number(s.distanceKm) : null,
      pingCount: pings.filter((p) =>
        p.ts >= s.startTime && (!s.endTime || p.ts <= s.endTime)
      ).length,
    }))

    return { pings: pingItems, sessions: tripSessions }
  },

  async getFleetStats(organizationId: string, depotId?: string): Promise<FleetStats> {
    const vehicleWhere = {
      organizationId,
      deletedAt: null,
      ...(depotId ? { depotId } : {}),
    }

    const [total, states] = await Promise.all([
      db.vehicle.count({ where: vehicleWhere }),
      db.vehicleLiveState.findMany({
        where: {
          vehicle: vehicleWhere,
        },
        select: { status: true },
      }),
    ])

    const counts: Record<string, number> = { ACTIVE: 0, IDLE: 0, OFFLINE: 0, MAINTENANCE: 0, OFF_ROUTE: 0 }
    for (const s of states) {
      counts[s.status] = (counts[s.status] ?? 0) + 1
    }

    return {
      total,
      active: counts.ACTIVE,
      idle: counts.IDLE,
      offline: total - states.length,
      maintenance: counts.MAINTENANCE,
      offRoute: counts.OFF_ROUTE,
    }
  },

  async getVehiclesForSimulation() {
    // Find vehicles with active duties for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const duties = await db.duty.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        status: { in: ["PUBLISHED", "ACKNOWLEDGED"] },
        deletedAt: null,
        vehicleId: { not: null },
        routeId: { not: null },
      },
      include: {
        route: { include: { routeStops: { include: { stop: true }, orderBy: { sequence: "asc" } } } },
      },
    })

    return duties
      .filter((d) => d.route && d.route.routeStops.length >= 2)
      .map((d) => ({
        dutyId: d.id,
        vehicleId: d.vehicleId!,
        driverId: d.driverId,
        routeId: d.routeId!,
        depotId: d.depotId,
        routeStops: d.route!.routeStops.map((rs) => ({
          latitude: Number(rs.stop.latitude),
          longitude: Number(rs.stop.longitude),
          sequence: rs.sequence,
        })),
      }))
  },

  async insertGpsPing(data: {
    vehicleId: string; latitude: number; longitude: number
    speed: number; heading: number; ignition: boolean
  }) {
    return db.gpsPing.create({ data: { ...data, ts: new Date() } })
  },

  async updateVehicleLiveState(data: {
    vehicleId: string; latitude: number; longitude: number
    speed: number; heading: number; status: string; driverId?: string | null
    routeId?: string | null; ignition: boolean; tripStatus?: string | null
  }) {
    await db.vehicle.update({
      where: { id: data.vehicleId },
      data: {
        currentLatitude: data.latitude,
        currentLongitude: data.longitude,
        lastPingAt: new Date(),
      },
    })

    return db.vehicleLiveState.upsert({
      where: { vehicleId: data.vehicleId },
      create: {
        vehicleId: data.vehicleId,
        status: data.status as any,
        speed: data.speed,
        heading: data.heading,
        ignition: data.ignition,
        driverId: data.driverId ?? null,
        routeId: data.routeId ?? null,
        tripStatus: data.tripStatus ?? null,
        lastPingAt: new Date(),
      },
      update: {
        status: data.status as any,
        speed: data.speed,
        heading: data.heading,
        ignition: data.ignition,
        driverId: data.driverId ?? undefined,
        routeId: data.routeId ?? undefined,
        tripStatus: data.tripStatus ?? undefined,
        lastPingAt: new Date(),
      },
    })
  },
}
