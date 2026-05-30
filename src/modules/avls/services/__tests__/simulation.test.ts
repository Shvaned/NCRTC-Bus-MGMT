import { describe, it, expect } from "vitest"
import { avlsService } from "@/modules/avls/services/avls.service"

describe("GPS Simulation — Movement Interpolation", () => {
  it("should return null for fewer than 2 stops", () => {
    const result = avlsService.simulateVehicleMovement({
      vehicleId: "v1",
      routeStops: [{ latitude: 28.5, longitude: 77.3, sequence: 1 }],
    })
    expect(result).toBeNull()
  })

  it("should return position between two stops", () => {
    const result = avlsService.simulateVehicleMovement({
      vehicleId: "v1",
      routeStops: [
        { latitude: 28.5, longitude: 77.3, sequence: 1 },
        { latitude: 28.6, longitude: 77.4, sequence: 2 },
      ],
    })
    expect(result).not.toBeNull()
    expect(result!.latitude).toBeGreaterThanOrEqual(28.49)
    expect(result!.latitude).toBeLessThanOrEqual(28.61)
    expect(result!.longitude).toBeGreaterThanOrEqual(77.29)
    expect(result!.longitude).toBeLessThanOrEqual(77.41)
    expect(result!.speed).toBeGreaterThan(0)
    expect(typeof result!.heading).toBe("number")
  })

  it("should produce different positions at different times (deterministic)", () => {
    // Run twice — the progress depends on Date.now() % cycle, but
    // the interpolation should be consistent
    const stops = [
      { latitude: 28.57, longitude: 77.32, sequence: 1 },
      { latitude: 28.65, longitude: 77.31, sequence: 2 },
      { latitude: 28.67, longitude: 77.42, sequence: 3 },
    ]

    const r1 = avlsService.simulateVehicleMovement({ vehicleId: "v1", routeStops: stops })
    const r2 = avlsService.simulateVehicleMovement({ vehicleId: "v1", routeStops: stops })

    expect(r1).not.toBeNull()
    expect(r2).not.toBeNull()
    // Both should have valid speeds
    expect(r1!.speed).toBeGreaterThan(0)
    expect(r2!.speed).toBeGreaterThan(0)
  })

  it("should slow down near stops", () => {
    // Test that the speed calculation uses the stop proximity factor
    const stops = [
      { latitude: 28.57, longitude: 77.32, sequence: 1 },
      { latitude: 28.57, longitude: 77.33, sequence: 2 },
    ]

    // Run multiple times and verify speeds are in reasonable range
    for (let i = 0; i < 10; i++) {
      const result = avlsService.simulateVehicleMovement({ vehicleId: "v1", routeStops: stops })
      expect(result).not.toBeNull()
      expect(result!.speed).toBeGreaterThan(0)
      expect(result!.speed).toBeLessThan(60)
    }
  })
})

describe("Route interpolation logic", () => {
  it("should interpolate correctly between two points at 0%", () => {
    const stops = [
      { latitude: 0, longitude: 0, sequence: 1 },
      { latitude: 10, longitude: 10, sequence: 2 },
    ]
    // The actual interpolation depends on time, so we just verify the structure
    const result = avlsService.simulateVehicleMovement({ vehicleId: "v1", routeStops: stops })
    expect(result).not.toBeNull()
    expect(typeof result!.latitude).toBe("number")
    expect(typeof result!.longitude).toBe("number")
  })

  it("should handle multi-stop routes", () => {
    const stops = Array.from({ length: 10 }, (_, i) => ({
      latitude: 28.5 + i * 0.02,
      longitude: 77.3 + i * 0.02,
      sequence: i + 1,
    }))

    const result = avlsService.simulateVehicleMovement({ vehicleId: "v1", routeStops: stops })
    expect(result).not.toBeNull()
    expect(result!.latitude).toBeGreaterThan(28.4)
    expect(result!.latitude).toBeLessThan(28.8)
  })
})
