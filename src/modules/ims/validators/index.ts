import { z } from "zod"

export const createIncidentSchema = z.object({
  type: z.enum(["BREAKDOWN", "ACCIDENT", "COMPLAINT", "PANIC", "OTHER"]),
  severity: z.enum(["P1", "P2", "P3"]),
  title: z.string().min(3, "Title must be at least 3 characters").max(500),
  description: z.string().min(1, "Description is required").max(5000),
  vehicleId: z.string().uuid().optional().nullable(),
  depotId: z.string().uuid().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
})

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>

export const createPanicSchema = z.object({
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
})

export type CreatePanicInput = z.infer<typeof createPanicSchema>

export const statusTransitionSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  note: z.string().min(1, "Note is required for status transitions"),
})

export const addNoteSchema = z.object({
  note: z.string().min(1, "Note cannot be empty").max(2000),
})

export const assignIncidentSchema = z.object({
  assignedToId: z.string().uuid(),
  notes: z.string().max(500).optional(),
})

export const incidentListParamsSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  severity: z.enum(["P1", "P2", "P3"]).optional(),
  type: z.enum(["BREAKDOWN", "ACCIDENT", "COMPLAINT", "PANIC", "OTHER"]).optional(),
  depotId: z.string().uuid().optional(),
  search: z.string().optional(),
  mine: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["createdAt", "severity", "status"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
})
