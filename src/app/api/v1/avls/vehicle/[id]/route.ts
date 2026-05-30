import { NextRequest, NextResponse } from "next/server"
import { avlsRepository } from "@/modules/avls/repositories/avls.repository"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { canViewAVLS } from "@/modules/avls/permissions"
import { getAuthUser, unauthorized } from "@/modules/avls/api/session"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  if (!canViewAVLS(user.role as Parameters<typeof canViewAVLS>[0])) {
    return NextResponse.json(errorResponse("FORBIDDEN", "Insufficient permissions"), { status: 403 })
  }

  try {
    const { id } = await context.params
    const state = await avlsRepository.getVehicleState(id)
    if (!state?.vehicle) {
      return NextResponse.json(errorResponse("NOT_FOUND", "Vehicle not found"), { status: 404 })
    }

    return NextResponse.json(successResponse({
      vehicleId: state.vehicleId,
      registrationNumber: state.vehicle.registrationNumber,
      vehicleType: state.vehicle.vehicleType,
      depotName: state.vehicle.depot?.name ?? null,
      depotId: state.vehicle.depotId,
      speed: Number(state.speed ?? 0),
      heading: Number(state.heading ?? 0),
      status: state.status,
      driverId: state.driverId,
      driverName: null,
      routeId: state.routeId,
      routeName: null,
      ignition: state.ignition,
      lastPingAt: state.lastPingAt?.toISOString() ?? null,
      tripStatus: state.tripStatus,
      latitude: Number(state.vehicle.currentLatitude ?? 0),
      longitude: Number(state.vehicle.currentLongitude ?? 0),
    }))
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to get vehicle"), { status: 500 })
  }
}
