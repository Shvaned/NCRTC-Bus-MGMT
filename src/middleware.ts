import { NextResponse } from "next/server"
import { middlewareAuth } from "@/lib/auth/auth-middleware"

export default middlewareAuth((req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/api/auth") || pathname === "/api/v1/health") {
    return NextResponse.next()
  }

  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      )
    }
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
