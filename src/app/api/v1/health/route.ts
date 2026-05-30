import { NextResponse } from "next/server"
import { successResponse, errorResponse } from "@/lib/utils/api-response"

export async function GET() {
  return NextResponse.json(
    successResponse(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        environment: process.env.NODE_ENV,
      },
      "Service is operational"
    )
  )
}
