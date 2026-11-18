import type { Metadata } from 'next'
import ProductDetailpage from '@/components/ProductPageWrapper'
import { notFound } from 'next/navigation'
import { getAllProducts, getProductBySlug } from '@/lib/products'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = slug ? await getProductBySlug(slug) : null;
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
        url: `/p/${product.slug}`,
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