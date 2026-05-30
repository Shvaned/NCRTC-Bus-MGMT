import { NextRequest, NextResponse } from "next/server"
import { schedulingService } from "@/modules/scheduling/services/scheduling.service"
import { updateRouteSchema } from "@/modules/scheduling/validators"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { requireManageRoutes } from "@/modules/scheduling/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/scheduling/api/session"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { id } = await context.params
  const route = await schedulingService.getRouteDetail(id)
  if (!route) return NextResponse.json(errorResponse("NOT_FOUND", "Route not found"), { status: 404 })
  return NextResponse.json(successResponse(route))
}

export async function PATCH(
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

  const { id } = await context.params
  const body = await request.json()
  const parsed = updateRouteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input"),
      { status: 400 }
    )
  }

  try {
    const route = await schedulingService.updateRoute(id, parsed.data, user.id)
    return NextResponse.json(successResponse(route, "Route updated"))
  } catch (err) {
    return NextResponse.json(errorResponse("UPDATE_ERROR", "Failed to update route"), { status: 400 })
  }
}
