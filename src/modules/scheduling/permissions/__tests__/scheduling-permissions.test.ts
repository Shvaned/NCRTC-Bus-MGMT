import { describe, it, expect } from "vitest"
import {
  canManageRoutes, canAssignDuties, canPublishDuties, canWriteDuties, canAcknowledgeDuty,
  requireAssignDuty, requirePublishDuty,
} from "@/modules/scheduling/permissions"
import { ROLES } from "@/lib/constants/roles"
import { PermissionDeniedError } from "@/lib/permissions"

describe("Scheduling permissions", () => {
  it("admin can manage routes", () => expect(canManageRoutes(ROLES.ADMIN)).toBe(true))
  it("admin can assign duties", () => expect(canAssignDuties(ROLES.ADMIN)).toBe(true))
  it("admin can publish duties", () => expect(canPublishDuties(ROLES.ADMIN)).toBe(true))

  it("depot manager can assign duties", () => expect(canAssignDuties(ROLES.DEPOT_MANAGER)).toBe(true))
  it("depot manager can publish duties", () => expect(canPublishDuties(ROLES.DEPOT_MANAGER)).toBe(true))
  it("depot manager can manage routes", () => expect(canManageRoutes(ROLES.DEPOT_MANAGER)).toBe(true))

  it("driver cannot assign duties", () => expect(canAssignDuties(ROLES.DRIVER)).toBe(false))
  it("driver cannot publish duties", () => expect(canPublishDuties(ROLES.DRIVER)).toBe(false))
  it("driver can acknowledge duties", () => expect(canAcknowledgeDuty(ROLES.DRIVER)).toBe(true))

  it("conductor cannot manage routes", () => expect(canManageRoutes(ROLES.CONDUCTOR)).toBe(false))
  it("conductor cannot acknowledge duties", () => expect(canAcknowledgeDuty(ROLES.CONDUCTOR)).toBe(false))

  it("executive cannot write duties", () => expect(canWriteDuties(ROLES.EXECUTIVE)).toBe(false))
  it("executive cannot assign duties", () => expect(canAssignDuties(ROLES.EXECUTIVE)).toBe(false))

  it("requireAssignDuty throws for driver", () => {
    expect(() => requireAssignDuty(ROLES.DRIVER)).toThrow(PermissionDeniedError)
  })

  it("requirePublishDuty throws for conductor", () => {
    expect(() => requirePublishDuty(ROLES.CONDUCTOR)).toThrow(PermissionDeniedError)
  })
})
