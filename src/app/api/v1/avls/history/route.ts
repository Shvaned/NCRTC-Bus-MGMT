import { NextRequest, NextResponse } from "next/server"
import { avlsService } from "@/modules/avls/services/avls.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { canViewHistory } from "@/modules/avls/permissions"
import { getAuthUser, unauthorized } from "@/modules/avls/api/session"

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  if (!canViewHistory(user.role as Parameters<typeof canViewHistory>[0])) {
    return NextResponse.json(errorResponse("FORBIDDEN", "Insufficient permissions"), { status: 403 })
  }

  try {
    const { searchParams } = request.nextUrl
    const vehicleId = searchParams.get("vehicleId")
    const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0]

    if (!vehicleId) {
      return NextResponse.json(errorResponse("VALIDATION_ERROR", "vehicleId is required"), { status: 400 })
    }

    const history = await avlsService.getVehicleHistory(vehicleId, date, user.id)
    return NextResponse.json(successResponse(history))
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to get history"), { status: 500 })
  }
}
