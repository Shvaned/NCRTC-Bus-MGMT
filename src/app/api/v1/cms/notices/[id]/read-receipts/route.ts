import { NextRequest, NextResponse } from "next/server"
import { noticeService } from "@/modules/cms/services/notice.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { canViewReadReceipts } from "@/modules/cms/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/cms/api/session"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  if (!canViewReadReceipts(user.role as Parameters<typeof canViewReadReceipts>[0])) {
    return forbidden()
  }

  try {
    const { id } = await context.params
    const receipts = await noticeService.getReadReceipts(id)
    return NextResponse.json(successResponse(receipts))
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to get read receipts"), { status: 500 })
  }
}
