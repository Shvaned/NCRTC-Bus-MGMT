import { hasPermission } from "@/lib/permissions"
import type { SystemRole } from "@/lib/constants/roles"

export function canViewAVLS(role: SystemRole): boolean {
  return hasPermission(role, "avls.view")
}

export function canViewHistory(role: SystemRole): boolean {
  return hasPermission(role, "avls.history")
}
