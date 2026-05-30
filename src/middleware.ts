import { NextResponse } from "next/server"
import { middlewareAuth } from "@/lib/auth/auth-middleware"

const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/api/v1/health",
]

export default middlewareAuth((req) => {
  const { pathname } = req.nextUrl

  // 1. Allow public paths — no auth required
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // 2. Allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/uploads") ||
    pathname === "/manifest.json" ||
    /\.(svg|png|ico|json|js|css|txt)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // 3. Unauthenticated users — redirect to login
  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      )
    }
    const loginUrl = new URL("/login", req.url)
    const dest = pathname !== "/" ? pathname : undefined
    if (dest) loginUrl.searchParams.set("callbackUrl", dest)
    return NextResponse.redirect(loginUrl)
  }

  // 4. Authenticated — allow
  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|uploads).*)",
  ],
}
