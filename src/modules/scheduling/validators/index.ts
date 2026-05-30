import { z } from "zod"

export const createStopSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  code: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export type CreateStopInput = z.infer<typeof createStopSchema>

export const routeStopSchema = z.object({
  stopId: z.string().uuid(),
  sequence: z.number().int().min(1),
  arrivalMin: z.number().int().min(0).nullable().optional(),
})

export const createRouteSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(255),
  code: z.string().min(2).max(50).regex(/^[A-Z0-9\-]+$/, "Code must be uppercase alphanumeric with dashes"),
  depotId: z.string().uuid().optional().nullable(),
  origin: z.string().max(255).optional(),
  destination: z.string().max(255).optional(),
  distanceKm: z.number().min(0).optional(),
  estimatedTimeMin: z.number().int().min(1).optional(),
  stops: z.array(routeStopSchema).min(1, "Route must have at least 1 stop"),
})

export type CreateRouteInput = z.infer<typeof createRouteSchema>

export const updateRouteSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  depotId: z.string().uuid().optional().nullable(),
  origin: z.string().max(255).optional(),
  destination: z.string().max(255).optional(),
  distanceKm: z.number().min(0).optional(),
  estimatedTimeMin: z.number().int().min(1).optional(),
  stops: z.array(routeStopSchema).optional(),
})

export type UpdateRouteInput = z.infer<typeof updateRouteSchema>

export const createDutySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  driverId: z.string().uuid(),
  conductorId: z.string().uuid().optional().nullable(),
  vehicleId: z.string().uuid(),
  routeId: z.string().uuid(),
  depotId: z.string().uuid(),
  startTime: z.string(),
  endTime: z.string(),
  notes: z.string().max(1000).optional(),
})

export type CreateDutyInput = z.infer<typeof createDutySchema>

export const updateDutySchema = z.object({
  driverId: z.string().uuid().optional(),
  conductorId: z.string().uuid().optional().nullable(),
  vehicleId: z.string().uuid().optional(),
  routeId: z.string().uuid().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

export type UpdateDutyInput = z.infer<typeof updateDutySchema>
