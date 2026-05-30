import { NextResponse } from "next/server"
import { schedulingService } from "@/modules/scheduling/services/scheduling.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { getAuthUser, unauthorized } from "@/modules/scheduling/api/session"

export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const duty = await schedulingService.getTodayDuty(user.id)
    if (!duty) {
      return NextResponse.json(successResponse(null, "No duty assigned for today"))
    }
    return NextResponse.json(successResponse(duty))
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to get today's duty"), { status: 500 })
  }
}
