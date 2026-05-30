import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
import { logger } from "@/lib/logger"
import { logAuditEvent } from "@/lib/audit"

export async function authorize(credentials: Partial<Record<"username" | "password", unknown>>) {
  if (!credentials?.username || !credentials?.password) return null

  try {
    const user = await db.user.findUnique({
      where: { username: credentials.username as string },
    })

    if (!user || !user.isActive) return null

    const valid = await verifyPassword(
      credentials.password as string,
      user.passwordHash
    )
    if (!valid) return null

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email ?? `${user.username}@ncrtc.local`,
      role: user.role,
      depotId: user.depotId,
      organizationId: user.organizationId,
    }
  } catch (err) {
    logger.error("Auth error", { error: String(err) })
    return null
  }
}

export async function onSignIn(userId: string) {
  try {
    await logAuditEvent({
      userId,
      action: "login",
      entity: "user",
      entityId: userId,
    })
  } catch { /* noop */ }
}
