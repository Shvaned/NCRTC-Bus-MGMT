import { NextRequest, NextResponse } from "next/server"
import { imsService } from "@/modules/ims/services/ims.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { getAuthUser, unauthorized } from "@/modules/ims/api/session"

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const { searchParams } = request.nextUrl
    const stats = await imsService.getStats(
      user.organizationId,
      searchParams.get("depotId") ?? undefined,
    )
    return NextResponse.json(successResponse(stats))
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to get stats"), { status: 500 })
  }
}
