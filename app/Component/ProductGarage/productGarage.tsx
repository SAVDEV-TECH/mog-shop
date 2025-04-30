 

"use client";

import React, {  useState } from "react";
// import { useProductContext } from "../../Contextsortproduct/productSort";

interface ProductGarageProps {
  setSlidetoleft: React.Dispatch<React.SetStateAction<boolean>>;
  slidetoleft: boolean;
  // sortType: string;
}

function ProductGarage({ setSlidetoleft, slidetoleft}: ProductGarageProps) {
  // const { sortedproduct, setsortedproduct } = useProductContext();
  const [loading, setLoading] = useState(false);

  // const fetchProducts = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch(`https://dummyjson.com/products`);
  //     const data = await response.json();

  //     const cleanedProducts = (data.products || []).map((product: any) => ({
  //       id: product.id,
  //       title: product.title,
  //       price: product.price,
  //       rating: product.rating,
  //       beauty: product.category || "", // use something meaningful
  //       images: product.images,
  //     }));

  //     console.log("Fetched Products: ", cleanedProducts); // ✅ Debugging line
  //     // setsortedproduct(cleanedProducts);
  //   } catch (error) {
  //     console.error("Failed to fetch products:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   if (sortedproduct.length === 0) {
  //     fetchProducts();
  //   }
  // }, [fetchProducts]); // ✅ Fetch ONLY once

  // useEffect(() => {
  //   if (sortedproduct.length > 0) {
  //     const sorted = [...sortedproduct];

  //     if (sortType === "a-z") {
  //       sorted.sort((a, b) => a.title.localeCompare(b.title));
  //     } else if (sortType === "z-a") {
  //       sorted.sort((a, b) => b.title.localeCompare(a.title));
  //     } else if (sortType === "low price") {
  //       sorted.sort((a, b) => a.price - b.price);
  //     }

     
  //   }
  // }, [ ]); // ✅ Re-sort ONLY when sortType changes

  const handleshow = () => {
    setSlidetoleft(prev => !prev);
  };

  return (
    <div className="flex w-full items-center justify-between p-4">
      <div> {/* Title Section */}</div>

      <div className="flex items-center gap-4">
        <div onClick={handleshow} className="cursor-pointer hidden md:flex items-center gap-2">
          {slidetoleft ? 'Hide filter' : 'Show filter'}
        </div>

        <select
          // onChange={(e) => {
            // const value = e.target.value;
            // setsortedproduct((prev) => {
            //   const sorted = [...prev];
            //   if (value === "a-z") sorted.sort((a, b) => a.title.localeCompare(b.title));
            //   else if (value === "z-a") sorted.sort((a, b) => b.title.localeCompare(a.title));
            //   else if (value === "low price") sorted.sort((a, b) => a.price - b.price);
            //   return sorted;
            // });
          // }}
          title="sortproduct"
          className="border px-2 py-1 rounded-md"
        >
          <option value="">Sort</option>
          <option value="a-z">A-Z</option>
          <option value="z-a">Z-A</option>
          <option value="low price">Low Price</option>
        </select>
      </div>

      {loading && <p>Loading products...</p>} {/* Optional Loading Message */}
    </div>
  );
}

export default ProductGarage;
