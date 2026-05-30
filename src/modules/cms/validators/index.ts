import { z } from "zod"

const audienceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ALL_DRIVERS") }),
  z.object({ type: z.literal("DEPOT"), depotIds: z.array(z.string().uuid()).min(1, "Select at least one depot") }),
  z.object({ type: z.literal("ROLE"), role: z.enum(["driver", "conductor", "depot_manager"]) }),
])

export const createNoticeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(500),
  content: z.string().min(1, "Content is required").max(50000),
  audience: audienceSchema,
  requiresAck: z.boolean().default(false),
  publishAt: z.string().datetime().optional(),
})

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>
export type CreateNoticeFormValues = z.input<typeof createNoticeSchema>

export const updateNoticeSchema = z.object({
  title: z.string().min(3).max(500).optional(),
  content: z.string().min(1).max(50000).optional(),
  audience: audienceSchema.optional(),
  requiresAck: z.boolean().optional(),
})

export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>

export const noticeListParamsSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  search: z.string().optional(),
  audience: z.enum(["ALL_DRIVERS", "DEPOT", "ROLE"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["createdAt", "publishedAt", "title"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
})
