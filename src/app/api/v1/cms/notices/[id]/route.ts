import { NextRequest, NextResponse } from "next/server"
import { noticeService } from "@/modules/cms/services/notice.service"
import { updateNoticeSchema } from "@/modules/cms/validators"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { requireEditNotice } from "@/modules/cms/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/cms/api/session"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const notice = await noticeService.getNoticeDetail(id)
    if (!notice) {
      return NextResponse.json(errorResponse("NOT_FOUND", "Notice not found"), { status: 404 })
    }
    return NextResponse.json(successResponse(notice))
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to get notice"), { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    requireEditNotice(user.role as Parameters<typeof requireEditNotice>[0])
  } catch {
    return forbidden()
  }

  try {
    const { id } = await context.params
    const body = await request.json()
    const parsed = updateNoticeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input"),
        { status: 400 }
      )
    }

    const notice = await noticeService.updateNotice(id, parsed.data, user.id)
    return NextResponse.json(successResponse(notice, "Notice updated"))
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update notice"
    const status = message.includes("not found") ? 404 : message.includes("Only draft") ? 400 : 500
    return NextResponse.json(errorResponse("UPDATE_ERROR", message), { status })
  }
}
