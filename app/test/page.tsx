// app/test/page.tsx
import { auth } from '@/lib/auth'

export default async function TestPage() {
  const session = await auth()
  
  return (
    <div>
      <h1>Auth Test</h1>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  )
}