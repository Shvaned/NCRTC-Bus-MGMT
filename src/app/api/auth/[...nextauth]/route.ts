import { handlers } from "@/lib/auth/auth-config"
import type { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return handlers.GET(request)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return handlers.POST(request)
}
