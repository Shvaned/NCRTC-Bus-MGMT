import { NextRequest, NextResponse } from "next/server"
import { schedulingService, ConflictError } from "@/modules/scheduling/services/scheduling.service"
import { createDutySchema } from "@/modules/scheduling/validators"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { requireAssignDuty, requireWriteDuty } from "@/modules/scheduling/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/scheduling/api/session"

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { searchParams } = request.nextUrl
  const page = parseInt(searchParams.get("page") ?? "1", 10)
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10))

  const result = await schedulingService.listDuties({
    organizationId: user.organizationId,
    depotId: searchParams.get("depotId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    date: searchParams.get("date") ?? undefined,
    page: Math.max(1, page),
    limit: Math.max(1, limit),
  })

  return NextResponse.json({ success: true, ...result })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    requireAssignDuty(user.role as Parameters<typeof requireAssignDuty>[0])
  } catch {
    return forbidden()
  }

  try {
    const body = await request.json()
    const parsed = createDutySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input"),
        { status: 400 }
      )
    }

    const duty = await schedulingService.createDuty(parsed.data, user.organizationId, user.id)
    return NextResponse.json(successResponse(duty, "Duty created"), { status: 201 })
  } catch (err) {
    if (err instanceof ConflictError) {
      return NextResponse.json(errorResponse("CONFLICT", err.message), { status: 409 })
    }
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to create duty"), { status: 500 })
  }
}
