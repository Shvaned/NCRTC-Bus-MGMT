import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { authorize } = await import("./authorize")
        return authorize(credentials)
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>
        token.role = u.role as string
        token.depotId = u.depotId as string | null
        token.organizationId = u.organizationId as string
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
    async signIn({ user }) {
      const { onSignIn } = await import("./authorize")
      if (user.id) await onSignIn(user.id)
      return true
    },
  },
  pages: {
    signIn: "/login",
  },
})
