// // app/api/auth/signup/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'
// import bcrypt from 'bcryptjs' 

// export async function POST(request: NextRequest) {
//   try {
//     const { email, password, name } = await request.json()

//     if (!email || !password || !name) {
//       return NextResponse.json(
//         { error: 'Missing required fields' },
//         { status: 400 }
//       )
//     }

//     // Check if user exists
//     const existingUser = await prisma.user.findUnique({
//       where: { email }
//     })

//     if (existingUser) {
//       return NextResponse.json(
//         { error: 'User already exists' },
//         { status: 400 }
//       )
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 12)

//     // Create user
//     const user = await prisma.user.create({
//       data: {
//         email,
//         name,
//         password: hashedPassword
//       }
//     })

//     // Remove password from response
//     const { password: _password, ...userWithoutPassword } = user

//     return NextResponse.json(
//       { user: userWithoutPassword }, 
//       { status: 201 }
//     )
//   } catch (error) {
//     console.error('Signup error:', error)
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }