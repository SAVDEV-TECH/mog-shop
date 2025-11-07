 import ProductDetailpage from '@/app/Component/ProductpageWraper/ProductpageWraper'
import { notFound } from 'next/navigation'

export interface Product {
  id: string
  name: string
  price: number
  description?: string
  imageUrl: string
  rating?: number
  category: string
}

interface PageProps {
  params: { id: string }
}

// 🔧 Shared fetch helper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? "" // ✅ fallback to relative
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  const res = await fetch(`${baseUrl}${endpoint}`, {
    next: { revalidate: 3600 },
    signal: controller.signal,
    ...options,
  })

  clearTimeout(timeoutId)

  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json() as Promise<T>
}

// ✅ Static params generation
export async function generateStaticParams() {
  try {
    const products = await apiFetch<Product[]>(`/api/products`)
    return products.map((p) => ({ id: p.id.toString() }))
  } catch (err) {
    console.error('Error generating static params:', err)
    return [] // ✅ no fake IDs
  }
}

// ✅ Page component
// export default async function Page({params}: PageProps) {
//   // Parse and validate ID
//   // const { params } = await context;
//   const productId = params.id

//   if (!(productId)) notFound()

//   let product: Product | null = null
//   try {
//     product = await apiFetch<Product>(`/api/products/${productId}`)
//   } catch (err) {
//     console.error('Fetch error:', err)
//   }

//   if (!product) notFound()

//   return <ProductDetailpage product={product} />
// }
// ...existing code...

// ✅ Page component
export default async function Page({ params }: PageProps) {
  try {
    const productId = params?.id;
    if (!productId) notFound();

    const product = await apiFetch<Product>(`/api/products/${productId}`);
    if (!product) notFound();

    return <ProductDetailpage product={product} />;
  } catch (err) {
    console.error("Fetch error:", err);
    notFound();
  }
}
