import ProductDetailpage from "@/app/Component/ProductpageWraper/page";

async function fetchProduct(id: number) {
  const response = await fetch(`https://dummyjson.com/products/${id}`);
  if(!response.ok) return null
  const data = await response.json();
  
  return data;
}

export default async function Page({ params }: { params: { id: string } }) {
  const product = await fetchProduct(Number(params.id));

  return (
    <div>
      <ProductDetailpage product={product} />
    </div>
  );
}


