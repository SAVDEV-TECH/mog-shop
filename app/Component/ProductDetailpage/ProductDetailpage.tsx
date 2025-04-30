 // Client Component (ProductDetailsPage.tsx)
"use client"
import Image from "next/image";
import { useCart } from "../ContextCart/page";

interface Product {
  id: number;
  title: string;
  price: number;
  rating: number;
  beauty: string;
  images: string[];
}

interface ProductDetailsPageProps {
  product: Product; // Receive the product prop from the parent
}

export default function ProductDetailsPage({ product }: ProductDetailsPageProps) {
  const { dispatch } = useCart();

  const handleAddToCart = () => {
    dispatch({
      type: "ADD_ITEM",
      item: {
        id: product.id,
        name: product.title,
        price: product.price,
        images: product.images[0], // assuming first image
        quantity: 1,
      },
    });
  };
  if (!product) return <div className="p-10 text-center text-lg">Product not found</div>;
  
  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex flex-col md:items-center md:flex-row gap-8">
        {/* Product Image */}
        <div className="flex-1 flex  rounded-lg h-[75vh] bg-slate-500 justify-center items-center">
          <Image 
            src={product.images[0] || "/globe.svg"}
            alt={product.title}
            width={400}
            height={400}
            className="object-contain rounded-lg"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-gray-500">Category: {product.beauty}</p>
          <p className="text-lg font-semibold text-green-700">${product.price}</p>
          <p className="text-yellow-500">⭐ {product.rating} / 5</p>

          <button onClick={handleAddToCart} className="bg-black text-white rounded-md px-6 py-2 mt-4 w-fit hover:bg-gray-800">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}


