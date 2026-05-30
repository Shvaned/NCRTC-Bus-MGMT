import { NextRequest, NextResponse } from "next/server"
import { schedulingService } from "@/modules/scheduling/services/scheduling.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { requireManageRoutes } from "@/modules/scheduling/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/scheduling/api/session"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    requireManageRoutes(user.role as Parameters<typeof requireManageRoutes>[0])
  } catch {
    return forbidden()
  }

  try {
    const { id } = await context.params
    await schedulingService.archiveRoute(id, user.id)
    return NextResponse.json(successResponse(null, "Route archived"))
  } catch (err) {
    return NextResponse.json(errorResponse("ARCHIVE_ERROR", "Failed to archive route"), { status: 400 })
  }
}
