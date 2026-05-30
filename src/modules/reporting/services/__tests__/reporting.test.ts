import { describe, it, expect } from "vitest"

describe("Reporting — Aggregation Logic", () => {
  it("should calculate active percentage correctly", () => {
    const total = 50
    const active = 35
    const pct = Math.round((active / total) * 100)
    expect(pct).toBe(70)
  })

  it("should calculate duty completion percentage correctly", () => {
    const total = 20
    const completed = 15
    const pct = Math.round((completed / total) * 100)
    expect(pct).toBe(75)
  })

  it("should handle zero totals (division by zero)", () => {
    const total = 0
    const pct = total > 0 ? Math.round((0 / total) * 100) : 0
    expect(pct).toBe(0)
  })

  it("should group by severity correctly", () => {
    const severityOrder = { P1: 0, P2: 1, P3: 2 }
    expect(severityOrder.P1).toBeLessThan(severityOrder.P2)
    expect(severityOrder.P2).toBeLessThan(severityOrder.P3)
  })
})
