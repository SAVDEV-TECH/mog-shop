'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  
  return (
    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
      ← Back
    </button>
  )
}
