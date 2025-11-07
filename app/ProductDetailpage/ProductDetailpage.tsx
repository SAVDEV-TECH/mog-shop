 // Client Component (ProductDetailsPage.tsx)
"use client"
import Image from "next/image";
import { useCart } from "../Component/ContextCart/page";

interface Product {
  id: string;
  name: string;        // Changed from title
  price: number;
  rating?: number;     // Made optional
  category: string;    // Changed from beauty
  imageUrl: string;    // Changed from images
}

interface ProductDetailsPageProps {
  product: Product;
}

export default function ProductDetailsPage({ product }: ProductDetailsPageProps) {
  console.log("Product data:", product);
  console.log("Image URL:", product?.imageUrl);
  
  const { dispatch } = useCart();
   
  // Check if product exists first
  if (!product) {
    return <div className="p-10 text-center text-lg">Product not found</div>;
  }

  // Simply use imageUrl (it's already a string, not an array!)
  const productImage = product.imageUrl || "/globe.svg";

  const handleAddToCart = () => {
    dispatch({
      type: "ADD_ITEM",
      item: {
        id: product.id,
        name: product.name,          // Changed from title
        price: product.price,
        images: productImage,
        quantity: 1,
      },
    });
  };
  
  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex flex-col md:items-center md:flex-row gap-8">
        {/* Product Image */}
        <div className="flex-1 relative rounded-lg h-[75vh] bg-slate-500 overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src={productImage}
              alt={product.name || "Product"}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'contain' }}
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-2xl font-bold">{product.name}</h1>    {/* Changed from title */}
          <p className="text-gray-500">Category: {product.category}</p>    {/* Changed from beauty */}
          <p className="text-lg font-semibold text-green-700">${product.price}</p>
          {product.rating && (
            <p className="text-yellow-500">⭐ {product.rating} / 5</p>
          )}

          <button 
            onClick={handleAddToCart} 
            className="bg-black text-white rounded-md px-6 py-2 mt-4 w-fit hover:bg-gray-800"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}