"use client"

 
import dynamic from 'next/dynamic'
 
interface product {
    id: string;
    name: string;
    price: number;
    rating?: number;
    category: string;
    imageUrl: string;
}

const ProductDetailspage =dynamic(()=>import("@/app/ProductDetailpage/ProductDetailpage"),{ssr:false})
 export default function ProductDetailpage ({product}:{product:product}){
return <ProductDetailspage product={product}></ProductDetailspage>
 }