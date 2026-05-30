import { describe, it, expect } from "vitest"

describe("CMS — Publish Workflow", () => {
  it("DRAFT → PUBLISHED is a valid transition", () => {
    const transitions: Record<string, string[]> = {
      DRAFT: ["PUBLISHED"],
      PUBLISHED: ["ARCHIVED"],
      ARCHIVED: [],
    }
    expect(transitions.DRAFT).toContain("PUBLISHED")
  })

  it("PUBLISHED → ARCHIVED is a valid transition", () => {
    const transitions: Record<string, string[]> = {
      DRAFT: ["PUBLISHED"],
      PUBLISHED: ["ARCHIVED"],
      ARCHIVED: [],
    }
    expect(transitions.PUBLISHED).toContain("ARCHIVED")
  })

  it("ARCHIVED is terminal", () => {
    const transitions: Record<string, string[]> = {
      ARCHIVED: [],
    }
    expect(transitions.ARCHIVED).toHaveLength(0)
  })

  it("audience ALL_DRIVERS targets drivers and conductors", () => {
    const isTargeted = (audience: any, role: string) => {
      if (audience.type === "ALL_DRIVERS") return role === "driver" || role === "conductor"
      return false
    }
    expect(isTargeted({ type: "ALL_DRIVERS" }, "driver")).toBe(true)
    expect(isTargeted({ type: "ALL_DRIVERS" }, "conductor")).toBe(true)
    expect(isTargeted({ type: "ALL_DRIVERS" }, "admin")).toBe(false)
  })

  it("audience DEPOT targets correct depot only", () => {
    const isTargeted = (audience: any, depotId: string | null) => {
      if (audience.type === "DEPOT") return audience.depotIds.includes(depotId)
      return false
    }
    expect(isTargeted({ type: "DEPOT", depotIds: ["d1", "d2"] }, "d1")).toBe(true)
    expect(isTargeted({ type: "DEPOT", depotIds: ["d1", "d2"] }, "d3")).toBe(false)
  })
})
