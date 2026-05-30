import { describe, it, expect } from "vitest"
import { createIncidentSchema, createPanicSchema, statusTransitionSchema, addNoteSchema, assignIncidentSchema } from "@/modules/ims/validators"

describe("createIncidentSchema", () => {
  it("should accept valid incident", () => {
    const result = createIncidentSchema.safeParse({
      type: "BREAKDOWN",
      severity: "P1",
      title: "Engine failure",
      description: "Bus broke down on route",
    })
    expect(result.success).toBe(true)
  })

  it("should reject empty description", () => {
    const result = createIncidentSchema.safeParse({
      type: "BREAKDOWN", severity: "P1", title: "Test", description: "",
    })
    expect(result.success).toBe(false)
  })

  it("should reject invalid type", () => {
    const result = createIncidentSchema.safeParse({
      type: "INVALID", severity: "P1", title: "Test", description: "Desc",
    })
    expect(result.success).toBe(false)
  })

  it("should reject invalid severity", () => {
    const result = createIncidentSchema.safeParse({
      type: "BREAKDOWN", severity: "P99", title: "Test", description: "Desc",
    })
    expect(result.success).toBe(false)
  })
})

describe("statusTransitionSchema", () => {
  it("should require note", () => {
    const result = statusTransitionSchema.safeParse({ status: "IN_PROGRESS" })
    expect(result.success).toBe(false)
  })

  it("should accept valid transition with note", () => {
    const result = statusTransitionSchema.safeParse({ status: "IN_PROGRESS", note: "Working on it" })
    expect(result.success).toBe(true)
  })

  it("should reject empty note", () => {
    const result = statusTransitionSchema.safeParse({ status: "IN_PROGRESS", note: "" })
    expect(result.success).toBe(false)
  })
})

describe("addNoteSchema", () => {
  it("should require non-empty note", () => {
    expect(addNoteSchema.safeParse({ note: "" }).success).toBe(false)
    expect(addNoteSchema.safeParse({ note: "Useful note" }).success).toBe(true)
  })
})

describe("assignIncidentSchema", () => {
  it("should require assignedToId", () => {
    expect(assignIncidentSchema.safeParse({}).success).toBe(false)
    expect(assignIncidentSchema.safeParse({ assignedToId: "550e8400-e29b-41d4-a716-446655440000" }).success).toBe(true)
  })
})
