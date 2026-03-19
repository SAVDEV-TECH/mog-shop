 import ProductDetailpage from '@/components/ProductPageWrapper'
import { notFound } from 'next/navigation'
import { getAllProducts, getProductById } from '@/lib/products'

interface PageProps {
  params: Promise<{ id: string }>
}

// ✅ Static params generation
export async function generateStaticParams() {
  try {
    const products = await getAllProducts()
    return products.map((p) => ({ id: p.id.toString() }))
  } catch (err) {
    console.error('Error generating static params:', err)
    return []
  }
}

// ✅ Page component
export default async function Page({ params }: PageProps) {
  try {
    const { id: productId } = await params;
    if (!productId) notFound();

    const product = await getProductById(productId);
    if (!product) notFound();

    return <ProductDetailpage product={product as any} />;
  } catch (err) {
    console.error("Fetch error:", err);
    notFound();
  }
}
