//  // auth.ts
//  // auth.ts
// import NextAuth from 'next-auth'
// import CredentialsProvider from 'next-auth/providers/credentials'
// import { PrismaAdapter } from '@next-auth/prisma-adapter'
// import { prisma } from '@/lib/prisma'
// import bcrypt from 'bcryptjs'

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   adapter: PrismaAdapter(prisma),
//   session: { strategy: 'jwt' },
//   providers: [
//     CredentialsProvider({
//       name: 'credentials',
//       credentials: {
//         email: { label: 'Email', type: 'email' },
//         password: { label: 'Password', type: 'password' }
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) return null

//         try {
//           const user = await prisma.user.findUnique({
//             where: { email: credentials.email as string }
//           })

//           if (!user || !user.password) return null

//           const passwordMatch = await bcrypt.compare(
//             credentials.password as string,
//             user.password
//           )

//           if (!passwordMatch) return null

//           return {
//             id: user.id,
//             email: user.email,
//             name: user.name,
//           }
//         } catch (error) {
//           console.error('Authorization error:', error)
//           return null
//         }
//       }
//     })
//   ],
//   callbacks: {
//     authorized({ auth, request: { nextUrl } }) {
//       const isLoggedIn = !!auth?.user
//       const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      
//       if (isOnDashboard && !isLoggedIn) {
//            const redirectUrl = new URL('/login', nextUrl.origin);
//            return Response.redirect(redirectUrl);
//       }
//       return true
//     },
//     async jwt({ token, user }: any) {
//       if (user) {
//         (token as any)['id'] = (user as any)['id']
//       }
//       return token
//     },
//     async session({ session, token }: any) {
//       if (token && session.user) {
//         (session.user as any)['id'] = (token as any)['id'] as string
//       }
//       return session
//     }
//   },
//   pages: {
//     signIn: '/signin',
//   }
// })