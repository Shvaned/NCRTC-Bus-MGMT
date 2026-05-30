import NextAuth from "next-auth"

// Middleware-safe auth config — no Prisma imports
// Only used for session validation in middleware/Edge runtime
export const { auth: middlewareAuth } = NextAuth({
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>
        token.role = u.role
        token.depotId = u.depotId
        token.organizationId = u.organizationId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const s = session.user as unknown as Record<string, unknown>
        s.id = token.sub
        s.role = token.role
        s.depotId = token.depotId
        s.organizationId = token.organizationId
      }
      return session
    },
  },
})
