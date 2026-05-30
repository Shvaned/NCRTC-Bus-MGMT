import type { DutyStatusEnum, RouteStatusEnum } from "../types"

export const DUTY_STATUS_LABELS: Record<DutyStatusEnum, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ACKNOWLEDGED: "Acknowledged",
  COMPLETED: "Completed",
  MISSED: "Missed",
}

export const DUTY_STATUS_VARIANTS: Record<DutyStatusEnum, string> = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ACKNOWLEDGED: "acknowledged",
  COMPLETED: "completed",
  MISSED: "missed",
}

export const ROUTE_STATUS_LABELS: Record<RouteStatusEnum, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
}

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
