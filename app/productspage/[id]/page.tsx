import type { Metadata } from 'next'
import ProductDetailpage from '@/components/ProductPageWrapper'
import { notFound } from 'next/navigation'
import { getAllProducts, getProductById } from '@/lib/products'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const product = id ? await getProductById(id) : null;
    if (!product) {
      return { title: 'Product Not Found | Mogshops' };
    }
    const priceText = `₦${Number(product.price).toLocaleString()}`;
    const title = `${product.name} (${priceText}) — Mogshops`;
    const description =
      product.description ||
      `Buy ${product.name} for ${priceText} on Mogshops. Fast delivery across Port Harcourt & Nigeria.`;
    const images = product.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : ['/mog.png'];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `/productspage/${product.id}`,
        type: 'website',
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: product.imageUrl ? [product.imageUrl] : ['/mog.png'],
      },
    };
  } catch {
    return { title: 'Mogshops — Quality Groceries & Provisions' };
  }
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
