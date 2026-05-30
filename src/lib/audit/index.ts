import { db } from "@/lib/db"
import type { AuditAction } from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"

export async function logAuditEvent(input: {
  userId?: string
  action: AuditAction
  entity: string
  entityId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: input as Prisma.AuditLogCreateInput,
    })
  } catch (err) {
    console.error("[AuditLog] Failed to write audit event:", err)
  }
}
