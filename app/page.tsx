import React from 'react'
import ProdPage from '@/components/ProdPage';
import Hero from '@/components/Hero';
import { ProductProvider } from "@/context/ProductSortContext"

function Home() {
  return (
    <ProductProvider> 
      <main className="bg-white dark:bg-[#0a0a0a]">
        <Hero />
        <div className="py-12 md:py-20">
          <ProdPage />
        </div>
      </main>
    </ProductProvider>
  )
}

export default Home
