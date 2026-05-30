import { db } from "@/lib/db"
import { hashPassword, verifyPassword } from "./password"
import { signToken, signRefreshToken } from "./token"
import type { LoginInput } from "@/lib/validations"

export async function authenticateUser(input: LoginInput) {
  const user = await db.user.findUnique({
    where: { username: input.username },
    include: { organization: true },
  })

  if (!user) return null
  if (!user.isActive) return null

  const valid = await verifyPassword(input.password, user.passwordHash)
  if (!valid) return null

  const token = signToken({
    userId: user.id,
    role: user.role,
    depotId: user.depotId,
    organizationId: user.organizationId,
  })

  const refreshToken = signRefreshToken({ userId: user.id })

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  await db.userSession.create({
    data: {
      userId: user.id,
      tokenHash: hashTokenForStorage(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  return {
    user: {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      depotId: user.depotId,
      organizationId: user.organizationId,
      employeeId: user.employeeId,
    },
    token,
    refreshToken,
  }
}

export async function createSession(userId: string, token: string, deviceInfo?: string, ipAddress?: string) {
  return db.userSession.create({
    data: {
      userId,
      tokenHash: hashTokenForStorage(token),
      deviceInfo,
      ipAddress,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })
}

export async function revokeSession(sessionId: string) {
  return db.userSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllUserSessions(userId: string) {
  return db.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

function hashTokenForStorage(token: string): string {
  const crypto = require("crypto")
  return crypto.createHash("sha256").update(token).digest("hex")
}
