
import Image from "next/image";
 
import ProductGarage from "./Component/ProductGarage/page";
import Page from '@/app/productspage/[id]/page'
import Prodpage from "./Component/Prodpage/page";
import ContextCart from './Component/cartpage/page'
import Search from './Component/Search/page'
import { ProductProvider } from "./Component/Contextsortproduct/page";
 

export default async function Home() {
   const res = await fetch('https://dummyjson.com/products')
  const data= await res.json()
  console.log(data)
  return (
    <div className=" font-[family-name:var(--font-geist-sans)]">
     
   <ProductProvider> 
      <Prodpage product={data.products} />
      {/* <ContextCart/> */}
    </ProductProvider>
      
    </div>
  );
}
