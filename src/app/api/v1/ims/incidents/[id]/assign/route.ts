import { NextRequest, NextResponse } from "next/server"
import { imsService } from "@/modules/ims/services/ims.service"
import { assignIncidentSchema } from "@/modules/ims/validators"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { canAssignIncident } from "@/modules/ims/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/ims/api/session"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  if (!canAssignIncident(user.role as Parameters<typeof canAssignIncident>[0])) {
    return forbidden()
  }

  try {
    const { id } = await context.params
    const body = await request.json()
    const parsed = assignIncidentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input"),
        { status: 400 }
      )
    }

    await imsService.assignIncident(id, parsed.data.assignedToId, user.id, parsed.data.notes)
    return NextResponse.json(successResponse(null, "Incident assigned"))
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to assign incident"), { status: 500 })
  }
}
