import { NextRequest, NextResponse } from "next/server"
import { imsService } from "@/modules/ims/services/ims.service"
import { createPanicSchema } from "@/modules/ims/validators"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { canPanic } from "@/modules/ims/permissions"
import { getAuthUser, unauthorized, forbidden } from "@/modules/ims/api/session"

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  if (!canPanic(user.role as Parameters<typeof canPanic>[0])) {
    return forbidden()
  }

  try {
    const body = await request.json()
    const parsed = createPanicSchema.safeParse(body)
    const inc = await imsService.createPanic(
      parsed.success ? parsed.data : {},
      user.organizationId,
      user.id
    )
    return NextResponse.json(successResponse({ id: inc.id }, "Panic incident created"), { status: 201 })
  } catch (err) {
    return NextResponse.json(errorResponse("PANIC_ERROR", "Failed to trigger panic"), { status: 500 })
  }
}
