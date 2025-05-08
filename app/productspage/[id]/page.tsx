import ProductDetailpage from "@/app/Component/ProductpageWraper/ProductpageWraper";

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  images: string[];
  rating: number;
  beauty: string;
}

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  // Validate the ID parameter
  const productId = Number(params.id);
  if (isNaN(productId)) {
    return <div>Invalid product ID</div>;
  }

  try {
    const product = await fetchProduct(productId);
    
    if (!product) {
      return <div>Product not found</div>;
    }

    return <ProductDetailpage product={product} />;
  } catch (error) {
    console.error('Error fetching product:', error);
    return <div>Error loading product</div>;
  }
}

async function fetchProduct(id: number): Promise<Product | null> {
  try {
    const response = await fetch(`https://dummyjson.com/products/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}