import { describe, it, expect } from "vitest"
import { hashPassword, verifyPassword } from "@/lib/auth/password"

describe("Password utils", () => {
  it("should hash a password", async () => {
    const hash = await hashPassword("test123")
    expect(hash).toBeDefined()
    expect(hash).not.toBe("test123")
  })

  it("should verify correct password", async () => {
    const hash = await hashPassword("test123")
    const valid = await verifyPassword("test123", hash)
    expect(valid).toBe(true)
  })

  it("should reject wrong password", async () => {
    const hash = await hashPassword("test123")
    const valid = await verifyPassword("wrong", hash)
    expect(valid).toBe(false)
  })
})
