import type { NoticeAudienceType } from "../types"

export const NOTICE_STATUSES = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const

export type NoticeStatusEnum = (typeof NOTICE_STATUSES)[keyof typeof NOTICE_STATUSES]

export const NOTICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
}

export const NOTICE_STATUS_VARIANTS: Record<string, string> = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
}

export const AUDIENCE_TYPE_LABELS: Record<NoticeAudienceType, string> = {
  ALL_DRIVERS: "All Drivers",
  DEPOT: "Specific Depot",
  ROLE: "Specific Role",
}

export const CMS_ROUTES = {
  admin: {
    dashboard: "/admin/cms",
    create: "/admin/cms/create",
    detail: (id: string) => `/admin/cms/${id}`,
  },
  driver: {
    notices: "/driver/notices",
  },
}
