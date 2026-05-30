import { NextRequest, NextResponse } from "next/server"
import { schedulingService } from "@/modules/scheduling/services/scheduling.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { canAcknowledgeDuty } from "@/modules/scheduling/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/scheduling/api/session"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  if (!canAcknowledgeDuty(user.role as Parameters<typeof canAcknowledgeDuty>[0])) {
    return forbidden()
  }

  try {
    const { id } = await context.params
    await schedulingService.acknowledgeDuty(id, user.id)
    return NextResponse.json(successResponse(null, "Duty acknowledged"))
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to acknowledge"
    return NextResponse.json(errorResponse("ACK_ERROR", message), { status: 400 })
  }
}
