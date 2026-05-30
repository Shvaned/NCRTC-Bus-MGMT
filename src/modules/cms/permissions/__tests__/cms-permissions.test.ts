import { describe, it, expect } from "vitest"
import {
  canCreateNotice,
  canEditNotice,
  canPublishNotice,
  canArchiveNotice,
  canViewReadReceipts,
  canAcknowledgeNotice,
  requireCreateNotice,
  requirePublishNotice,
} from "@/modules/cms/permissions"
import { ROLES } from "@/lib/constants/roles"
import { PermissionDeniedError } from "@/lib/permissions"

describe("CMS permissions", () => {
  it("admin can create notices", () => {
    expect(canCreateNotice(ROLES.ADMIN)).toBe(true)
  })

  it("admin can publish notices", () => {
    expect(canPublishNotice(ROLES.ADMIN)).toBe(true)
  })

  it("admin can edit notices", () => {
    expect(canEditNotice(ROLES.ADMIN)).toBe(true)
  })

  it("admin can view read receipts", () => {
    expect(canViewReadReceipts(ROLES.ADMIN)).toBe(true)
  })

  it("admin can archive notices", () => {
    expect(canArchiveNotice(ROLES.ADMIN)).toBe(true)
  })

  it("driver cannot create notices", () => {
    expect(canCreateNotice(ROLES.DRIVER)).toBe(false)
  })

  it("driver cannot publish notices", () => {
    expect(canPublishNotice(ROLES.DRIVER)).toBe(false)
  })

  it("driver can read notices", () => {
    expect(canAcknowledgeNotice(ROLES.DRIVER)).toBe(true)
  })

  it("conductor can acknowledge notices", () => {
    expect(canAcknowledgeNotice(ROLES.CONDUCTOR)).toBe(true)
  })

  it("depot manager cannot create notices", () => {
    expect(canCreateNotice(ROLES.DEPOT_MANAGER)).toBe(false)
  })

  it("depot manager cannot publish notices", () => {
    expect(canPublishNotice(ROLES.DEPOT_MANAGER)).toBe(false)
  })

  it("depot manager can read notices", () => {
    expect(canViewReadReceipts(ROLES.DEPOT_MANAGER)).toBe(false)
  })

  it("requireCreateNotice throws for driver", () => {
    expect(() => requireCreateNotice(ROLES.DRIVER)).toThrow(PermissionDeniedError)
  })

  it("requireCreateNotice does not throw for admin", () => {
    expect(() => requireCreateNotice(ROLES.ADMIN)).not.toThrow()
  })

  it("requirePublishNotice throws for conductor", () => {
    expect(() => requirePublishNotice(ROLES.CONDUCTOR)).toThrow(PermissionDeniedError)
  })

  it("control operator can create notices", () => {
    expect(canCreateNotice(ROLES.CONTROL_OPERATOR)).toBe(true)
  })

  it("control operator can publish notices", () => {
    expect(canPublishNotice(ROLES.CONTROL_OPERATOR)).toBe(true)
  })

  it("executive can create and publish notices", () => {
    expect(canCreateNotice(ROLES.EXECUTIVE)).toBe(true)
    expect(canPublishNotice(ROLES.EXECUTIVE)).toBe(true)
  })

  it("executive can view read receipts", () => {
    expect(canViewReadReceipts(ROLES.EXECUTIVE)).toBe(true)
  })
})
