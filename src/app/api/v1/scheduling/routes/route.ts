import { NextRequest, NextResponse } from "next/server"
import { schedulingService } from "@/modules/scheduling/services/scheduling.service"
import { createRouteSchema } from "@/modules/scheduling/validators"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { requireManageRoutes } from "@/modules/scheduling/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/scheduling/api/session"

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { searchParams } = request.nextUrl
  const page = parseInt(searchParams.get("page") ?? "1", 10)
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10))

  const result = await schedulingService.listRoutes({
    organizationId: user.organizationId,
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    depotId: searchParams.get("depotId") ?? undefined,
    page: Math.max(1, page),
    limit: Math.max(1, limit),
  })

  return NextResponse.json({ success: true, ...result })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    requireManageRoutes(user.role as Parameters<typeof requireManageRoutes>[0])
  } catch {
    return forbidden()
  }

  try {
    const body = await request.json()
    const parsed = createRouteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input"),
        { status: 400 }
      )
    }

    const route = await schedulingService.createRoute(parsed.data, user.organizationId, user.id)
    return NextResponse.json(successResponse(route, "Route created"), { status: 201 })
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to create route"), { status: 500 })
  }
}
