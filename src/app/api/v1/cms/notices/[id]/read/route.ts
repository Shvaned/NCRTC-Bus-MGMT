import { NextRequest, NextResponse } from "next/server"
import { noticeService } from "@/modules/cms/services/notice.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { getAuthUser, unauthorized } from "@/modules/cms/api/session"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    await noticeService.markRead(id, user.id)
    return NextResponse.json(successResponse(null, "Notice marked as read"))
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to mark read"), { status: 500 })
  }
}
