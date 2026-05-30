import { describe, it, expect } from "vitest"
import { canViewAVLS, canViewHistory } from "@/modules/avls/permissions"
import { ROLES } from "@/lib/constants/roles"

describe("AVLS permissions", () => {
  it("admin can view AVLS", () => expect(canViewAVLS(ROLES.ADMIN)).toBe(true))
  it("control operator can view AVLS", () => expect(canViewAVLS(ROLES.CONTROL_OPERATOR)).toBe(true))
  it("depot manager can view AVLS", () => expect(canViewAVLS(ROLES.DEPOT_MANAGER)).toBe(true))
  it("driver cannot view AVLS", () => expect(canViewAVLS(ROLES.DRIVER)).toBe(false))
  it("conductor cannot view AVLS", () => expect(canViewAVLS(ROLES.CONDUCTOR)).toBe(false))

  it("admin can view history", () => expect(canViewHistory(ROLES.ADMIN)).toBe(true))
  it("control operator can view history", () => expect(canViewHistory(ROLES.CONTROL_OPERATOR)).toBe(true))
  it("depot manager cannot view history", () => expect(canViewHistory(ROLES.DEPOT_MANAGER)).toBe(false))
  it("driver cannot view history", () => expect(canViewHistory(ROLES.DRIVER)).toBe(false))
})
