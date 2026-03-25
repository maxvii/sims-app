import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) { token.role = user.role; token.id = user.id }
      // When update() is called from client, refresh the token with new data
      if (trigger === 'update') {
        // Fetch fresh user data from DB to ensure accuracy
        const freshUser = await prisma.user.findUnique({ where: { id: token.id } })
        if (freshUser) {
          token.name = freshUser.name
          token.email = freshUser.email
          token.role = freshUser.role
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      session.user.id = token.id
      session.user.name = token.name
      session.user.email = token.email
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}
