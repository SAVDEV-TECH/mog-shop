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
  let slug: string | undefined;
  let product: any;

  try {
    const resolvedParams = await params;
    slug = resolvedParams.slug;
  } catch (err) {
    console.error("Params error:", err);
    notFound();
  }

  if (!slug) notFound(); // ✅ outside try/catch

  try {
    product = await getProductBySlug(slug!);
  } catch (err) {
    console.error("Fetch error:", err);
    notFound();
  }

  if (!product) notFound(); // ✅ outside try/catch

  return <ProductDetailpage product={product as any} />;
}