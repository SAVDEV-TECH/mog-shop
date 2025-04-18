 
 
  

'use client';

import Image from "next/image"; // Import Image from next/image
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/app/Component/ContextCart/page"; // Import useCart hook
import { Toaster, toast } from "react-hot-toast"; 


 

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  images: string[];
}

interface ProductDetailsProps {
  product: Product;
}

export default function ProductDetails({  }: ProductDetailsProps) {
  const { id } = useParams() as { id: string }; // Ensure id is a string
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { dispatch } = useCart(); 

  const showToast = () => {
    toast.success("Added to cart! 🛒")}

  const addtocart = (product: Product) => {
    dispatch({
      type: "ADD_ITEM",
      item: {
        id: fetchedProduct?.id ?? 0,
        name: fetchedProduct?.title ?? "",
        price: fetchedProduct?.price ?? 0,
        quantity: 1,
        images: fetchedProduct?.images[0],
      },
    
    });
    showToast()
  };
   
  const imageUrl =
  Array.isArray(fetchedProduct?.images) && fetchedProduct.images[0]
    ? fetchedProduct.images[0]
    : "/fallback-image.jpg";

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`https://dummyjson.com/products/${id}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        setFetchedProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return  (
    <div className="flex items-center justify-center h-40">
         <p className="animate-pulse text-gray-500">Loading product details...</p>
         </div>
    )
  }

  if (!fetchedProduct) {
    return <p className="text-red-500">Product not found</p>;
  }

  return (
    <div className="shadow-lg gap-1 md:gap-10 flex  justify-center flex-col md:flex-row items-center p-4">
      <div className="w-full md:w-[500px] h-[600px] relative">
       
<Image
  src={imageUrl}
  alt="Product"
  width={500}
  height={500}
  className="w-full h-full object-cover rounded-lg"
  priority // forces preload for better LCP
/>
      </div>

      <div className="flex gap-4 w-[90%] mx-auto md:w-[400px] flex-col">
        <p className="text-xl font-bold">{fetchedProduct?.title}</p>
        <p className="text-gray-600">{fetchedProduct?.description}</p>
        <button type="button" key={fetchedProduct?.id} onClick={() => addtocart({
                            ...fetchedProduct,
                            images: Array.isArray(fetchedProduct?.images) ? [fetchedProduct.images[0]] : ["/fallback-image.png"],
                          })} className="w-full h-[50px] bg-black text-center flex items-center justify-center text-white font-semibold rounded-full hover:bg-gray-800 transition">
                  Add to bag
                </button>
      </div>
      <div className="absolute bottom-0">
          <Toaster></Toaster>
      </div>
     
    </div>
  );
}
