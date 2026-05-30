import { NextRequest, NextResponse } from "next/server"
import { noticeService } from "@/modules/cms/services/notice.service"
import { createNoticeSchema, noticeListParamsSchema } from "@/modules/cms/validators"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { requireCreateNotice } from "@/modules/cms/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/cms/api/session"

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const { searchParams } = request.nextUrl
    const params = noticeListParamsSchema.parse(Object.fromEntries(searchParams))

    const result = await noticeService.listNotices({
      organizationId: user.organizationId,
      status: params.status,
      search: params.search,
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      order: params.order,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to list notices"), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    requireCreateNotice(user.role as Parameters<typeof requireCreateNotice>[0])
  } catch {
    return forbidden()
  }

  try {
    const body = await request.json()
    const parsed = createNoticeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input"),
        { status: 400 }
      )
    }

    const notice = await noticeService.createNotice(parsed.data, user.organizationId, user.id)
    return NextResponse.json(successResponse(notice, "Notice created"), { status: 201 })
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to create notice"), { status: 500 })
  }
}
