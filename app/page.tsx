 import React from 'react'
 import Prodpage from './Component/Prodpage/page';
import { ProductProvider } from "./Contextsortproduct/productSort"
 

  function Home() {
 

   return (
    <ProductProvider> 
     <div>
       <Prodpage></Prodpage>
     </div>
     </ProductProvider>
   )
 }
 
 export default Home
 
