import { NextRequest, NextResponse } from "next/server"
import { imsService, InvalidTransitionError } from "@/modules/ims/services/ims.service"
import { statusTransitionSchema } from "@/modules/ims/validators"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { canResolveIncident } from "@/modules/ims/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/ims/api/session"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  if (!canResolveIncident(user.role as Parameters<typeof canResolveIncident>[0])) {
    return forbidden()
  }

  try {
    const { id } = await context.params
    const body = await request.json()
    const parsed = statusTransitionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input"),
        { status: 400 }
      )
    }

    await imsService.transitionStatus(id, parsed.data.status, parsed.data.note, user.id)
    return NextResponse.json(successResponse(null, `Status updated to ${parsed.data.status}`))
  } catch (err) {
    if (err instanceof InvalidTransitionError) {
      return NextResponse.json(errorResponse("INVALID_TRANSITION", err.message), { status: 400 })
    }
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to update status"), { status: 500 })
  }
}
