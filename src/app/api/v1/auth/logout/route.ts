import { NextResponse } from "next/server"
import { signOut } from "@/lib/auth/auth-config"
import { successResponse, errorResponse } from "@/lib/utils/api-response"

export async function POST() {
  try {
    await signOut({ redirect: false })
    return NextResponse.json(successResponse(null, "Logged out successfully"))
  } catch {
    return NextResponse.json(
      errorResponse("INTERNAL_ERROR", "An unexpected error occurred"),
      { status: 500 }
    )
  }
}
