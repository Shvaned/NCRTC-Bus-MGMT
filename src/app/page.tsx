import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth-config"
import { ROUTE_BY_ROLE } from "@/lib/constants/roles"
import type { SystemRole } from "@/types"

export default async function HomePage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const role = (session.user as Record<string, unknown>).role as SystemRole
  redirect(ROUTE_BY_ROLE[role] ?? "/admin")
}
