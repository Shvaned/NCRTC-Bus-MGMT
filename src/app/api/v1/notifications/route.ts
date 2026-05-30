import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { auth } from "@/lib/auth/auth-config"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(errorResponse("UNAUTHORIZED", "Authentication required"), { status: 401 })
  const userId = (session.user as unknown as Record<string, unknown>).id as string

  const { searchParams } = request.nextUrl
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)))

  const [data, total] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.notification.count({ where: { userId } }),
  ])

  return NextResponse.json({
    success: true,
    data: data.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      actionUrl: n.actionUrl,
      createdAt: n.createdAt.toISOString(),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function PATCH() {
  const session = await auth()
  if (!session?.user) return NextResponse.json(errorResponse("UNAUTHORIZED", "Authentication required"), { status: 401 })
  const userId = (session.user as unknown as Record<string, unknown>).id as string

  await db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })

  return NextResponse.json(successResponse(null, "All notifications marked as read"))
}
