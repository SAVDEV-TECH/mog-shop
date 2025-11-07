// // app/dashboard/page.tsx
// import { auth } from '@/lib/auth'
// import { redirect } from 'next/navigation'
// import { signOut } from '@/lib/auth'

// export default async function Dashboard() {
//   const session = await auth()

//   if (!session) {
//     redirect('/auth/signin')
//   }

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <nav className="bg-white shadow">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="flex justify-between h-16">
//             <div className="flex items-center">
//               <h1 className="text-xl font-semibold">Dashboard</h1>
//             </div>
//             <div className="flex items-center space-x-4">
//               <span>Welcome, {session.user?.name}</span>
//               <form
//                 action={async () => {
//                   'use server'
//                   await signOut()
//                 }}
//               >
//                 <button
//                   type="submit"
//                   className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
//                 >
//                   Sign Out
//                 </button>
//               </form>
//             </div>
//           </div>
//         </div>
//       </nav>
//       <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
//         <div className="px-4 py-6 sm:px-0">
//           <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
//             <h2 className="text-2xl font-bold mb-4">Welcome to your dashboard!</h2>
//             <p className="text-gray-600">You are logged in as: {session.user?.email}</p>
//             <p className="text-gray-600 mt-2">User ID: {session.user?.id}</p>
//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }