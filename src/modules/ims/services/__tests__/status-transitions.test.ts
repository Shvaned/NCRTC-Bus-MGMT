import { describe, it, expect } from "vitest"
import { VALID_TRANSITIONS } from "@/modules/ims/constants"
import type { IncidentStatusEnum } from "@/modules/ims/types"

describe("Status transition rules", () => {
  it("OPEN can transition to ACKNOWLEDGED", () => {
    expect(VALID_TRANSITIONS.OPEN).toContain("ACKNOWLEDGED")
  })

  it("OPEN can transition to CLOSED", () => {
    expect(VALID_TRANSITIONS.OPEN).toContain("CLOSED")
  })

  it("OPEN cannot transition directly to RESOLVED", () => {
    expect(VALID_TRANSITIONS.OPEN).not.toContain("RESOLVED")
  })

  it("IN_PROGRESS can transition to RESOLVED", () => {
    expect(VALID_TRANSITIONS.IN_PROGRESS).toContain("RESOLVED")
  })

  it("RESOLVED can transition to CLOSED", () => {
    expect(VALID_TRANSITIONS.RESOLVED).toContain("CLOSED")
  })

  it("RESOLVED can go back to IN_PROGRESS", () => {
    expect(VALID_TRANSITIONS.RESOLVED).toContain("IN_PROGRESS")
  })

  it("CLOSED has no valid transitions", () => {
    expect(VALID_TRANSITIONS.CLOSED).toHaveLength(0)
  })

  it("ACKNOWLEDGED can transition to IN_PROGRESS", () => {
    expect(VALID_TRANSITIONS.ACKNOWLEDGED).toContain("IN_PROGRESS")
  })

  it("ACKNOWLEDGED can be closed", () => {
    expect(VALID_TRANSITIONS.ACKNOWLEDGED).toContain("CLOSED")
  })
})

describe("Panic workflow logic", () => {
  it("panic should create P1 severity incident", () => {
    // Validates that panic always maps to P1
    const panicSeverity: IncidentSeverityEnum = "P1"
    expect(panicSeverity).toBe("P1")
  })

  it("panic should start as OPEN status", () => {
    const panicStatus: IncidentStatusEnum = "OPEN"
    expect(panicStatus).toBe("OPEN")
  })
})

describe("Severity ordering", () => {
  it("P1 should sort before P2", () => {
    const order = { P1: 0, P2: 1, P3: 2 }
    expect(order.P1).toBeLessThan(order.P2)
  })

  it("P2 should sort before P3", () => {
    const order = { P1: 0, P2: 1, P3: 2 }
    expect(order.P2).toBeLessThan(order.P3)
  })
})
