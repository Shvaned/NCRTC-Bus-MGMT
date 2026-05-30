import { hasPermission, requirePermission } from "@/lib/permissions"
import type { SystemRole } from "@/lib/constants/roles"

export function canCreateNotice(role: SystemRole): boolean {
  return hasPermission(role, "notice.create")
}

export function canEditNotice(role: SystemRole): boolean {
  return hasPermission(role, "notice.edit")
}

export function canPublishNotice(role: SystemRole): boolean {
  return hasPermission(role, "notice.publish")
}

export function canArchiveNotice(role: SystemRole): boolean {
  return hasPermission(role, "notice.archive") || hasPermission(role, "notice.publish")
}

export function canViewReadReceipts(role: SystemRole): boolean {
  return hasPermission(role, "notice.read_receipts")
}

export function canAcknowledgeNotice(role: SystemRole): boolean {
  return hasPermission(role, "notice.acknowledge")
}

export function requireCreateNotice(role: SystemRole): void {
  requirePermission(role, "notice.create")
}

export function requirePublishNotice(role: SystemRole): void {
  requirePermission(role, "notice.publish")
}

export function requireEditNotice(role: SystemRole): void {
  requirePermission(role, "notice.edit")
}
