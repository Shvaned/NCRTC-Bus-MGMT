import { NextRequest, NextResponse } from "next/server"
import { schedulingService, ConflictError } from "@/modules/scheduling/services/scheduling.service"
import { updateDutySchema } from "@/modules/scheduling/validators"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { requireWriteDuty } from "@/modules/scheduling/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/scheduling/api/session"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    requireWriteDuty(user.role as Parameters<typeof requireWriteDuty>[0])
  } catch {
    return forbidden()
  }

  try {
    const { id } = await context.params
    const body = await request.json()
    const parsed = updateDutySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input"),
        { status: 400 }
      )
    }

    const duty = await schedulingService.updateDuty(id, parsed.data, user.id)
    return NextResponse.json(successResponse(duty, "Duty updated"))
  } catch (err) {
    if (err instanceof ConflictError) {
      return NextResponse.json(errorResponse("CONFLICT", err.message), { status: 409 })
    }
    const message = err instanceof Error ? err.message : "Failed to update duty"
    return NextResponse.json(errorResponse("UPDATE_ERROR", message), { status: 400 })
  }
}
