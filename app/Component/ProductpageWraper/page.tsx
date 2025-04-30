"use client"

import dynamic from 'next/dynamic'
// import ProductDetailsPage from "@/app/Component/ProductDetailpage/ProductDetailpage";
// import react from 'react'

const ProductDetailspage =dynamic(()=>import("@/app/Component/ProductDetailpage/ProductDetailpage"),{ssr:false})
 export default function ProductDetailpage ({product}:{product:any}){
return <ProductDetailspage product={product}></ProductDetailspage>
 }