import { hasPermission, requirePermission } from "@/lib/permissions"
import type { SystemRole } from "@/lib/constants/roles"

export function canCreateIncident(role: SystemRole): boolean {
  return hasPermission(role, "incident.write")
}

export function canAssignIncident(role: SystemRole): boolean {
  return hasPermission(role, "incident.assign")
}

export function canResolveIncident(role: SystemRole): boolean {
  return hasPermission(role, "incident.resolve")
}

export function canPanic(role: SystemRole): boolean {
  return hasPermission(role, "incident.panic")
}

export function requireAssignIncident(role: SystemRole): void {
  requirePermission(role, "incident.assign")
}

export function requireResolveIncident(role: SystemRole): void {
  requirePermission(role, "incident.resolve")
}
