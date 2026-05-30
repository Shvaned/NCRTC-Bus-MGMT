export type NoticeAudienceType = "ALL_DRIVERS" | "DEPOT" | "ROLE"

export interface NoticeAudience {
  type: NoticeAudienceType
  depotIds?: string[]
  role?: string
}

export interface NoticeListItem {
  id: string
  title: string
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  audienceJson: NoticeAudience | null
  requiresAck: boolean
  publishedAt: string | null
  createdAt: string
  readCount: number
  ackCount: number
  totalTargets: number
  authorName: string
}

export interface NoticeDetail extends NoticeListItem {
  content: string
  archivedAt: string | null
  authorId: string
  organizationId: string
  updatedAt: string
}

export interface ReadReceiptItem {
  userId: string
  userName: string
  userRole: string
  depotName: string | null
  readAt: string | null
  acknowledgedAt: string | null
  isRead: boolean
  isAcknowledged: boolean
}

export interface NoticeListParams {
  status?: string
  search?: string
  audience?: string
  page?: number
  limit?: number
  sort?: "createdAt" | "publishedAt" | "title"
  order?: "asc" | "desc"
}

export interface NoticeListResponse {
  data: NoticeListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
