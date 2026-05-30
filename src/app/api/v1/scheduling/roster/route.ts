import { NextRequest, NextResponse } from "next/server"
import { schedulingService } from "@/modules/scheduling/services/scheduling.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { getAuthUser, unauthorized } from "@/modules/scheduling/api/session"

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { searchParams } = request.nextUrl
  const depotId = searchParams.get("depotId")
  const weekStart = searchParams.get("weekStart")
  const weekEnd = searchParams.get("weekEnd")

  if (!depotId) return NextResponse.json(errorResponse("VALIDATION_ERROR", "depotId is required"), { status: 400 })
  if (!weekStart || !weekEnd) {
    // Default to current week
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const roster = await schedulingService.getWeeklyRoster({
      depotId,
      weekStart: monday.toISOString().split("T")[0],
      weekEnd: sunday.toISOString().split("T")[0],
    })
    return NextResponse.json(successResponse(roster))
  }

  const roster = await schedulingService.getWeeklyRoster({ depotId, weekStart, weekEnd })
  return NextResponse.json(successResponse(roster))
}
