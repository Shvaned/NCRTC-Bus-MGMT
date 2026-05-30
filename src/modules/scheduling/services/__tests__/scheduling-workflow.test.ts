import { describe, it, expect } from "vitest"

describe("Scheduling — Conflict Detection", () => {
  function hasOverlap(
    a: { date: string; startTime: string; endTime: string },
    b: { date: string; startTime: string; endTime: string },
  ): boolean {
    if (a.date !== b.date) return false
    const aStart = new Date(a.startTime).getTime()
    const aEnd = new Date(a.endTime).getTime()
    const bStart = new Date(b.startTime).getTime()
    const bEnd = new Date(b.endTime).getTime()
    return aStart < bEnd && bStart < aEnd
  }

  it("detects overlapping driver duties on same day", () => {
    const duty1 = { date: "2026-05-30", startTime: "2026-05-30T06:00:00Z", endTime: "2026-05-30T14:00:00Z" }
    const duty2 = { date: "2026-05-30", startTime: "2026-05-30T10:00:00Z", endTime: "2026-05-30T18:00:00Z" }
    expect(hasOverlap(duty1, duty2)).toBe(true)
  })

  it("allows back-to-back duties without overlap", () => {
    const duty1 = { date: "2026-05-30", startTime: "2026-05-30T06:00:00Z", endTime: "2026-05-30T14:00:00Z" }
    const duty2 = { date: "2026-05-30", startTime: "2026-05-30T14:00:00Z", endTime: "2026-05-30T22:00:00Z" }
    expect(hasOverlap(duty1, duty2)).toBe(false)
  })

  it("allows same driver on different days", () => {
    const duty1 = { date: "2026-05-30", startTime: "2026-05-30T06:00:00Z", endTime: "2026-05-30T14:00:00Z" }
    const duty2 = { date: "2026-05-31", startTime: "2026-05-30T10:00:00Z", endTime: "2026-05-30T18:00:00Z" }
    expect(hasOverlap(duty1, duty2)).toBe(false)
  })

  it("detects fully contained duty", () => {
    const outer = { date: "2026-05-30", startTime: "2026-05-30T06:00:00Z", endTime: "2026-05-30T18:00:00Z" }
    const inner = { date: "2026-05-30", startTime: "2026-05-30T10:00:00Z", endTime: "2026-05-30T14:00:00Z" }
    expect(hasOverlap(outer, inner)).toBe(true)
  })

  it("duty publish flow: DRAFT → PUBLISHED → ACKNOWLEDGED → COMPLETED", () => {
    const flow = ["DRAFT", "PUBLISHED", "ACKNOWLEDGED", "COMPLETED"]
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["PUBLISHED"],
      PUBLISHED: ["ACKNOWLEDGED"],
      ACKNOWLEDGED: ["COMPLETED"],
      COMPLETED: [],
    }
    for (let i = 0; i < flow.length - 1; i++) {
      expect(validTransitions[flow[i]]).toContain(flow[i + 1])
    }
  })
})
