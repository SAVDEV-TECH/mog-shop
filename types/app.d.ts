 // types/app.d.ts
import 'next'

declare module 'next' {
  export interface PageProps {
    params: {
      id: string  // Specific to your product route
      // Add other dynamic route params here if needed
    }
    searchParams?: Record<string, string | string[]>
  }

  // Optional: Extend the Product interface if used globally
  export interface Product {
    id: number
    title: string
    price: number
    description: string
    images: string[]
    rating: number
    beauty: string
  }
}