import { auth } from "@/lib/auth/auth-config"
import { errorResponse } from "@/lib/utils/api-response"
import { NextResponse } from "next/server"

export async function getAuthUser() {
  const session = await auth()
  if (!session?.user) return null
  const u = session.user as unknown as Record<string, unknown>
  return {
    id: u.id as string,
    name: session.user.name ?? "",
    role: u.role as string,
    depotId: u.depotId as string | null,
    organizationId: u.organizationId as string,
  }
}

export function unauthorized() {
  return NextResponse.json(errorResponse("UNAUTHORIZED", "Authentication required"), { status: 401 })
}

export function forbidden() {
  return NextResponse.json(errorResponse("FORBIDDEN", "Insufficient permissions"), { status: 403 })
}
