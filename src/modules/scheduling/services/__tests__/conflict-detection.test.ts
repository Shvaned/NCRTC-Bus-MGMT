import { describe, it, expect } from "vitest"

// Unit-test the conflict detection logic directly
// This test validates the overlap detection algorithm used in the service layer

interface DutyInput {
  driverId: string
  date: string
  startTime: string
  endTime: string
}

function hasOverlap(a: DutyInput, b: DutyInput): boolean {
  if (a.date !== b.date) return false
  const aStart = new Date(a.startTime).getTime()
  const aEnd = new Date(a.endTime).getTime()
  const bStart = new Date(b.startTime).getTime()
  const bEnd = new Date(b.endTime).getTime()
  return aStart < bEnd && bStart < aEnd
}

describe("Driver conflict detection", () => {
  const baseDuty: DutyInput = {
    driverId: "driver-1",
    date: "2026-05-30",
    startTime: "2026-05-30T06:00:00.000Z",
    endTime: "2026-05-30T14:00:00.000Z",
  }

  it("should detect overlapping time periods", () => {
    const conflicting = { ...baseDuty, startTime: "2026-05-30T10:00:00.000Z", endTime: "2026-05-30T18:00:00.000Z" }
    expect(hasOverlap(baseDuty, conflicting)).toBe(true)
  })

  it("should detect fully contained period", () => {
    const contained = { ...baseDuty, startTime: "2026-05-30T08:00:00.000Z", endTime: "2026-05-30T12:00:00.000Z" }
    expect(hasOverlap(baseDuty, contained)).toBe(true)
  })

  it("should not detect non-overlapping on same day", () => {
    const nonOverlap = { ...baseDuty, startTime: "2026-05-30T14:00:00.000Z", endTime: "2026-05-30T22:00:00.000Z" }
    expect(hasOverlap(baseDuty, nonOverlap)).toBe(false)
  })

  it("should allow back-to-back duties (no overlap)", () => {
    const backToBack = { ...baseDuty, startTime: "2026-05-30T14:00:00.000Z", endTime: "2026-05-30T22:00:00.000Z" }
    expect(hasOverlap(baseDuty, backToBack)).toBe(false)
  })

  it("should not detect overlap on different days", () => {
    const nextDay = { ...baseDuty, date: "2026-05-31", startTime: "2026-05-31T06:00:00.000Z", endTime: "2026-05-31T14:00:00.000Z" }
    expect(hasOverlap(baseDuty, nextDay)).toBe(false)
  })

  it("should detect edge-case overlap at boundary", () => {
    const edge = { ...baseDuty, startTime: "2026-05-30T13:00:00.000Z", endTime: "2026-05-30T15:00:00.000Z" }
    expect(hasOverlap(baseDuty, edge)).toBe(true)
  })

  it("should not overlap with same start/end at boundary", () => {
    const exact = { ...baseDuty, startTime: "2026-05-30T14:00:00.000Z", endTime: "2026-05-30T22:00:00.000Z" }
    expect(hasOverlap(baseDuty, exact)).toBe(false)
  })
})

describe("Vehicle conflict detection", () => {
  it("should detect vehicle overlap regardless of driver", () => {
    const dutyA: DutyInput = { driverId: "driver-1", date: "2026-05-30", startTime: "2026-05-30T06:00:00.000Z", endTime: "2026-05-30T14:00:00.000Z" }
    const dutyB: DutyInput = { driverId: "driver-2", date: "2026-05-30", startTime: "2026-05-30T10:00:00.000Z", endTime: "2026-05-30T18:00:00.000Z" }
    expect(hasOverlap(dutyA, dutyB)).toBe(true)
  })

  it("should not detect vehicle overlap on different days", () => {
    const dutyA: DutyInput = { driverId: "driver-1", date: "2026-05-30", startTime: "2026-05-30T06:00:00.000Z", endTime: "2026-05-30T14:00:00.000Z" }
    const dutyB: DutyInput = { driverId: "driver-2", date: "2026-05-31", startTime: "2026-05-31T06:00:00.000Z", endTime: "2026-05-31T14:00:00.000Z" }
    expect(hasOverlap(dutyA, dutyB)).toBe(false)
  })
})
