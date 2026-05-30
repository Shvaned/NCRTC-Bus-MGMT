import { NextRequest, NextResponse } from "next/server"
import { imsService } from "@/modules/ims/services/ims.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { getAuthUser, unauthorized } from "@/modules/ims/api/session"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { id } = await context.params
  const detail = await imsService.getIncidentDetail(id)
  if (!detail) return NextResponse.json(errorResponse("NOT_FOUND", "Incident not found"), { status: 404 })
  return NextResponse.json(successResponse(detail))
}
