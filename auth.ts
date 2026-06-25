import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

const MOCK_USER = { id: "1", name: "Admin", email: "admin@crm.com" }

export function validateCredentials(
  email: unknown,
  password: unknown
): typeof MOCK_USER | null {
  if (email === "admin@crm.com" && password === "admin123") return MOCK_USER
  return null
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize(credentials) {
        return validateCredentials(credentials?.email, credentials?.password)
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
})
