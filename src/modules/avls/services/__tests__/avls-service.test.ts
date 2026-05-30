import { describe, it, expect } from "vitest"
import { avlsService } from "@/modules/avls/services/avls.service"
import { VEHICLE_STATUS_COLORS } from "@/modules/avls/constants"

describe("AVLS Service — Simulation", () => {
  it("should interpolate between two stops at any time", () => {
    const stops = [
      { latitude: 28.57, longitude: 77.32, sequence: 1 },
      { latitude: 28.65, longitude: 77.31, sequence: 2 },
    ]
    const result = avlsService.simulateVehicleMovement({ vehicleId: "v1", routeStops: stops })
    expect(result).not.toBeNull()
    expect(result!.speed).toBeGreaterThan(0)
    expect(result!.speed).toBeLessThan(60)
  })

  it("should return valid position on multi-stop route", () => {
    const stops = Array.from({ length: 15 }, (_, i) => ({
      latitude: 28.57 + i * 0.01, longitude: 77.32 + i * 0.01, sequence: i + 1,
    }))
    const result = avlsService.simulateVehicleMovement({ vehicleId: "v2", routeStops: stops })
    expect(result).not.toBeNull()
    expect(result!.latitude).toBeGreaterThan(28.5)
    expect(result!.latitude).toBeLessThan(28.8)
  })

  it("should return null for empty stop list", () => {
    const result = avlsService.simulateVehicleMovement({ vehicleId: "v1", routeStops: [] })
    expect(result).toBeNull()
  })

  it("should return null for single stop", () => {
    const result = avlsService.simulateVehicleMovement({
      vehicleId: "v1", routeStops: [{ latitude: 28.5, longitude: 77.3, sequence: 1 }],
    })
    expect(result).toBeNull()
  })

  it("should map ACTIVE to green", () => {
    expect(VEHICLE_STATUS_COLORS.ACTIVE).toBe("#22c55e")
  })

  it("should map OFFLINE to dark gray", () => {
    expect(VEHICLE_STATUS_COLORS.OFFLINE).toBe("#374151")
  })
})
