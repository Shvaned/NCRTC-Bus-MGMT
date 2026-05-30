import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth-config"
import { ROUTE_BY_ROLE } from "@/lib/constants/roles"
import type { SystemRole } from "@/types"

export default async function HomePage() {
  const session = await auth()

  // Unauthenticated → let middleware handle redirect to /login
  if (!session?.user) {
    redirect("/login")
  }

  const role = (session.user as Record<string, unknown>).role as SystemRole | undefined
  const destination = ROUTE_BY_ROLE[role as SystemRole] ?? "/admin"

  // Guard: don't redirect if user is already on their dashboard
  // This prevents a loop when the middleware passes through to /
  redirect(destination)
}
