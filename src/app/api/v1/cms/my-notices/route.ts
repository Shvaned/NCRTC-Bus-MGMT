import { NextRequest, NextResponse } from "next/server"
import { noticeService } from "@/modules/cms/services/notice.service"
import { noticeListParamsSchema } from "@/modules/cms/validators"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { getAuthUser, unauthorized } from "@/modules/cms/api/session"

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get("page") ?? "1", 10)
    const limit = parseInt(searchParams.get("limit") ?? "20", 10)

    const result = await noticeService.getMyNotices({
      userId: user.id,
      userRole: user.role,
      depotId: user.depotId,
      organizationId: user.organizationId,
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to get notices"), { status: 500 })
  }
}
