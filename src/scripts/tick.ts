import { PrismaClient } from "../../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// GPS Simulation Tick — run with: npx tsx src/scripts/tick.ts

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

function simulateVehicleMovement(routeStops: { latitude: number; longitude: number }[]): {
  latitude: number; longitude: number; speed: number; heading: number
} | null {
  if (routeStops.length < 2) return null

  const now = Date.now()
  const cycleMs = 30 * 60 * 1000
  const progress = (now % cycleMs) / cycleMs

  const totalSegments = routeStops.length - 1
  const rawIndex = progress * totalSegments
  const segmentIndex = Math.floor(rawIndex)
  const segmentFraction = rawIndex - segmentIndex
  const clampedIndex = Math.min(segmentIndex, totalSegments - 1)

  const from = routeStops[clampedIndex]
  const to = routeStops[clampedIndex + 1] ?? routeStops[clampedIndex]

  const lat = from.latitude + (to.latitude - from.latitude) * segmentFraction
  const lng = from.longitude + (to.longitude - from.longitude) * segmentFraction

  const jitter = 0.0003
  const finalLat = lat + (Math.random() - 0.5) * jitter
  const finalLng = lng + (Math.random() - 0.5) * jitter

  const distToNearestStop = Math.min(segmentFraction, 1 - segmentFraction)
  const baseSpeed = 25 + Math.random() * 30
  const speed = distToNearestStop < 0.1 ? baseSpeed * 0.3 : distToNearestStop < 0.3 ? baseSpeed * 0.7 : baseSpeed

  const heading = Math.atan2(to.longitude - from.longitude, to.latitude - from.latitude) * (180 / Math.PI)

  return { latitude: finalLat, longitude: finalLng, speed: Math.round(speed), heading: Math.round(heading) }
}

async function tick() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const duties = await db.duty.findMany({
    where: {
      date: { gte: today, lt: tomorrow },
      status: { in: ["PUBLISHED", "ACKNOWLEDGED"] },
      deletedAt: null,
      vehicleId: { not: null },
      routeId: { not: null },
    },
    include: {
      route: { include: { routeStops: { include: { stop: true }, orderBy: { sequence: "asc" } } } },
    },
  })

  const activeDuties = duties.filter((d) => d.route && d.route.routeStops.length >= 2)
  let updated = 0

  for (const duty of activeDuties) {
    try {
      const stops = duty.route!.routeStops.map((rs) => ({
        latitude: Number(rs.stop.latitude),
        longitude: Number(rs.stop.longitude),
      }))

      const result = simulateVehicleMovement(stops)
      if (!result) continue

      await db.gpsPing.create({
        data: {
          vehicleId: duty.vehicleId!,
          latitude: result.latitude,
          longitude: result.longitude,
          speed: result.speed,
          heading: result.heading,
          ignition: true,
          ts: new Date(),
        },
      })

      await db.vehicle.update({
        where: { id: duty.vehicleId! },
        data: {
          currentLatitude: result.latitude,
          currentLongitude: result.longitude,
          lastPingAt: new Date(),
        },
      })

      await db.vehicleLiveState.upsert({
        where: { vehicleId: duty.vehicleId! },
        create: {
          vehicleId: duty.vehicleId!,
          status: "ACTIVE",
          speed: result.speed,
          heading: result.heading,
          ignition: true,
          driverId: duty.driverId,
          routeId: duty.routeId,
          tripStatus: "IN_PROGRESS",
          lastPingAt: new Date(),
        },
        update: {
          status: "ACTIVE",
          speed: result.speed,
          heading: result.heading,
          ignition: true,
          driverId: duty.driverId ?? undefined,
          routeId: duty.routeId ?? undefined,
          tripStatus: "IN_PROGRESS",
          lastPingAt: new Date(),
        },
      })
      updated++
    } catch {
      // Skip failed vehicle
    }
  }

  console.log(`[tick] ${new Date().toISOString()} — Updated ${updated} vehicles`)
}

async function loop() {
  console.log("[tick] GPS Simulation started — interval: 5s")
  while (true) {
    try {
      await tick()
    } catch (err) {
      console.error("[tick] Error:", err)
    }
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
}

loop().catch((err) => {
  console.error("[tick] Fatal:", err)
  process.exit(1)
})
