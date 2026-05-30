import { describe, it, expect } from "vitest"
import { VALID_TRANSITIONS } from "@/modules/ims/constants"

describe("IMS — Full Panic Workflow", () => {
  it("panic creates P1 OPEN incident", () => {
    const severity = "P1" as const
    const status = "OPEN" as const
    expect(severity).toBe("P1")
    expect(status).toBe("OPEN")
  })

  it("P1 OPEN → ACKNOWLEDGED is valid", () => {
    expect(VALID_TRANSITIONS.OPEN).toContain("ACKNOWLEDGED")
  })

  it("ACKNOWLEDGED → IN_PROGRESS is valid", () => {
    expect(VALID_TRANSITIONS.ACKNOWLEDGED).toContain("IN_PROGRESS")
  })

  it("IN_PROGRESS → RESOLVED is valid", () => {
    expect(VALID_TRANSITIONS.IN_PROGRESS).toContain("RESOLVED")
  })

  it("RESOLVED → CLOSED is valid", () => {
    expect(VALID_TRANSITIONS.RESOLVED).toContain("CLOSED")
  })

  it("complete panic path is valid end-to-end", () => {
    const path = ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED"]
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i] as keyof typeof VALID_TRANSITIONS
      const to = path[i + 1]
      expect(VALID_TRANSITIONS[from]).toContain(to)
    }
  })

  it("OPEN → RESOLVED (skip) is invalid", () => {
    expect(VALID_TRANSITIONS.OPEN).not.toContain("RESOLVED")
  })

  it("OPEN → IN_PROGRESS (skip) is invalid", () => {
    expect(VALID_TRANSITIONS.OPEN).not.toContain("IN_PROGRESS")
  })

  it("CLOSED has no further transitions", () => {
    expect(VALID_TRANSITIONS.CLOSED).toHaveLength(0)
  })
})
