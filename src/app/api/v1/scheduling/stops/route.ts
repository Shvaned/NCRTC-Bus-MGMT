import { NextRequest, NextResponse } from "next/server"
import { schedulingService } from "@/modules/scheduling/services/scheduling.service"
import { createStopSchema } from "@/modules/scheduling/validators"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { getAuthUser, unauthorized } from "@/modules/scheduling/api/session"

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { searchParams } = request.nextUrl
  const page = parseInt(searchParams.get("page") ?? "1", 10)
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10))

  const result = await schedulingService.listStops({
    organizationId: user.organizationId,
    search: searchParams.get("search") ?? undefined,
    page: Math.max(1, page),
    limit: Math.max(1, limit),
  })

  return NextResponse.json({ success: true, ...result })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const body = await request.json()
    const parsed = createStopSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input"),
        { status: 400 }
      )
    }

    const stop = await schedulingService.createStop(parsed.data, user.organizationId, user.id)
    return NextResponse.json(successResponse(stop, "Stop created"), { status: 201 })
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to create stop"), { status: 500 })
  }
}
