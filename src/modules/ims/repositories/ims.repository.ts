import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"
import type { IncidentSeverityEnum, IncidentStatusEnum, IncidentTypeEnum } from "../types"
import { VALID_TRANSITIONS } from "../constants"

export const imsRepository = {
  async list(params: {
    organizationId: string
    status?: string; severity?: string; type?: string; depotId?: string
    search?: string; mine?: string
    page: number; limit: number; sort: string; order: "asc" | "desc"
  }) {
    const { organizationId, status, severity, type, depotId, search, mine, page, limit, sort, order } = params
    const where: Prisma.IncidentWhereInput = { organizationId, deletedAt: null }

    if (status) where.status = status as Prisma.EnumIncidentStatusFilter["equals"]
    if (severity) where.severity = severity as Prisma.EnumIncidentSeverityFilter["equals"]
    if (type) where.type = type as Prisma.EnumIncidentTypeFilter["equals"]
    if (depotId) where.depotId = depotId
    if (mine) where.reportedById = mine
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const orderKey = sort === "severity"
      ? { severity: order }
      : sort === "status"
        ? { status: order }
        : { createdAt: order }

    const [data, total] = await Promise.all([
      db.incident.findMany({
        where,
        orderBy: [orderKey],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.incident.count({ where }),
    ])

    // Priority sort: P1 first, then by date
    if (sort === "severity") {
      const severityOrder: Record<string, number> = { P1: 0, P2: 1, P3: 2 }
      data.sort((a, b) => {
        const sa = severityOrder[a.severity] ?? 99
        const sb = severityOrder[b.severity] ?? 99
        if (sa !== sb) return order === "asc" ? sa - sb : sb - sa
        return order === "asc"
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime()
      })
    }

    return {
      data: data.map((inc) => ({
        id: inc.id,
        type: inc.type as IncidentTypeEnum,
        severity: inc.severity as IncidentSeverityEnum,
        status: inc.status as IncidentStatusEnum,
        title: inc.title,
        vehicleReg: null as string | null,
        depotName: null as string | null,
        reportedByName: null as string | null,
        assignedToName: null as string | null,
        createdAt: inc.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  },

  async getById(id: string) {
    return db.incident.findFirst({
      where: { id, deletedAt: null },
      include: {
        vehicle: { select: { registrationNumber: true } },
        depot: { select: { name: true } },
        events: { orderBy: { createdAt: "asc" } },
        attachments: { orderBy: { createdAt: "desc" } },
        assignmentHistory: { orderBy: { assignedAt: "desc" } },
      },
    })
  },

  async create(input: {
    organizationId: string; reportedById: string; type: string; severity: string
    title: string; description: string; vehicleId?: string | null; depotId?: string | null
    latitude?: number | null; longitude?: number | null
  }) {
    return db.incident.create({
      data: {
        organizationId: input.organizationId,
        reportedById: input.reportedById,
        type: input.type as any,
        severity: input.severity as any,
        title: input.title,
        description: input.description,
        status: "OPEN",
        vehicleId: input.vehicleId ?? null,
        depotId: input.depotId ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      },
    })
  },

  async createPanic(input: {
    organizationId: string; reportedById: string; vehicleId?: string | null
    depotId?: string | null; latitude?: number | null; longitude?: number | null
  }) {
    return db.incident.create({
      data: {
        organizationId: input.organizationId,
        reportedById: input.reportedById,
        type: "PANIC",
        severity: "P1",
        title: "PANIC — Emergency Alert",
        description: `Panic button triggered by driver.\nLocation: ${input.latitude ?? "N/A"}, ${input.longitude ?? "N/A"}\nTime: ${new Date().toISOString()}`,
        status: "OPEN",
        vehicleId: input.vehicleId ?? null,
        depotId: input.depotId ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      },
    })
  },

  async addEvent(input: {
    incidentId: string; userId: string; eventType: string
    fromStatus?: string | null; toStatus?: string | null; note?: string | null
  }) {
    return db.incidentEvent.create({
      data: {
        incidentId: input.incidentId,
        userId: input.userId,
        eventType: input.eventType,
        fromStatus: input.fromStatus ?? null,
        toStatus: input.toStatus ?? null,
        note: input.note ?? null,
      },
    })
  },

  async updateStatus(id: string, status: string, resolvedAt?: Date | null) {
    return db.incident.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === "RESOLVED" || status === "CLOSED" ? { resolvedAt: resolvedAt ?? new Date() } : {}),
      },
    })
  },

  async assign(id: string, assignedToId: string) {
    return db.incident.update({
      where: { id },
      data: { assignedToId },
    })
  },

  async addNote(id: string, userId: string, note: string) {
    return db.incidentEvent.create({
      data: {
        incidentId: id,
        userId,
        eventType: "NOTE",
        note,
      },
    })
  },

  async addAssignmentRecord(input: {
    incidentId: string; assignedTo: string; assignedBy: string; notes?: string | null
  }) {
    return db.incidentAssignmentHistory.create({ data: input })
  },

  async addAttachment(input: {
    incidentId: string; fileName: string; fileSize: number; mimeType: string
    url: string; uploadedBy: string
  }) {
    return db.incidentAttachment.create({ data: input })
  },

  async getStats(organizationId: string, depotId?: string) {
    const where: Prisma.IncidentWhereInput = { organizationId, deletedAt: null }
    if (depotId) where.depotId = depotId

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [total, open, critical, resolvedToday, avgData] = await Promise.all([
      db.incident.count({ where }),
      db.incident.count({ where: { ...where, status: "OPEN" } }),
      db.incident.count({ where: { ...where, severity: "P1", status: { not: "CLOSED" } } }),
      db.incident.count({
        where: {
          ...where,
          status: "RESOLVED",
          resolvedAt: { gte: today },
        },
      }),
      db.incident.findMany({
        where: { ...where, status: { in: ["RESOLVED", "CLOSED"] }, resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
        orderBy: { resolvedAt: "desc" },
        take: 50,
      }),
    ])

    let avgResolutionHours: number | null = null
    const withResolution = avgData.filter((i) => i.resolvedAt)
    if (withResolution.length > 0) {
      const totalHours = withResolution.reduce((sum, i) =>
        sum + (i.resolvedAt!.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60), 0
      )
      avgResolutionHours = Math.round(totalHours / withResolution.length * 10) / 10
    }

    return { total, open, critical, resolvedToday, avgResolutionHours }
  },
}
