import { describe, it, expect } from "vitest"
import { createRouteSchema, createDutySchema, createStopSchema } from "@/modules/scheduling/validators"

describe("createStopSchema", () => {
  it("should accept valid stop", () => {
    const result = createStopSchema.safeParse({
      name: "Test Stop",
      latitude: 28.57,
      longitude: 77.32,
    })
    expect(result.success).toBe(true)
  })

  it("should reject invalid latitude", () => {
    const result = createStopSchema.safeParse({
      name: "Bad Stop",
      latitude: 100,
      longitude: 77.32,
    })
    expect(result.success).toBe(false)
  })

  it("should reject empty name", () => {
    const result = createStopSchema.safeParse({
      name: "A",
      latitude: 28.57,
      longitude: 77.32,
    })
    expect(result.success).toBe(false)
  })
})

describe("createRouteSchema", () => {
  it("should accept valid route with stops", () => {
    const result = createRouteSchema.safeParse({
      name: "Test Route",
      code: "R-TEST",
      depotId: "550e8400-e29b-41d4-a716-446655440000",
      stops: [
        { stopId: "550e8400-e29b-41d4-a716-446655440001", sequence: 1, arrivalMin: 0 },
        { stopId: "550e8400-e29b-41d4-a716-446655440002", sequence: 2, arrivalMin: 15 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("should reject route without stops", () => {
    const result = createRouteSchema.safeParse({
      name: "Empty Route",
      code: "R-EMPTY",
      stops: [],
    })
    expect(result.success).toBe(false)
  })

  it("should reject invalid code format", () => {
    const result = createRouteSchema.safeParse({
      name: "Bad Code",
      code: "lowercase",
      stops: [{ stopId: "550e8400-e29b-41d4-a716-446655440001", sequence: 1 }],
    })
    expect(result.success).toBe(false)
  })

  it("should accept valid code with dashes", () => {
    const result = createRouteSchema.safeParse({
      name: "Good Code",
      code: "R-N2A-EX",
      stops: [{ stopId: "550e8400-e29b-41d4-a716-446655440001", sequence: 1 }],
    })
    expect(result.success).toBe(true)
  })

  it("should reject short name", () => {
    const result = createRouteSchema.safeParse({
      name: "AB",
      code: "R-OK",
      stops: [{ stopId: "550e8400-e29b-41d4-a716-446655440001", sequence: 1 }],
    })
    expect(result.success).toBe(false)
  })
})

describe("createDutySchema", () => {
  const validDuty = {
    date: "2026-05-30",
    driverId: "550e8400-e29b-41d4-a716-446655440000",
    vehicleId: "550e8400-e29b-41d4-a716-446655440001",
    routeId: "550e8400-e29b-41d4-a716-446655440002",
    depotId: "550e8400-e29b-41d4-a716-446655440003",
    startTime: "2026-05-30T06:00:00.000Z",
    endTime: "2026-05-30T14:00:00.000Z",
  }

  it("should accept valid duty", () => {
    const result = createDutySchema.safeParse(validDuty)
    expect(result.success).toBe(true)
  })

  it("should reject invalid date format", () => {
    const result = createDutySchema.safeParse({ ...validDuty, date: "May 30 2026" })
    expect(result.success).toBe(false)
  })

  it("should accept duty with optional fields", () => {
    const result = createDutySchema.safeParse({
      ...validDuty,
      conductorId: "550e8400-e29b-41d4-a716-446655440004",
      notes: "Additional notes",
    })
    expect(result.success).toBe(true)
  })

  it("should accept duty with null conductor", () => {
    const result = createDutySchema.safeParse({
      ...validDuty,
      conductorId: null,
    })
    expect(result.success).toBe(true)
  })
})
