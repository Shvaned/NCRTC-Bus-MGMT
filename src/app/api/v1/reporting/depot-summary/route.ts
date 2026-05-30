import { NextResponse } from "next/server"
import { reportingService } from "@/modules/reporting/services/reporting.service"
import { successResponse, errorResponse } from "@/lib/utils/api-response"
import { auth } from "@/lib/auth/auth-config"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json(errorResponse("UNAUTHORIZED", "Authentication required"), { status: 401 })
  const user = session.user as unknown as Record<string, unknown>

  const data = await reportingService.getDepotSummary(user.organizationId as string)
  return NextResponse.json(successResponse(data))
}
