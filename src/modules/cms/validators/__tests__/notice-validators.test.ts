import { describe, it, expect } from "vitest"
import { createNoticeSchema, updateNoticeSchema, noticeListParamsSchema } from "@/modules/cms/validators"

describe("createNoticeSchema", () => {
  it("should accept valid ALL_DRIVERS notice", () => {
    const result = createNoticeSchema.safeParse({
      title: "Test Notice",
      content: "This is a test notice",
      audience: { type: "ALL_DRIVERS" },
      requiresAck: true,
    })
    expect(result.success).toBe(true)
  })

  it("should accept valid DEPOT notice", () => {
    const result = createNoticeSchema.safeParse({
      title: "Depot Notice",
      content: "Depot-specific notice content",
      audience: { type: "DEPOT", depotIds: ["550e8400-e29b-41d4-a716-446655440000"] },
    })
    expect(result.success).toBe(true)
  })

  it("should accept valid ROLE notice", () => {
    const result = createNoticeSchema.safeParse({
      title: "Role Notice",
      content: "For drivers only",
      audience: { type: "ROLE", role: "driver" },
    })
    expect(result.success).toBe(true)
  })

  it("should reject empty title", () => {
    const result = createNoticeSchema.safeParse({
      title: "ab",
      content: "Some content",
      audience: { type: "ALL_DRIVERS" },
    })
    expect(result.success).toBe(false)
  })

  it("should reject empty content", () => {
    const result = createNoticeSchema.safeParse({
      title: "Valid Title",
      content: "",
      audience: { type: "ALL_DRIVERS" },
    })
    expect(result.success).toBe(false)
  })

  it("should reject DEPOT audience without depotIds", () => {
    const result = createNoticeSchema.safeParse({
      title: "Missing Depot IDs",
      content: "Content here",
      audience: { type: "DEPOT", depotIds: [] },
    })
    expect(result.success).toBe(false)
  })

  it("should reject invalid audience type", () => {
    const result = createNoticeSchema.safeParse({
      title: "Bad Audience",
      content: "Content",
      audience: { type: "INVALID_TYPE" },
    })
    expect(result.success).toBe(false)
  })
})

describe("updateNoticeSchema", () => {
  it("should accept partial update", () => {
    const result = updateNoticeSchema.safeParse({ title: "Updated Title" })
    expect(result.success).toBe(true)
  })

  it("should accept empty object", () => {
    const result = updateNoticeSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe("noticeListParamsSchema", () => {
  it("should provide defaults", () => {
    const result = noticeListParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
      expect(result.data.sort).toBe("createdAt")
      expect(result.data.order).toBe("desc")
    }
  })

  it("should parse status filter", () => {
    const result = noticeListParamsSchema.safeParse({ status: "PUBLISHED" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe("PUBLISHED")
    }
  })
})
