import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth-config"
import { successResponse, errorResponse } from "@/lib/utils/api-response"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", "Not authenticated"),
        { status: 401 }
      )
    }

    return NextResponse.json(
      successResponse({
        id: (session.user as Record<string, unknown>).id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as Record<string, unknown>).role,
        depotId: (session.user as Record<string, unknown>).depotId,
        organizationId: (session.user as Record<string, unknown>).organizationId,
      }, "User info retrieved")
    )
  } catch {
    return NextResponse.json(
      errorResponse("INTERNAL_ERROR", "An unexpected error occurred"),
      { status: 500 }
    )
  }
}
