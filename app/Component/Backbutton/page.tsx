 'use client' // Only needed if you're using App Router

import { useRouter } from 'next/navigation' // For App Router (Next.js 13+)
// OR
// import { useRouter } from 'next/router' // For Pages Router (Next.js 12 and below)

export default function BackButton() {
  const router = useRouter()
  
  return (
    <button onClick={() => router.back()}>
      ← Back
    </button>
  )
}