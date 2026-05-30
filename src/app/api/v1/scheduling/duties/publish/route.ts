import { NextRequest, NextResponse } from "next/server"
import { schedulingService } from "@/modules/scheduling/services/scheduling.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { requirePublishDuty } from "@/modules/scheduling/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/scheduling/api/session"

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    requirePublishDuty(user.role as Parameters<typeof requirePublishDuty>[0])
  } catch {
    return forbidden()
  }

  try {
    const body = await request.json()
    const { ids, id } = body

    if (id) {
      await schedulingService.publishDuty(id, user.id)
      return NextResponse.json(successResponse(null, "Duty published"))
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
      const result = await schedulingService.publishDuties(ids, user.id)
      return NextResponse.json(successResponse(result, `${result.publishedCount} duties published`))
    }

    return NextResponse.json(errorResponse("VALIDATION_ERROR", "Provide 'id' or 'ids' array"), { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to publish"
    return NextResponse.json(errorResponse("PUBLISH_ERROR", message), { status: 400 })
  }
}
