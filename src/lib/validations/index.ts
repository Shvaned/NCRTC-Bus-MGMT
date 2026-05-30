import { z } from "zod"

export const loginSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const uuidSchema = z.string().uuid("Invalid UUID format")

export const vehicleCreateSchema = z.object({
  registrationNumber: z.string().min(3).max(50),
  vehicleType: z.string().min(1).max(50),
  make: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  capacity: z.number().int().min(1).max(200).optional(),
  depotId: z.string().uuid(),
})

export const incidentCreateSchema = z.object({
  title: z.string().min(3).max(500),
  description: z.string().max(5000).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  vehicleId: z.string().uuid().optional(),
  depotId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

export const noticeCreateSchema = z.object({
  title: z.string().min(3).max(500),
  content: z.string().min(1),
  priority: z.enum(["normal", "high", "urgent"]).default("normal"),
  expiresAt: z.string().datetime().optional(),
})
