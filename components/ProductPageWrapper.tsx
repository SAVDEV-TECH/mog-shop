"use client"

import dynamic from 'next/dynamic'
 
interface product {
    id: string;
    name: string;
    price: number;
    rating?: number;
    category: string;
    imageUrl: string;
    slug: string;
}

const ProductDetailComponent = dynamic(() => import("@/components/ProductDetail"), { ssr: false })

export default function ProductDetailpage({ product }: { product: product }) {
  return <ProductDetailComponent product={product as any} />
}