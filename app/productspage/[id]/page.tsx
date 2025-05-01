import ProductDetailpage from "@/app/Component/ProductpageWraper/ProductpageWraper";

interface PageProps {
  params: {
    id: string;
  };
}

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  images: string[];
  rating: number;
  beauty: string;
}

async function fetchProduct(id: number): Promise<Product | null> {
  const response = await fetch(`https://dummyjson.com/products/${id}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data;
}

export default async function Page({ params }: PageProps) {
  const product = await fetchProduct(Number(params.id));

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <ProductDetailpage product={product} />
    </div>
  );
}

