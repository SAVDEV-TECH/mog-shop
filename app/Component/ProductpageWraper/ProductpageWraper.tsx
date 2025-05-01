"use client"

// import { ProductContextProps } from '@/app/Contextsortproduct/productSort';
import dynamic from 'next/dynamic'
// import ProductDetailsPage from "@/app/Component/ProductDetailpage/ProductDetailpage";
// import react from 'react'
interface product {
    id: number;
    title: string;
    price: number;
    description: string;
    images: string[];
    rating: number; // Add the missing rating property
    beauty: string; // Add the missing beauty property
  }

const ProductDetailspage =dynamic(()=>import("@/app/Component/ProductDetailpage/ProductDetailpage"),{ssr:false})
 export default function ProductDetailpage ({product}:{product:product}){
return <ProductDetailspage product={product}></ProductDetailspage>
 }