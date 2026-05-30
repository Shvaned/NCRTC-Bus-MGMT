import { describe, it, expect } from "vitest"
import { hasPermission, requirePermission, PermissionDeniedError, isDepotScoped, canAccessDepot } from "@/lib/permissions"
import { ROLES } from "@/lib/constants/roles"

describe("Permission checks", () => {
  it("should grant * to admin", () => {
    expect(hasPermission(ROLES.ADMIN, "vehicle.read")).toBe(true)
    expect(hasPermission(ROLES.ADMIN, "any.random.permission")).toBe(true)
  })

  it("should grant vehicle.read to control operator", () => {
    expect(hasPermission(ROLES.CONTROL_OPERATOR, "vehicle.read")).toBe(true)
  })

  it("should deny admin permission to driver", () => {
    expect(hasPermission(ROLES.DRIVER, "vehicle.write")).toBe(false)
  })

  it("should grant vehicle.read to driver", () => {
    expect(hasPermission(ROLES.DRIVER, "vehicle.read")).toBe(true)
  })

  it("should grant notice.publish to executive", () => {
    expect(hasPermission(ROLES.EXECUTIVE, "notice.publish")).toBe(true)
  })

  it("should deny notice.publish to conductor", () => {
    expect(hasPermission(ROLES.CONDUCTOR, "notice.publish")).toBe(false)
  })

  it("should throw PermissionDeniedError on missing permission", () => {
    expect(() => requirePermission(ROLES.DRIVER, "vehicle.write")).toThrow(PermissionDeniedError)
  })

  it("should not throw when permission is granted", () => {
    expect(() => requirePermission(ROLES.ADMIN, "anything")).not.toThrow()
  })
})

describe("Depot scoping", () => {
  it("should identify depot-scoped roles", () => {
    expect(isDepotScoped(ROLES.DEPOT_MANAGER)).toBe(true)
    expect(isDepotScoped(ROLES.DRIVER)).toBe(true)
    expect(isDepotScoped(ROLES.CONDUCTOR)).toBe(true)
  })

  it("should identify non-depot-scoped roles", () => {
    expect(isDepotScoped(ROLES.ADMIN)).toBe(false)
    expect(isDepotScoped(ROLES.CONTROL_OPERATOR)).toBe(false)
    expect(isDepotScoped(ROLES.EXECUTIVE)).toBe(false)
  })

  it("should allow depot manager to access own depot", () => {
    expect(canAccessDepot(ROLES.DEPOT_MANAGER, "depot-1", "depot-1")).toBe(true)
  })

  it("should deny depot manager access to other depot", () => {
    expect(canAccessDepot(ROLES.DEPOT_MANAGER, "depot-1", "depot-2")).toBe(false)
  })

  it("should allow admin access to any depot", () => {
    expect(canAccessDepot(ROLES.ADMIN, null, "depot-2")).toBe(true)
  })
})
