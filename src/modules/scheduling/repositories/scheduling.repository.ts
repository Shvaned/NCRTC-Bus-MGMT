import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"
import type { CreateStopInput, CreateRouteInput, UpdateRouteInput, CreateDutyInput, UpdateDutyInput } from "../validators"
import type { DutyStatusEnum } from "../types"

export const schedulingRepository = {
  // ── Stops ──
  async listStops(params: { organizationId: string; search?: string; page: number; limit: number }) {
    const { organizationId, search, page, limit } = params
    const where: Prisma.StopWhereInput = { organizationId, deletedAt: null }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ]
    }
    const [data, total] = await Promise.all([
      db.stop.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * limit, take: limit }),
      db.stop.count({ where }),
    ])
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },

  async createStop(input: CreateStopInput & { organizationId: string }) {
    return db.stop.create({ data: input })
  },

  async getStopById(id: string) {
    return db.stop.findFirst({ where: { id, deletedAt: null } })
  },

  // ── Routes ──
  async listRoutes(params: {
    organizationId: string; search?: string; status?: string; depotId?: string
    page: number; limit: number
  }) {
    const { organizationId, search, status, depotId, page, limit } = params
    const where: Prisma.RouteWhereInput = { organizationId, deletedAt: null }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ]
    }
    if (status) where.status = status as Prisma.EnumRouteStatusFilter["equals"]
    if (depotId) where.depotId = depotId

    const [data, total] = await Promise.all([
      db.route.findMany({
        where,
        include: { depot: { select: { name: true } }, _count: { select: { routeStops: true } } },
        orderBy: { code: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.route.count({ where }),
    ])

    return {
      data: data.map((r) => ({
        id: r.id, name: r.name, code: r.code,
        origin: r.origin, destination: r.destination,
        depotId: r.depotId, depotName: r.depot?.name ?? null,
        stopCount: r._count.routeStops, status: r.status as string,
        distanceKm: r.distanceKm?.toString() ?? null,
        estimatedTimeMin: r.estimatedTimeMin,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  },

  async getRouteById(id: string) {
    return db.route.findFirst({
      where: { id, deletedAt: null },
      include: {
        depot: { select: { name: true } },
        routeStops: { include: { stop: true }, orderBy: { sequence: "asc" } },
      },
    })
  },

  async createRoute(input: CreateRouteInput & { organizationId: string }) {
    const { stops, ...routeData } = input
    return db.route.create({
      data: {
        ...routeData,
        organizationId: input.organizationId,
        depotId: input.depotId ?? null,
        routeStops: {
          create: stops.map((s) => ({
            stopId: s.stopId,
            sequence: s.sequence,
            arrivalMin: s.arrivalMin ?? null,
          })),
        },
      },
      include: { routeStops: { include: { stop: true }, orderBy: { sequence: "asc" } } },
    })
  },

  async updateRoute(id: string, input: UpdateRouteInput) {
    const { stops, ...routeData } = input
    if (stops) {
      await db.routeStop.deleteMany({ where: { routeId: id } })
      await db.routeStop.createMany({
        data: stops.map((s) => ({
          routeId: id, stopId: s.stopId, sequence: s.sequence,
          arrivalMin: s.arrivalMin ?? null,
        })),
      })
    }
    return db.route.update({
      where: { id },
      data: routeData,
      include: { routeStops: { include: { stop: true }, orderBy: { sequence: "asc" } } },
    })
  },

  async archiveRoute(id: string) {
    return db.route.update({ where: { id }, data: { status: "ARCHIVED", deletedAt: new Date() } })
  },

  // ── Duties ──
  async findConflictingDuties(params: { driverId?: string; vehicleId?: string; date: Date; startTime: Date; endTime: Date; excludeId?: string }) {
    const { driverId, vehicleId, date, startTime, endTime, excludeId } = params
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const where: Prisma.DutyWhereInput = {
      date: { gte: dayStart, lte: dayEnd },
      deletedAt: null,
      status: { notIn: ["MISSED"] },
      OR: [
        { startTime: { lte: endTime }, endTime: { gte: startTime } },
      ],
    }
    if (excludeId) where.id = { not: excludeId }
    if (driverId) where.driverId = driverId
    if (vehicleId) where.vehicleId = vehicleId

    return db.duty.findMany({ where })
  },

  async createDuty(input: CreateDutyInput & { organizationId: string; status?: DutyStatusEnum }) {
    return db.duty.create({
      data: {
        organizationId: input.organizationId,
        depotId: input.depotId,
        driverId: input.driverId,
        conductorId: input.conductorId ?? null,
        vehicleId: input.vehicleId,
        routeId: input.routeId,
        date: new Date(input.date),
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        status: input.status ?? "DRAFT",
        notes: input.notes ?? null,
      },
      include: {
        depot: { select: { name: true } },
        route: { select: { name: true, code: true } },
      },
    })
  },

  async updateDuty(id: string, input: UpdateDutyInput) {
    return db.duty.update({
      where: { id },
      data: {
        ...(input.driverId !== undefined && { driverId: input.driverId }),
        ...(input.conductorId !== undefined && { conductorId: input.conductorId }),
        ...(input.vehicleId !== undefined && { vehicleId: input.vehicleId }),
        ...(input.routeId !== undefined && { routeId: input.routeId }),
        ...(input.startTime !== undefined && { startTime: new Date(input.startTime) }),
        ...(input.endTime !== undefined && { endTime: new Date(input.endTime) }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    })
  },

  async publishDuty(id: string) {
    return db.duty.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    })
  },

  async publishDuties(ids: string[]) {
    return db.duty.updateMany({
      where: { id: { in: ids } },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    })
  },

  async acknowledgeDuty(id: string) {
    return db.duty.update({
      where: { id },
      data: { status: "ACKNOWLEDGED", ackAt: new Date() },
    })
  },

  async getDutyById(id: string) {
    return db.duty.findFirst({
      where: { id, deletedAt: null },
      include: {
        depot: { select: { name: true } },
        route: { select: { name: true, code: true } },
      },
    })
  },

  async getWeeklyRoster(params: { depotId: string; weekStart: Date; weekEnd: Date }) {
    const { depotId, weekStart, weekEnd } = params
    return db.duty.findMany({
      where: {
        depotId,
        date: { gte: weekStart, lte: weekEnd },
        deletedAt: null,
      },
      include: {
        depot: { select: { name: true } },
        route: { select: { name: true, code: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    })
  },

  async getTodayDuty(driverId: string, date: Date) {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    return db.duty.findFirst({
      where: {
        driverId,
        date: { gte: dayStart, lte: dayEnd },
        status: { in: ["PUBLISHED", "ACKNOWLEDGED", "COMPLETED"] },
        deletedAt: null,
      },
      include: {
        depot: { select: { name: true } },
        route: { select: { name: true, code: true } },
      },
    })
  },

  async listDuties(params: {
    organizationId: string; depotId?: string; status?: string; date?: string
    page: number; limit: number
  }) {
    const { organizationId, depotId, status, date, page, limit } = params
    const where: Prisma.DutyWhereInput = { organizationId, deletedAt: null }
    if (depotId) where.depotId = depotId
    if (status) where.status = status as Prisma.EnumDutyStatusFilter["equals"]
    if (date) {
      const d = new Date(date)
      const dEnd = new Date(date)
      dEnd.setHours(23, 59, 59, 999)
      where.date = { gte: d, lte: dEnd }
    }

    const [data, total] = await Promise.all([
      db.duty.findMany({
        where,
        include: {
          depot: { select: { name: true } },
          route: { select: { name: true, code: true } },
        },
        orderBy: [{ date: "desc" }, { startTime: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.duty.count({ where }),
    ])

    return {
      data: data.map((d) => ({
        id: d.id, date: d.date.toISOString().split("T")[0],
        driverId: d.driverId, driverName: null,
        conductorId: d.conductorId, conductorName: null,
        vehicleId: d.vehicleId, vehicleReg: null,
        routeId: d.routeId,
        routeName: d.route?.name ?? null,
        depotId: d.depotId,
        depotName: d.depot?.name ?? null,
        startTime: d.startTime?.toISOString() ?? null,
        endTime: d.endTime?.toISOString() ?? null,
        status: d.status as DutyStatusEnum,
        publishedAt: d.publishedAt?.toISOString() ?? null,
        ackAt: d.ackAt?.toISOString() ?? null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  },
}
