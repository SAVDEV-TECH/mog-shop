 import React from 'react'
 import ProdPage from '@/components/ProdPage';
import { ProductProvider } from "@/context/ProductSortContext"
 

  function Home() {
 

   return (
    <ProductProvider> 
     <div>
       <ProdPage></ProdPage>
     </div>
     </ProductProvider>
   )
 }
 
 export default Home
