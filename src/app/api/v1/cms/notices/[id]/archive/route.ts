import { NextRequest, NextResponse } from "next/server"
import { noticeService } from "@/modules/cms/services/notice.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { canArchiveNotice } from "@/modules/cms/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/cms/api/session"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  if (!canArchiveNotice(user.role as Parameters<typeof canArchiveNotice>[0])) {
    return forbidden()
  }

  try {
    const { id } = await context.params
    const notice = await noticeService.archiveNotice(id, user.id)
    return NextResponse.json(successResponse(notice, "Notice archived"))
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to archive notice"
    return NextResponse.json(errorResponse("ARCHIVE_ERROR", message), { status: 400 })
  }
}
