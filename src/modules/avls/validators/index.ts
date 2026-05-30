import { z } from "zod"

export const historyQuerySchema = z.object({
  vehicleId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
})

export const vehicleIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const liveQuerySchema = z.object({
  depotId: z.string().uuid().optional(),
  search: z.string().optional(),
})
