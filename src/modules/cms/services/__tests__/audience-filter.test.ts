import { describe, it, expect } from "vitest"

// Test the audience filtering logic inline (used in repository)
function isTargeted(audience: any, userRole: string, depotId: string | null): boolean {
  if (!audience) return true
  if (audience.type === "ALL_DRIVERS") {
    return userRole === "driver" || userRole === "conductor"
  }
  if (audience.type === "DEPOT") {
    return depotId !== null && (audience.depotIds ?? []).includes(depotId)
  }
  if (audience.type === "ROLE") {
    return audience.role === userRole
  }
  return true
}

describe("Audience filtering", () => {
  it("ALL_DRIVERS should target drivers", () => {
    expect(isTargeted({ type: "ALL_DRIVERS" }, "driver", null)).toBe(true)
  })

  it("ALL_DRIVERS should target conductors", () => {
    expect(isTargeted({ type: "ALL_DRIVERS" }, "conductor", null)).toBe(true)
  })

  it("ALL_DRIVERS should not target depot managers", () => {
    expect(isTargeted({ type: "ALL_DRIVERS" }, "depot_manager", null)).toBe(false)
  })

  it("ALL_DRIVERS should not target admins", () => {
    expect(isTargeted({ type: "ALL_DRIVERS" }, "admin", null)).toBe(false)
  })

  it("DEPOT should target user in matching depot", () => {
    expect(isTargeted(
      { type: "DEPOT", depotIds: ["depot-1", "depot-2"] },
      "driver",
      "depot-1"
    )).toBe(true)
  })

  it("DEPOT should not target user in non-matching depot", () => {
    expect(isTargeted(
      { type: "DEPOT", depotIds: ["depot-1", "depot-2"] },
      "driver",
      "depot-3"
    )).toBe(false)
  })

  it("DEPOT should not target user with null depot", () => {
    expect(isTargeted(
      { type: "DEPOT", depotIds: ["depot-1"] },
      "driver",
      null
    )).toBe(false)
  })

  it("ROLE should target matching role", () => {
    expect(isTargeted(
      { type: "ROLE", role: "driver" },
      "driver",
      null
    )).toBe(true)
  })

  it("ROLE should not target non-matching role", () => {
    expect(isTargeted(
      { type: "ROLE", role: "depot_manager" },
      "driver",
      null
    )).toBe(false)
  })

  it("null audience should target everyone", () => {
    expect(isTargeted(null, "admin", null)).toBe(true)
    expect(isTargeted(null, "driver", "any-depot")).toBe(true)
  })
})
