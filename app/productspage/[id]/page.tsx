import ProductDetailpage from '@/app/Component/ProductpageWraper/ProductpageWraper'
export interface Product {
  id: number
  title: string
  price: number
  description: string
  images: string[]
  rating: number
  beauty: string
}
interface PageProps{
  params:{
    id:string;
  }
}
export default async function Page({ params }: PageProps) {
  const productId = parseInt(params.id)
  
  if (isNaN(productId)) {
    return <div className="p-4 text-red-500">Invalid product ID</div>
  }

  try {
    const product = await fetchProduct(productId)
    
    if (!product) {
      return <div className="p-4 text-yellow-500">Product not found</div>
    }

    return <ProductDetailpage product={product} />
  } catch (error) {
    console.error('Error fetching product:', error)
    return <div className="p-4 text-red-500">Error loading product</div>
  }
}

// Enhanced fetch function with proper typing
async function fetchProduct(id: number): Promise<Product | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`https://dummyjson.com/products/${id}`, {
      next: { revalidate: 3600 },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json() as Product
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}