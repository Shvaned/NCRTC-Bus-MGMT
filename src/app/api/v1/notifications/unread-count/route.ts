import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { auth } from "@/lib/auth/auth-config"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json(errorResponse("UNAUTHORIZED", "Authentication required"), { status: 401 })
  const userId = (session.user as unknown as Record<string, unknown>).id as string

  const count = await db.notification.count({ where: { userId, isRead: false } })
  return NextResponse.json(successResponse({ count }))
}
