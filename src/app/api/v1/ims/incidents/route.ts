import { NextRequest, NextResponse } from "next/server"
import { imsService, InvalidTransitionError } from "@/modules/ims/services/ims.service"
import { createIncidentSchema, incidentListParamsSchema } from "@/modules/ims/validators"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { canCreateIncident } from "@/modules/ims/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/ims/api/session"

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { searchParams } = request.nextUrl
  const params = incidentListParamsSchema.parse(Object.fromEntries(searchParams))

  const result = await imsService.listIncidents({
    organizationId: user.organizationId,
    status: params.status, severity: params.severity, type: params.type,
    depotId: params.depotId, search: params.search, mine: params.mine,
    page: params.page, limit: params.limit, sort: params.sort, order: params.order,
  })

  return NextResponse.json({ success: true, ...result })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  if (!canCreateIncident(user.role as Parameters<typeof canCreateIncident>[0])) {
    return forbidden()
  }

  try {
    const body = await request.json()
    const parsed = createIncidentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input"),
        { status: 400 }
      )
    }

    const inc = await imsService.createIncident(parsed.data, user.organizationId, user.id)
    return NextResponse.json(successResponse(inc, "Incident created"), { status: 201 })
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to create incident"), { status: 500 })
  }
}
