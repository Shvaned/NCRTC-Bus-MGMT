import { NextRequest, NextResponse } from "next/server"
import { noticeService } from "@/modules/cms/services/notice.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { requirePublishNotice } from "@/modules/cms/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/cms/api/session"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    requirePublishNotice(user.role as Parameters<typeof requirePublishNotice>[0])
  } catch {
    return forbidden()
  }

  try {
    const { id } = await context.params
    const notice = await noticeService.publishNotice(id, user.id)
    return NextResponse.json(successResponse(notice, "Notice published"))
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to publish notice"
    const status = message.includes("not found") ? 404 : 400
    return NextResponse.json(errorResponse("PUBLISH_ERROR", message), { status })
  }
}
