import ProductDetailpage from '@/components/ProductPageWrapper'
import { notFound } from 'next/navigation'
import { getAllProducts, getProductBySlug } from '@/lib/products'

interface PageProps {
  params: Promise<{ slug: string }>
}

// ✅ Static params generation for better performance
export async function generateStaticParams() {
  try {
    const products = await getAllProducts()
    return products.map((p) => ({ slug: p.slug }))
  } catch (err) {
    console.error('Error generating static params:', err)
    return []
  }
}

// ✅ Page component
export default async function Page({ params }: PageProps) {
  try {
    const { slug } = await params;
    if (!slug) notFound();

    const product = await getProductBySlug(slug);
    if (!product) notFound();

    return <ProductDetailpage product={product as any} />;
  } catch (err) {
    console.error("Fetch error:", err);
    notFound();
  }
}
