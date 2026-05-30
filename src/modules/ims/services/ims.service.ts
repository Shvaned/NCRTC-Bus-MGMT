import { imsRepository } from "../repositories/ims.repository"
import { db } from "@/lib/db"
import { logAuditEvent } from "@/lib/audit"
import { VALID_TRANSITIONS } from "../constants"
import type { CreateIncidentInput, CreatePanicInput } from "../validators"
import type { IncidentDetail, IncidentStats } from "../types"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export class InvalidTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid status transition: ${from} → ${to}`)
    this.name = "InvalidTransitionError"
  }
}

export const imsService = {
  async listIncidents(params: {
    organizationId: string; status?: string; severity?: string; type?: string
    depotId?: string; search?: string; mine?: string
    page: number; limit: number; sort: string; order: "asc" | "desc"
  }) {
    const result = await imsRepository.list(params)

    // Enrich with names
    const ids = new Set<string>()
    result.data.forEach((d) => {
      if (d.reportedByName) ids.add(d.reportedByName)
      if (d.assignedToName) ids.add(d.assignedToName)
    })

    // Get vehicle/depot/reporter/assignee names
    const incidentIds = result.data.map((d) => d.id)
    if (incidentIds.length > 0) {
      const incidents = await db.incident.findMany({
        where: { id: { in: incidentIds } },
        select: {
          id: true,
          vehicle: { select: { registrationNumber: true } },
          depot: { select: { name: true } },
        },
      })
      const incMap = new Map(incidents.map((i) => [
        i.id, { vehicleReg: i.vehicle?.registrationNumber ?? null, depotName: i.depot?.name ?? null },
      ]))

      result.data.forEach((d) => {
        const enrich = incMap.get(d.id)
        if (enrich) {
          d.vehicleReg = enrich.vehicleReg
          d.depotName = enrich.depotName
        }
      })
    }

    return result
  },

  async getIncidentDetail(id: string): Promise<IncidentDetail | null> {
    const inc = await imsRepository.getById(id)
    if (!inc) return null

    // Get all user names for timeline and assignments
    const userIds = new Set<string>()
    inc.events.forEach((e) => userIds.add(e.userId))
    inc.assignmentHistory.forEach((a) => {
      userIds.add(a.assignedTo)
      userIds.add(a.assignedBy)
    })
    userIds.add(inc.reportedById)
    if (inc.assignedToId) userIds.add(inc.assignedToId)

    const users = await db.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, firstName: true, lastName: true },
    })
    const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]))

    return {
      id: inc.id,
      type: inc.type as IncidentDetail["type"],
      severity: inc.severity as IncidentDetail["severity"],
      status: inc.status as IncidentDetail["status"],
      title: inc.title,
      description: inc.description,
      vehicleId: inc.vehicleId,
      vehicleReg: inc.vehicle?.registrationNumber ?? null,
      depotId: inc.depotId,
      depotName: inc.depot?.name ?? null,
      reportedById: inc.reportedById,
      reportedByName: userMap.get(inc.reportedById) ?? null,
      assignedToId: inc.assignedToId,
      assignedToName: inc.assignedToId ? userMap.get(inc.assignedToId) ?? null : null,
      latitude: inc.latitude ? Number(inc.latitude) : null,
      longitude: inc.longitude ? Number(inc.longitude) : null,
      resolvedAt: inc.resolvedAt?.toISOString() ?? null,
      createdAt: inc.createdAt.toISOString(),
      updatedAt: inc.updatedAt.toISOString(),
      timeline: inc.events.map((e) => ({
        id: e.id,
        userId: e.userId,
        userName: userMap.get(e.userId) ?? "Unknown",
        eventType: e.eventType,
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
        note: e.note,
        createdAt: e.createdAt.toISOString(),
      })),
      attachments: inc.attachments.map((a) => ({
        id: a.id, fileName: a.fileName, fileSize: a.fileSize,
        mimeType: a.mimeType, url: a.url, uploadedBy: a.uploadedBy, createdAt: a.createdAt.toISOString(),
      })),
      assignmentHistory: inc.assignmentHistory.map((a) => ({
        id: a.id,
        assignedTo: a.assignedTo,
        assignedToName: userMap.get(a.assignedTo) ?? "Unknown",
        assignedBy: a.assignedBy,
        assignedByName: userMap.get(a.assignedBy) ?? "Unknown",
        assignedAt: a.assignedAt.toISOString(),
        unassignedAt: a.unassignedAt?.toISOString() ?? null,
        notes: a.notes,
      })),
    }
  },

  async createIncident(input: CreateIncidentInput, organizationId: string, userId: string) {
    const inc = await imsRepository.create({ ...input, organizationId, reportedById: userId })

    // Create initial OPEN event
    await imsRepository.addEvent({
      incidentId: inc.id, userId, eventType: "CREATED",
      fromStatus: null, toStatus: "OPEN", note: input.description,
    })

    await logAuditEvent({
      userId, action: "create", entity: "incident", entityId: inc.id,
      details: { type: input.type, severity: input.severity, title: input.title },
    })

    // Create notification if P1
    if (input.severity === "P1") {
      await this.notifyOperators(inc.id, inc.title)
    }

    return inc
  },

  async createPanic(input: CreatePanicInput, organizationId: string, userId: string) {
    // Get driver's current duty for vehicle/depot info
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const duty = await db.duty.findFirst({
      where: {
        driverId: userId,
        date: { gte: today, lt: tomorrow },
        status: { in: ["PUBLISHED", "ACKNOWLEDGED"] },
        deletedAt: null,
      },
    })

    const inc = await imsRepository.createPanic({
      organizationId,
      reportedById: userId,
      vehicleId: duty?.vehicleId ?? null,
      depotId: duty?.depotId ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    })

    await imsRepository.addEvent({
      incidentId: inc.id, userId, eventType: "CREATED",
      fromStatus: null, toStatus: "OPEN",
      note: `PANIC triggered. Vehicle: ${duty?.vehicleId ?? "N/A"}`,
    })

    await logAuditEvent({
      userId, action: "create", entity: "incident", entityId: inc.id,
      details: { action: "panic", vehicleId: duty?.vehicleId },
    })

    // Notify all control operators
    await this.notifyOperators(inc.id, "PANIC — Emergency Alert")

    return inc
  },

  async transitionStatus(id: string, newStatus: string, note: string, userId: string) {
    const inc = await imsRepository.getById(id)
    if (!inc) throw new Error("Incident not found")

    const validNext = VALID_TRANSITIONS[inc.status as keyof typeof VALID_TRANSITIONS]
    if (!validNext?.includes(newStatus as any)) {
      throw new InvalidTransitionError(inc.status, newStatus)
    }

    await imsRepository.addEvent({
      incidentId: id, userId, eventType: "STATUS_CHANGE",
      fromStatus: inc.status, toStatus: newStatus, note,
    })

    const resolvedAt = newStatus === "RESOLVED" ? new Date() : null
    const updated = await imsRepository.updateStatus(id, newStatus, resolvedAt)

    // Notify reporter on resolution
    if (newStatus === "RESOLVED" && inc.reportedById) {
      await db.notification.create({
        data: {
          userId: inc.reportedById,
          type: "info",
          title: "Incident Resolved",
          message: `Your incident "${inc.title}" has been resolved.`,
          actionUrl: "/driver/incidents",
        },
      })
    }

    await logAuditEvent({
      userId, action: "update", entity: "incident", entityId: id,
      details: { fromStatus: inc.status, toStatus: newStatus, note },
    })

    return updated
  },

  async assignIncident(id: string, assignedToId: string, userId: string, notes?: string | null) {
    const inc = await imsRepository.getById(id)
    if (!inc) throw new Error("Incident not found")

    const prevAssignee = inc.assignedToId

    await imsRepository.addAssignmentRecord({
      incidentId: id, assignedTo: assignedToId, assignedBy: userId, notes,
    })

    await imsRepository.assign(id, assignedToId)

    // Auto-transition to ACKNOWLEDGED if OPEN
    if (inc.status === "OPEN") {
      await imsRepository.addEvent({
        incidentId: id, userId, eventType: "STATUS_CHANGE",
        fromStatus: "OPEN", toStatus: "ACKNOWLEDGED",
        note: notes ?? `Assigned by manager`,
      })
      await imsRepository.updateStatus(id, "ACKNOWLEDGED")
    } else {
      await imsRepository.addEvent({
        incidentId: id, userId, eventType: "ASSIGNED",
        note: notes,
      })
    }

    // Notify assignee
    await db.notification.create({
      data: {
        userId: assignedToId,
        type: "warning",
        title: "Incident Assigned",
        message: `You have been assigned to incident "${inc.title}".`,
        actionUrl: "/control-room/incidents",
      },
    })

    await logAuditEvent({
      userId, action: "update", entity: "incident", entityId: id,
      details: { action: "assign", from: prevAssignee, to: assignedToId },
    })

    return inc
  },

  async addNote(id: string, note: string, userId: string) {
    return imsRepository.addNote(id, userId, note)
  },

  async uploadImage(incidentId: string, file: File, userId: string) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, fileName), buffer)

    const url = `/uploads/${fileName}`
    return imsRepository.addAttachment({
      incidentId, fileName: file.name, fileSize: file.size,
      mimeType: file.type, url, uploadedBy: userId,
    })
  },

  async getStats(organizationId: string, depotId?: string): Promise<IncidentStats> {
    return imsRepository.getStats(organizationId, depotId)
  },

  async notifyOperators(incidentId: string, title: string) {
    const operators = await db.user.findMany({
      where: { role: { in: ["control_operator", "admin"] }, isActive: true },
      select: { id: true },
    })

    if (operators.length > 0) {
      await db.notification.createMany({
        data: operators.map((op) => ({
          userId: op.id,
          type: "alert" as const,
          title: "New Incident",
          message: title,
          actionUrl: `/control-room/incidents`,
        })),
      })
    }
  },
}
