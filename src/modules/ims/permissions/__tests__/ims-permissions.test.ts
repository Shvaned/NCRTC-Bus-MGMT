import { describe, it, expect } from "vitest"
import { canCreateIncident, canAssignIncident, canResolveIncident, canPanic, requireAssignIncident, requireResolveIncident } from "@/modules/ims/permissions"
import { ROLES } from "@/lib/constants/roles"
import { PermissionDeniedError } from "@/lib/permissions"

describe("IMS permissions", () => {
  it("driver can create incidents", () => expect(canCreateIncident(ROLES.DRIVER)).toBe(true))
  it("driver can trigger panic", () => expect(canPanic(ROLES.DRIVER)).toBe(true))
  it("driver cannot assign incidents", () => expect(canAssignIncident(ROLES.DRIVER)).toBe(false))
  it("driver cannot resolve incidents", () => expect(canResolveIncident(ROLES.DRIVER)).toBe(false))

  it("control operator can assign incidents", () => expect(canAssignIncident(ROLES.CONTROL_OPERATOR)).toBe(true))
  it("control operator can resolve incidents", () => expect(canResolveIncident(ROLES.CONTROL_OPERATOR)).toBe(true))
  it("control operator can create incidents", () => expect(canCreateIncident(ROLES.CONTROL_OPERATOR)).toBe(true))

  it("depot manager can assign incidents", () => expect(canAssignIncident(ROLES.DEPOT_MANAGER)).toBe(true))
  it("depot manager can resolve incidents", () => expect(canResolveIncident(ROLES.DEPOT_MANAGER)).toBe(true))

  it("admin can do everything", () => {
    expect(canCreateIncident(ROLES.ADMIN)).toBe(true)
    expect(canPanic(ROLES.ADMIN)).toBe(true)
    expect(canAssignIncident(ROLES.ADMIN)).toBe(true)
    expect(canResolveIncident(ROLES.ADMIN)).toBe(true)
  })

  it("conductor can create but not assign", () => {
    expect(canCreateIncident(ROLES.CONDUCTOR)).toBe(true)
    expect(canAssignIncident(ROLES.CONDUCTOR)).toBe(false)
  })

  it("conductor cannot trigger panic", () => {
    expect(canPanic(ROLES.CONDUCTOR)).toBe(false)
  })

  it("requireAssignIncident throws for driver", () => {
    expect(() => requireAssignIncident(ROLES.DRIVER)).toThrow(PermissionDeniedError)
  })

  it("requireResolveIncident does not throw for admin", () => {
    expect(() => requireResolveIncident(ROLES.ADMIN)).not.toThrow()
  })
})
