import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"
import type { CreateNoticeInput, UpdateNoticeInput } from "../validators"
import type { NoticeAudience } from "../types"

export const noticeRepository = {
  async list(params: {
    organizationId: string
    status?: string
    search?: string
    page: number
    limit: number
    sort: string
    order: "asc" | "desc"
  }) {
    const { organizationId, status, search, page, limit, sort, order } = params
    const offset = (page - 1) * limit

    const where: Prisma.NoticeWhereInput = {
      organizationId,
      deletedAt: null,
    }

    if (status) where.status = status as Prisma.EnumNoticeStatusFilter["equals"]
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ]
    }

    const [data, total] = await Promise.all([
      db.notice.findMany({
        where,
        include: {
          _count: { select: { reads: true } },
          reads: { select: { acknowledgedAt: true } },
        },
        orderBy: { [sort]: order },
        skip: offset,
        take: limit,
      }),
      db.notice.count({ where }),
    ])

    const list = data.map((n) => ({
      id: n.id,
      title: n.title,
      status: n.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      audienceJson: n.audienceJson as unknown as NoticeAudience | null,
      requiresAck: n.requiresAck,
      publishedAt: n.publishedAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
      readCount: n._count.reads,
      ackCount: n.reads.filter((r) => r.acknowledgedAt).length,
      totalTargets: 0,
      authorName: "",
    }))

    return {
      data: list,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async getById(id: string) {
    return db.notice.findFirst({
      where: { id, deletedAt: null },
      include: {
        reads: true,
      },
    })
  },

  async create(input: CreateNoticeInput & { organizationId: string; authorId: string }) {
    return db.notice.create({
      data: {
        title: input.title,
        content: input.content,
        status: "DRAFT",
        audienceJson: input.audience as Prisma.InputJsonValue,
        requiresAck: input.requiresAck,
        publishedAt: input.publishAt ? new Date(input.publishAt) : null,
        organizationId: input.organizationId,
        authorId: input.authorId,
      },
      include: { reads: true, _count: { select: { reads: true } } },
    })
  },

  async update(id: string, input: UpdateNoticeInput) {
    return db.notice.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.audience !== undefined && { audienceJson: input.audience as Prisma.InputJsonValue }),
        ...(input.requiresAck !== undefined && { requiresAck: input.requiresAck }),
      },
    })
  },

  async publish(id: string) {
    return db.notice.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    })
  },

  async archive(id: string) {
    return db.notice.update({
      where: { id },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    })
  },

  async markRead(noticeId: string, userId: string) {
    return db.noticeRead.upsert({
      where: { noticeId_userId: { noticeId, userId } },
      create: { noticeId, userId, readAt: new Date() },
      update: { readAt: new Date() },
    })
  },

  async markAcknowledged(noticeId: string, userId: string) {
    return db.noticeRead.upsert({
      where: { noticeId_userId: { noticeId, userId } },
      create: { noticeId, userId, readAt: new Date(), acknowledgedAt: new Date() },
      update: { acknowledgedAt: new Date(), readAt: new Date() },
    })
  },

  async getReadReceipts(noticeId: string) {
    const notice = await db.notice.findUnique({
      where: { id: noticeId },
      include: {
        reads: {
          include: {
            // We need user info; NoticeRead doesn't have a direct user relation
            // We'll handle this in the service layer
          },
        },
      },
    })
    return notice?.reads ?? []
  },

  async getMyNotices(params: {
    userId: string
    userRole: string
    depotId: string | null
    organizationId: string
    page: number
    limit: number
  }) {
    const { userId, userRole, depotId, organizationId, page, limit } = params
    const offset = (page - 1) * limit

    // Find notices targeted to this user
    const allPublished = await db.notice.findMany({
      where: {
        organizationId,
        status: "PUBLISHED",
        deletedAt: null,
      },
      orderBy: { publishedAt: "desc" },
    })

    // Client-side audience filtering (since JSON queries in Prisma are limited)
    const targetedNotices = allPublished.filter((n) => {
      if (!n.audienceJson) return true
      const audience = n.audienceJson as unknown as NoticeAudience
      if (audience.type === "ALL_DRIVERS") {
        return userRole === "driver" || userRole === "conductor"
      }
      if (audience.type === "DEPOT") {
        return depotId && audience.depotIds?.includes(depotId)
      }
      if (audience.type === "ROLE") {
        return audience.role === userRole
      }
      return true
    })

    const total = targetedNotices.length
    const paged = targetedNotices.slice(offset, offset + limit)

    // Get read status for user
    const noticeIds = paged.map((n) => n.id)
    const readRecords = await db.noticeRead.findMany({
      where: { noticeId: { in: noticeIds }, userId },
    })
    const readMap = new Map(readRecords.map((r) => [r.noticeId, r]))

    const data = paged.map((n) => {
      const read = readMap.get(n.id)
      return {
        id: n.id,
        title: n.title,
        content: n.content,
        status: n.status as string,
        audienceJson: n.audienceJson as unknown as NoticeAudience | null,
        requiresAck: n.requiresAck,
        publishedAt: n.publishedAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
        isRead: !!read?.readAt,
        isAcknowledged: !!read?.acknowledgedAt,
        readAt: read?.readAt?.toISOString() ?? null,
        acknowledgedAt: read?.acknowledgedAt?.toISOString() ?? null,
      }
    })

    // Unread first
    data.sort((a, b) => {
      if (a.isRead === b.isRead) return 0
      return a.isRead ? 1 : -1
    })

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  },

  async getUnreadCount(userId: string, userRole: string, depotId: string | null, organizationId: string) {
    const allPublished = await db.notice.findMany({
      where: {
        organizationId,
        status: "PUBLISHED",
        deletedAt: null,
      },
      select: { id: true, audienceJson: true },
    })

    const targetedIds = allPublished
      .filter((n) => {
        if (!n.audienceJson) return true
        const audience = n.audienceJson as unknown as NoticeAudience
        if (audience.type === "ALL_DRIVERS") return userRole === "driver" || userRole === "conductor"
        if (audience.type === "DEPOT") return depotId && audience.depotIds?.includes(depotId)
        if (audience.type === "ROLE") return audience.role === userRole
        return true
      })
      .map((n) => n.id)

    const readRecords = await db.noticeRead.findMany({
      where: { noticeId: { in: targetedIds }, userId, readAt: { not: null } },
      select: { noticeId: true },
    })

    return targetedIds.length - readRecords.length
  },
}
