import { schedulingRepository } from "../repositories/scheduling.repository"
import { db } from "@/lib/db"
import { logAuditEvent } from "@/lib/audit"
import type { CreateStopInput, CreateRouteInput, UpdateRouteInput, CreateDutyInput, UpdateDutyInput } from "../validators"
import type { WeeklyRoster, RosterDriver, RosterDay, DutyListItem } from "../types"

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConflictError"
  }
}

export const schedulingService = {
  // ── Stops ──
  async listStops(params: { organizationId: string; search?: string; page: number; limit: number }) {
    return schedulingRepository.listStops(params)
  },

  async createStop(input: CreateStopInput, organizationId: string, userId: string) {
    const stop = await schedulingRepository.createStop({ ...input, organizationId })
    await logAuditEvent({ userId, action: "create", entity: "stop", entityId: stop.id, details: { name: stop.name } })
    return stop
  },

  async getStopById(id: string) {
    return schedulingRepository.getStopById(id)
  },

  // ── Routes ──
  async listRoutes(params: { organizationId: string; search?: string; status?: string; depotId?: string; page: number; limit: number }) {
    return schedulingRepository.listRoutes(params)
  },

  async getRouteDetail(id: string) {
    const route = await schedulingRepository.getRouteById(id)
    if (!route) return null
    return {
      ...route,
      status: route.status as string,
      depotName: route.depot?.name ?? null,
      stopCount: route.routeStops.length,
      stops: route.routeStops.map((rs) => ({
        id: rs.stop.id,
        name: rs.stop.name,
        code: rs.stop.code,
        address: rs.stop.address,
        latitude: Number(rs.stop.latitude),
        longitude: Number(rs.stop.longitude),
        sequence: rs.sequence,
        arrivalMin: rs.arrivalMin,
      })),
      distanceKm: route.distanceKm?.toString() ?? null,
    }
  },

  async createRoute(input: CreateRouteInput, organizationId: string, userId: string) {
    const route = await schedulingRepository.createRoute({ ...input, organizationId })
    await logAuditEvent({ userId, action: "create", entity: "route", entityId: route.id, details: { name: route.name } })
    return route
  },

  async updateRoute(id: string, input: UpdateRouteInput, userId: string) {
    const existing = await schedulingRepository.getRouteById(id)
    if (!existing) throw new Error("Route not found")
    const route = await schedulingRepository.updateRoute(id, input)
    await logAuditEvent({ userId, action: "update", entity: "route", entityId: id, details: { name: route.name } })
    return route
  },

  async archiveRoute(id: string, userId: string) {
    const existing = await schedulingRepository.getRouteById(id)
    if (!existing) throw new Error("Route not found")
    const route = await schedulingRepository.archiveRoute(id)
    await logAuditEvent({ userId, action: "update", entity: "route", entityId: id, details: { action: "archive" } })
    return route
  },

  // ── Duties ──
  async listDuties(params: { organizationId: string; depotId?: string; status?: string; date?: string; page: number; limit: number }) {
    const result = await schedulingRepository.listDuties(params)

    // Enrich with names
    const ids = [...new Set([
      ...result.data.map((d) => d.driverId).filter(Boolean),
      ...result.data.map((d) => d.conductorId).filter(Boolean),
    ])] as string[]

    if (ids.length > 0) {
      const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, firstName: true, lastName: true } })
      const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]))
      const vehicles = await db.vehicle.findMany({
        where: { id: { in: result.data.map((d) => d.vehicleId).filter(Boolean) as string[] } },
        select: { id: true, registrationNumber: true },
      })
      const vehicleMap = new Map(vehicles.map((v) => [v.id, v.registrationNumber]))

      result.data.forEach((d: any) => {
        if (d.driverId) d.driverName = userMap.get(d.driverId) ?? null
        if (d.conductorId) d.conductorName = userMap.get(d.conductorId) ?? null
        if (d.vehicleId) d.vehicleReg = vehicleMap.get(d.vehicleId) ?? null
      })
    }

    return result
  },

  async createDuty(input: CreateDutyInput, organizationId: string, userId: string) {
    const date = new Date(input.date)
    const startTime = new Date(input.startTime)
    const endTime = new Date(input.endTime)

    // Check driver conflict
    const driverConflicts = await schedulingRepository.findConflictingDuties({
      driverId: input.driverId,
      date, startTime, endTime,
    })
    if (driverConflicts.length > 0) {
      throw new ConflictError("Driver already has a duty during this time period")
    }

    // Check vehicle conflict
    const vehicleConflicts = await schedulingRepository.findConflictingDuties({
      vehicleId: input.vehicleId,
      date, startTime, endTime,
    })
    if (vehicleConflicts.length > 0) {
      throw new ConflictError("Vehicle already assigned during this time period")
    }

    // Check conductor conflict if assigned
    if (input.conductorId) {
      const conductorConflicts = await schedulingRepository.findConflictingDuties({
        driverId: input.conductorId,
        date, startTime, endTime,
      })
      if (conductorConflicts.length > 0) {
        throw new ConflictError("Conductor already assigned during this time period")
      }
    }

    const duty = await schedulingRepository.createDuty({ ...input, organizationId })

    await logAuditEvent({
      userId, action: "create", entity: "duty", entityId: duty.id,
      details: { depotId: input.depotId, driverId: input.driverId, date: input.date },
    })

    return duty
  },

  async updateDuty(id: string, input: UpdateDutyInput, userId: string) {
    const existing = await schedulingRepository.getDutyById(id)
    if (!existing) throw new Error("Duty not found")
    if (existing.status !== "DRAFT") throw new Error("Only draft duties can be edited")

    // Validate conflicts for changes
    if (input.driverId || input.vehicleId || input.startTime || input.endTime) {
      const date = input.startTime ? new Date(input.startTime) : existing.date
      const startTime = input.startTime ? new Date(input.startTime) : existing.startTime
      const endTime = input.endTime ? new Date(input.endTime) : existing.endTime

      if (input.driverId || input.startTime || input.endTime) {
        const conflicts = await schedulingRepository.findConflictingDuties({
          driverId: input.driverId ?? existing.driverId ?? undefined,
          date, startTime, endTime, excludeId: id,
        })
        if (conflicts.length > 0) throw new ConflictError("Driver has conflicting duties")
      }

      if (input.vehicleId || input.startTime || input.endTime) {
        const conflicts = await schedulingRepository.findConflictingDuties({
          vehicleId: input.vehicleId ?? existing.vehicleId ?? undefined,
          date, startTime, endTime, excludeId: id,
        })
        if (conflicts.length > 0) throw new ConflictError("Vehicle has conflicting duties")
      }
    }

    const duty = await schedulingRepository.updateDuty(id, input)
    await logAuditEvent({ userId, action: "update", entity: "duty", entityId: id })
    return duty
  },

  async publishDuty(id: string, userId: string) {
    const existing = await schedulingRepository.getDutyById(id)
    if (!existing) throw new Error("Duty not found")
    if (existing.status !== "DRAFT") throw new Error("Only draft duties can be published")

    const duty = await schedulingRepository.publishDuty(id)

    // Create notification for driver
    if (duty.driverId) {
      await db.notification.create({
        data: {
          userId: duty.driverId,
          type: "info",
          title: "New Duty Assigned",
          message: `You have a new duty on ${duty.date.toISOString().split("T")[0]} for route ${existing.route?.name ?? "N/A"}. Please acknowledge.`,
          actionUrl: "/driver/duty",
        },
      })
    }

    await logAuditEvent({ userId, action: "update", entity: "duty", entityId: id, details: { action: "publish" } })
    return duty
  },

  async publishDuties(ids: string[], userId: string) {
    const duties = await Promise.all(ids.map((id) => schedulingRepository.getDutyById(id)))
    const invalidDuties = duties.filter((d) => !d || d.status !== "DRAFT")
    if (invalidDuties.length > 0) throw new Error(`${invalidDuties.length} duties cannot be published`)

    await schedulingRepository.publishDuties(ids)

    for (const duty of duties) {
      if (duty?.driverId) {
        await db.notification.create({
          data: {
            userId: duty.driverId,
            type: "info",
            title: "New Duty Assigned",
            message: `You have a new duty on ${duty.date.toISOString().split("T")[0]}.`,
            actionUrl: "/driver/duty",
          },
        })
      }
    }

    await logAuditEvent({ userId, action: "update", entity: "duty", entityId: "batch", details: { action: "publish_batch", ids } })
    return { publishedCount: ids.length }
  },

  async acknowledgeDuty(id: string, driverId: string) {
    const existing = await schedulingRepository.getDutyById(id)
    if (!existing) throw new Error("Duty not found")
    if (existing.driverId !== driverId) throw new Error("You can only acknowledge your own duties")
    if (existing.status !== "PUBLISHED") throw new Error("Only published duties can be acknowledged")

    const duty = await schedulingRepository.acknowledgeDuty(id)
    await logAuditEvent({ userId: driverId, action: "update", entity: "duty", entityId: id, details: { action: "acknowledge" } })
    return duty
  },

  async getTodayDuty(driverId: string) {
    return schedulingRepository.getTodayDuty(driverId, new Date())
  },

  async getWeeklyRoster(params: { depotId: string; weekStart: string; weekEnd: string }): Promise<WeeklyRoster | null> {
    const weekStart = new Date(params.weekStart)
    const weekEnd = new Date(params.weekEnd)

    const [duties, drivers, depot] = await Promise.all([
      schedulingRepository.getWeeklyRoster({ depotId: params.depotId, weekStart, weekEnd }),
      db.user.findMany({
        where: { depotId: params.depotId, role: "driver", isActive: true, deletedAt: null },
        select: { id: true, firstName: true, lastName: true },
      }),
      db.depot.findUnique({ where: { id: params.depotId }, select: { name: true } }),
    ])

    const dates: string[] = []
    const current = new Date(weekStart)
    while (current <= weekEnd) {
      dates.push(current.toISOString().split("T")[0])
      current.setDate(current.getDate() + 1)
    }

    const dutyMap = new Map<string, DutyListItem[]>()
    for (const d of duties) {
      const dateKey = d.date.toISOString().split("T")[0]
      if (!dutyMap.has(dateKey)) dutyMap.set(dateKey, [])
      dutyMap.get(dateKey)!.push({
        id: d.id,
        date: dateKey,
        driverId: d.driverId,
        driverName: null,
        conductorId: d.conductorId,
        conductorName: null,
        vehicleId: d.vehicleId,
        vehicleReg: null,
        routeId: d.routeId,
        routeName: d.route?.name ?? null,
        depotId: d.depotId,
        depotName: d.depot?.name ?? null,
        startTime: d.startTime?.toISOString() ?? null,
        endTime: d.endTime?.toISOString() ?? null,
        status: d.status as DutyListItem["status"],
        publishedAt: d.publishedAt?.toISOString() ?? null,
        ackAt: d.ackAt?.toISOString() ?? null,
      })
    }

    const rosterDrivers: RosterDriver[] = drivers.map((drv) => ({
      driverId: drv.id,
      driverName: `${drv.firstName} ${drv.lastName}`,
      days: dates.map((date): RosterDay => {
        const dayDuties = dutyMap.get(date) ?? []
        const duty = dayDuties.find((d) => d.driverId === drv.id) ?? null
        const d = new Date(date)
        return {
          date,
          dayLabel: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
          duty,
        }
      }),
    }))

    return {
      weekStart: params.weekStart,
      weekEnd: params.weekEnd,
      dates,
      depotName: depot?.name ?? "Unknown",
      drivers: rosterDrivers,
    }
  },
}
