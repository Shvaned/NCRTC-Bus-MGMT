export const ROLES = {
  ADMIN: "admin",
  CONTROL_OPERATOR: "control_operator",
  DEPOT_MANAGER: "depot_manager",
  DRIVER: "driver",
  CONDUCTOR: "conductor",
  EXECUTIVE: "executive",
} as const

export type SystemRole = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<SystemRole, string> = {
  admin: "Administrator",
  control_operator: "Control Operator",
  depot_manager: "Depot Manager",
  driver: "Driver",
  conductor: "Conductor",
  executive: "Executive",
}

export const ROUTE_BY_ROLE: Record<SystemRole, string> = {
  admin: "/admin",
  control_operator: "/control-room",
  depot_manager: "/depot",
  driver: "/driver",
  conductor: "/driver",
  executive: "/executive",
}

export const DEPOT_SCOPED_ROLES: SystemRole[] = ["depot_manager", "driver", "conductor"]
export const ALL_ACCESS_ROLES: SystemRole[] = ["admin", "control_operator", "executive"]
