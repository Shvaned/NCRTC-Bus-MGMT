import { NextRequest, NextResponse } from "next/server"
import { avlsService } from "@/modules/avls/services/avls.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { canViewAVLS } from "@/modules/avls/permissions"
import { getAuthUser, unauthorized } from "@/modules/avls/api/session"

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  if (!canViewAVLS(user.role as Parameters<typeof canViewAVLS>[0])) {
    return NextResponse.json(errorResponse("FORBIDDEN", "Insufficient permissions"), { status: 403 })
  }

  try {
    const { searchParams } = request.nextUrl
    const stats = await avlsService.getFleetStats(
      user.organizationId,
      searchParams.get("depotId") ?? undefined,
    )
    return NextResponse.json(successResponse(stats))
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to get stats"), { status: 500 })
  }
}
