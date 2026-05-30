import { NextResponse } from "next/server"
import { noticeService } from "@/modules/cms/services/notice.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { getAuthUser, unauthorized } from "@/modules/cms/api/session"

export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const count = await noticeService.getUnreadCount(
      user.id,
      user.role,
      user.depotId,
      user.organizationId
    )
    return NextResponse.json(successResponse({ count }))
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to get unread count"), { status: 500 })
  }
}
