import { NextResponse } from "next/server"
import { auth, signIn, signOut } from "@/lib/auth/auth-config"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { loginSchema } from "@/lib/validations"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input"),
        { status: 400 }
      )
    }

    const result = await signIn("credentials", {
      username: parsed.data.username,
      password: parsed.data.password,
      redirect: false,
    })

    if (result?.error) {
      return NextResponse.json(
        errorResponse("AUTH_FAILED", "Invalid username or password"),
        { status: 401 }
      )
    }

    return NextResponse.json(
      successResponse(null, "Login successful")
    )
  } catch {
    return NextResponse.json(
      errorResponse("INTERNAL_ERROR", "An unexpected error occurred"),
      { status: 500 }
    )
  }
}
