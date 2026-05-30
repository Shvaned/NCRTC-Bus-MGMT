import { ROLES, type SystemRole, DEPOT_SCOPED_ROLES } from "@/lib/constants/roles"

const PERMISSION_MAP: Record<SystemRole, string[]> = {
  [ROLES.ADMIN]: [
    "*",
  ],
  [ROLES.CONTROL_OPERATOR]: [
    "vehicle.read", "vehicle.write",
    "route.read", "route.write",
    "duty.read", "duty.assign",
    "incident.read", "incident.write", "incident.resolve", "incident.assign",
    "notice.read", "notice.publish", "notice.create", "notice.edit",
    "notice.read_receipts",
    "gps.read", "avls.view", "avls.history",
    "reporting.read",
  ],
  [ROLES.DEPOT_MANAGER]: [
    "vehicle.read", "vehicle.write",
    "route.read", "route.write",
    "stop.read", "stop.write",
    "duty.read", "duty.assign", "duty.write", "duty.publish",
    "incident.read", "incident.write", "incident.resolve", "incident.assign",
    "notice.read",
    "avls.view",
    "reporting.read",
  ],
  [ROLES.DRIVER]: [
    "vehicle.read",
    "route.read",
    "duty.read", "duty.acknowledge",
    "incident.read", "incident.write", "incident.panic",
    "notice.read", "notice.acknowledge",
  ],
  [ROLES.CONDUCTOR]: [
    "vehicle.read",
    "route.read",
    "duty.read",
    "incident.read", "incident.write",
    "notice.read", "notice.acknowledge",
  ],
  [ROLES.EXECUTIVE]: [
    "vehicle.read",
    "route.read",
    "duty.read",
    "incident.read",
    "notice.read", "notice.publish", "notice.create", "notice.edit",
    "notice.read_receipts",
    "reporting.read",
  ],
}

export function hasPermission(role: SystemRole, permission: string): boolean {
  const perms = PERMISSION_MAP[role]
  if (!perms) return false
  if (perms.includes("*")) return true
  return perms.includes(permission)
}

export function requirePermission(role: SystemRole, permission: string): void {
  if (!hasPermission(role, permission)) {
    throw new PermissionDeniedError(permission)
  }
}

export function isDepotScoped(role: SystemRole): boolean {
  return DEPOT_SCOPED_ROLES.includes(role)
}

export function canAccessDepot(userRole: SystemRole, userDepotId: string | null | undefined, targetDepotId: string): boolean {
  if (!isDepotScoped(userRole)) return true
  return userDepotId === targetDepotId
}

export class PermissionDeniedError extends Error {
  public readonly code = "PERMISSION_DENIED"
  constructor(permission: string) {
    super(`Missing required permission: ${permission}`)
    this.name = "PermissionDeniedError"
  }
}
