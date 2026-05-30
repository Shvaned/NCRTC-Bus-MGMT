import { NextRequest, NextResponse } from "next/server"
import { imsService } from "@/modules/ims/services/ims.service"
import { addNoteSchema } from "@/modules/ims/validators"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { getAuthUser, unauthorized } from "@/modules/ims/api/session"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const body = await request.json()
    const parsed = addNoteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input"),
        { status: 400 }
      )
    }

    await imsService.addNote(id, parsed.data.note, user.id)
    return NextResponse.json(successResponse(null, "Note added"))
  } catch (err) {
    return NextResponse.json(errorResponse("INTERNAL_ERROR", "Failed to add note"), { status: 500 })
  }
}
