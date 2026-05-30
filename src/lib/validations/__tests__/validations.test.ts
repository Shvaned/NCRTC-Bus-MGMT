import { describe, it, expect } from "vitest"
import { loginSchema, paginationSchema, uuidSchema, vehicleCreateSchema } from "@/lib/validations"

describe("loginSchema", () => {
  it("should accept valid input", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "password123" })
    expect(result.success).toBe(true)
  })

  it("should reject empty username", () => {
    const result = loginSchema.safeParse({ username: "a", password: "password123" })
    expect(result.success).toBe(false)
  })

  it("should reject short password", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "12345" })
    expect(result.success).toBe(false)
  })
})

describe("paginationSchema", () => {
  it("should provide defaults", () => {
    const result = paginationSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it("should parse string inputs", () => {
    const result = paginationSchema.safeParse({ page: "3", limit: "10" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.limit).toBe(10)
    }
  })
})

describe("uuidSchema", () => {
  it("should accept valid UUID", () => {
    const result = uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000")
    expect(result.success).toBe(true)
  })

  it("should reject invalid UUID", () => {
    const result = uuidSchema.safeParse("not-a-uuid")
    expect(result.success).toBe(false)
  })
})

describe("vehicleCreateSchema", () => {
  it("should accept valid vehicle data", () => {
    const result = vehicleCreateSchema.safeParse({
      registrationNumber: "DL01C1234",
      vehicleType: "Electric Bus",
      depotId: "550e8400-e29b-41d4-a716-446655440000",
    })
    expect(result.success).toBe(true)
  })

  it("should reject missing depotId", () => {
    const result = vehicleCreateSchema.safeParse({
      registrationNumber: "DL01C1234",
      vehicleType: "Electric Bus",
    })
    expect(result.success).toBe(false)
  })
})
