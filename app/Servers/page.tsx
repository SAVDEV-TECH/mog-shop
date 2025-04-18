// This will be your Server Component
// Mark this as a Server Component to handle params and async fetching
import Header from "@/app/Component/header/page";
import Shoptext from "@/app/Component/header/shoptext/page";
import ProductDetails from "../productspage/[id]/page";
import { useState, useEffect } from "react";


// Define the Product interface
interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  images: string; // Single image or could be an array of images
}

// This is the Server Component that will fetch the product data based on params.id
async function fetchProduct(id: number) {
  const response = await fetch(`https://dummyjson.com/products/${id}`);
  const data = await response.json();
  return data;
}

// This will be the page component, accepting `params` to get the `id`
export default async function Page({ params }: { params: { id: string } }) {
  const product = await fetchProduct(parseInt(params.id)); // Fetch product data server-side

  return (
    <div>
      <Header />
      <Shoptext />
      <ProductDetails product={product} /> {/* Pass the fetched product to the client-side component */}
    </div>
  );
}