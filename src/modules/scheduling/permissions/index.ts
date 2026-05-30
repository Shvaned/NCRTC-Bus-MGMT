import { hasPermission, requirePermission } from "@/lib/permissions"
import type { SystemRole } from "@/lib/constants/roles"

export function canManageRoutes(role: SystemRole): boolean {
  return hasPermission(role, "route.write")
}

export function canAssignDuties(role: SystemRole): boolean {
  return hasPermission(role, "duty.assign")
}

export function canPublishDuties(role: SystemRole): boolean {
  return hasPermission(role, "duty.publish")
}

export function canWriteDuties(role: SystemRole): boolean {
  return hasPermission(role, "duty.write")
}

export function canAcknowledgeDuty(role: SystemRole): boolean {
  return hasPermission(role, "duty.acknowledge")
}

export function requireAssignDuty(role: SystemRole): void {
  requirePermission(role, "duty.assign")
}

export function requirePublishDuty(role: SystemRole): void {
  requirePermission(role, "duty.publish")
}

export function requireWriteDuty(role: SystemRole): void {
  requirePermission(role, "duty.write")
}

export function requireManageRoutes(role: SystemRole): void {
  requirePermission(role, "route.write")
}
