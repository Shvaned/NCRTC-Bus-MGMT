import { NextRequest, NextResponse } from "next/server"
import { avlsService } from "@/modules/avls/services/avls.service"
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
    const detail = await avlsService.getVehicleDetail(id)
    if (!detail) {
      return NextResponse.json(errorResponse("NOT_FOUND", "Vehicle not found"), { status: 404 })
    }
    return NextResponse.json(successResponse(detail))
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to get vehicle"), { status: 500 })
  }
}
