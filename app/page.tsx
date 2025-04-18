
 
 
 
 
import Prodpage from "./Component/Prodpage/page";
 
import { ProductProvider } from "./Contextsortproduct/productSort";
 

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
