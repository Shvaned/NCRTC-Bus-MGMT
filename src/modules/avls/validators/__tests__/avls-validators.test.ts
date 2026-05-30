import { describe, it, expect } from "vitest"
import { historyQuerySchema, liveQuerySchema } from "@/modules/avls/validators"

describe("historyQuerySchema", () => {
  it("should accept valid query", () => {
    const result = historyQuerySchema.safeParse({
      vehicleId: "550e8400-e29b-41d4-a716-446655440000",
      date: "2026-05-30",
    })
    expect(result.success).toBe(true)
  })

  it("should reject invalid UUID", () => {
    const result = historyQuerySchema.safeParse({
      vehicleId: "not-a-uuid",
      date: "2026-05-30",
    })
    expect(result.success).toBe(false)
  })

  it("should reject invalid date format", () => {
    const result = historyQuerySchema.safeParse({
      vehicleId: "550e8400-e29b-41d4-a716-446655440000",
      date: "May 30 2026",
    })
    expect(result.success).toBe(false)
  })
})

describe("liveQuerySchema", () => {
  it("should accept empty query", () => {
    const result = liveQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("should accept optional depotId", () => {
    const result = liveQuerySchema.safeParse({
      depotId: "550e8400-e29b-41d4-a716-446655440000",
    })
    expect(result.success).toBe(true)
  })

  it("should reject invalid depotId", () => {
    const result = liveQuerySchema.safeParse({ depotId: "bad" })
    expect(result.success).toBe(false)
  })
})
