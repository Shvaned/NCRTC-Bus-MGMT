import { noticeRepository } from "../repositories/notice.repository"
import { db } from "@/lib/db"
import { logAuditEvent } from "@/lib/audit"
import type { CreateNoticeInput, UpdateNoticeInput } from "../validators"
import type { NoticeDetail, ReadReceiptItem } from "../types"

export const noticeService = {
  async listNotices(params: {
    organizationId: string
    status?: string
    search?: string
    page: number
    limit: number
    sort: string
    order: "asc" | "desc"
  }) {
    return noticeRepository.list(params)
  },

  async getNoticeDetail(id: string): Promise<NoticeDetail | null> {
    const notice = await noticeRepository.getById(id)
    if (!notice) return null

    const author = await db.user.findUnique({
      where: { id: notice.authorId },
      select: { firstName: true, lastName: true },
    })

    return {
      id: notice.id,
      title: notice.title,
      content: notice.content,
      status: notice.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      audienceJson: notice.audienceJson as unknown as NoticeDetail["audienceJson"],
      requiresAck: notice.requiresAck,
      publishedAt: notice.publishedAt?.toISOString() ?? null,
      archivedAt: notice.archivedAt?.toISOString() ?? null,
      createdAt: notice.createdAt.toISOString(),
      updatedAt: notice.updatedAt.toISOString(),
      readCount: notice.reads.filter((r) => r.readAt).length,
      ackCount: notice.reads.filter((r) => r.acknowledgedAt).length,
      totalTargets: 0,
      authorName: author ? `${author.firstName} ${author.lastName}` : "Unknown",
      authorId: notice.authorId,
      organizationId: notice.organizationId,
    }
  },

  async createNotice(input: CreateNoticeInput, organizationId: string, authorId: string) {
    const notice = await noticeRepository.create({ ...input, organizationId, authorId })

    await logAuditEvent({
      userId: authorId,
      action: "create",
      entity: "notice",
      entityId: notice.id,
      details: { title: notice.title },
    })

    return notice
  },

  async updateNotice(id: string, input: UpdateNoticeInput, userId: string) {
    const existing = await noticeRepository.getById(id)
    if (!existing) throw new Error("Notice not found")
    if (existing.status !== "DRAFT") throw new Error("Only draft notices can be edited")

    const updated = await noticeRepository.update(id, input)

    await logAuditEvent({
      userId,
      action: "update",
      entity: "notice",
      entityId: id,
      details: { changes: input },
    })

    return updated
  },

  async publishNotice(id: string, userId: string) {
    const existing = await noticeRepository.getById(id)
    if (!existing) throw new Error("Notice not found")
    if (existing.status === "ARCHIVED") throw new Error("Archived notices cannot be published")

    const published = await noticeRepository.publish(id)

    // Create notifications for targeted users
    await this.createNotificationsForNotice(id, existing.audienceJson as Record<string, unknown> | null, existing.organizationId)

    await logAuditEvent({
      userId,
      action: "update",
      entity: "notice",
      entityId: id,
      details: { action: "publish", title: existing.title },
    })

    return published
  },

  async archiveNotice(id: string, userId: string) {
    const existing = await noticeRepository.getById(id)
    if (!existing) throw new Error("Notice not found")

    const archived = await noticeRepository.archive(id)

    await logAuditEvent({
      userId,
      action: "update",
      entity: "notice",
      entityId: id,
      details: { action: "archive", title: existing.title },
    })

    return archived
  },

  async createNotificationsForNotice(noticeId: string, audienceJson: Record<string, unknown> | null, organizationId: string) {
    // Find target users based on audience
    const notice = await noticeRepository.getById(noticeId)
    if (!notice) return

    let targetUsers: { id: string }[] = []

    if (!audienceJson) {
      targetUsers = await db.user.findMany({ where: { organizationId, isActive: true }, select: { id: true } })
    } else {
      const audience = audienceJson as { type: string; depotIds?: string[]; role?: string }
      if (audience.type === "ALL_DRIVERS") {
        targetUsers = await db.user.findMany({
          where: { organizationId, role: { in: ["driver", "conductor"] }, isActive: true },
          select: { id: true },
        })
      } else if (audience.type === "DEPOT" && audience.depotIds) {
        targetUsers = await db.user.findMany({
          where: { organizationId, depotId: { in: audience.depotIds }, isActive: true },
          select: { id: true },
        })
      } else if (audience.type === "ROLE" && audience.role) {
        targetUsers = await db.user.findMany({
          where: { organizationId, role: audience.role as "admin" | "driver" | "conductor" | "depot_manager" | "control_operator" | "executive", isActive: true },
          select: { id: true },
        })
      }
    }

    // Batch create notifications
    if (targetUsers.length > 0) {
      await db.notification.createMany({
        data: targetUsers.map((u) => ({
          userId: u.id,
          type: "info" as const,
          title: notice.title,
          message: notice.content.substring(0, 200) + (notice.content.length > 200 ? "..." : ""),
          actionUrl: `/driver/notices`,
        })),
      })
    }
  },

  async markRead(noticeId: string, userId: string) {
    const record = await noticeRepository.markRead(noticeId, userId)
    return record
  },

  async markAcknowledged(noticeId: string, userId: string) {
    const notice = await noticeRepository.getById(noticeId)
    if (!notice) throw new Error("Notice not found")
    if (!notice.requiresAck) throw new Error("This notice does not require acknowledgement")

    const record = await noticeRepository.markAcknowledged(noticeId, userId)

    await logAuditEvent({
      userId,
      action: "update",
      entity: "notice",
      entityId: noticeId,
      details: { action: "acknowledge" },
    })

    return record
  },

  async getReadReceipts(noticeId: string): Promise<ReadReceiptItem[]> {
    const reads = await noticeRepository.getReadReceipts(noticeId)
    if (reads.length === 0) return []

    const userIds = reads.map((r) => r.userId)
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      include: { depot: { select: { name: true } } },
    })
    const userMap = new Map(users.map((u) => [u.id, u]))

    return reads.map((r) => {
      const user = userMap.get(r.userId)
      return {
        userId: r.userId,
        userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
        userRole: user?.role ?? "unknown",
        depotName: user?.depot?.name ?? null,
        readAt: r.readAt?.toISOString() ?? null,
        acknowledgedAt: r.acknowledgedAt?.toISOString() ?? null,
        isRead: !!r.readAt,
        isAcknowledged: !!r.acknowledgedAt,
      }
    })
  },

  async getMyNotices(params: {
    userId: string
    userRole: string
    depotId: string | null
    organizationId: string
    page: number
    limit: number
  }) {
    return noticeRepository.getMyNotices(params)
  },

  async getUnreadCount(userId: string, userRole: string, depotId: string | null, organizationId: string) {
    return noticeRepository.getUnreadCount(userId, userRole, depotId, organizationId)
  },
}
