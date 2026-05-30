import { NextRequest, NextResponse } from "next/server"
import { noticeService } from "@/modules/cms/services/notice.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { canAcknowledgeNotice } from "@/modules/cms/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/cms/api/session"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  if (!canAcknowledgeNotice(user.role as Parameters<typeof canAcknowledgeNotice>[0])) {
    return forbidden()
  }

  try {
    const { id } = await context.params
    await noticeService.markAcknowledged(id, user.id)
    return NextResponse.json(successResponse(null, "Notice acknowledged"))
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to acknowledge"
    return NextResponse.json(errorResponse("ACK_ERROR", message), { status: 400 })
  }
}
