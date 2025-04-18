 "use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import ProductGarage from "../ProductGarage/productGarage";
import { Toaster, toast } from "react-hot-toast";
import { useCart } from "@/app/Component/ContextCart/page"; // Import useCart hook
import { useProductContext } from "../../Contextsortproduct/productSort";

const store = [
  {text: "Beef" },
  { text: "Cat Food" },
  { text: "Apple" },
  { text: "Nail Polish" },
  { text: "Cucumber" },
  { text: "Cooking Oil" },
  { text: "Beef" },
  { text: "Cat Food" },
  
];

interface Product {
  id: number;
  images: string;
  title: string;
  beauty?: string;
  price: number;
  rating: number;
}

function Prodpage({ product }: { product: Product[] }) {
  const [slidetoleft, setSlidetoleft] = useState(true);
  const [isfixed, setIsFixed] = useState(false);
  const {sortedproduct} = useProductContext()
  const { dispatch } = useCart(); // Get dispatch from cart context

  const showToast = () => {
    toast.success("Added to cart! 🛒");
  };

  // const addToCart = (item: Product) => {
  //   dispatch({
  //     type: "ADD_ITEM",
  //     item:{
  //         id: item.id,
  //         name: item.title,
  //         price: item.price,
  //         quantity: 1,
  //         images: undefined
  //     },
  //   });
  //   showToast();
  // };

  useEffect(() => {
    const checkScroll = () => {
      setIsFixed(window.scrollY > 200);
    };
    window.addEventListener("scroll", checkScroll);
    return () => {
      window.removeEventListener("scroll", checkScroll);
    };
  }, []);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
   
  return (
    <div>
      <ProductGarage setSlidetoleft={setSlidetoleft} slidetoleft={slidetoleft} sortType={""} setsortproduct={function (value: React.SetStateAction<string>): void {
        throw new Error("Function not implemented.");
      } }  />

      <div className="w-[92%] flex flex-col relative p-3 md:flex-row mx-auto gap-2 justify-center">
        { isMobile ?
         (
          <div className={`${isfixed ? "sticky top-10" : ""} md:overflow-y-scroll w-full md:h-[80vh] md:w-[20%]`}>
          <h2 className="flex justify-between md:border-b border-gray-400 pb-7 gap-3 items-center">
            <p className="text-[20px] text-nowrap">Pick up today</p>
            <span className="w-[30px] inline-flex rounded-full py-1 items-center h-[18px] bg-gray-400 shadow">
              <div className="w-[15px] bg-white ml-[2px] rounded-full h-[15px]"></div>
            </span>
          </h2>
          <div className="flex items-center">
            <ul className="flex flex-row   gap-2 md:flex-col w-full">
              {store.map((prod, i) => (
                <li key={i}>
                  <Link className="text-[10px] md:text-[14px]" href="/">
                    {prod.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        ):
        (
          slidetoleft &&(
<div className={`${isfixed ? "sticky top-10" : ""} md:overflow-y-scroll w-full md:h-[80vh] md:w-[20%]`}>
            <h2 className="flex justify-between md:border-b border-gray-400 pb-7 gap-3 items-center">
              <p className="text-[20px] text-nowrap">Pick up today</p>
              <span className="w-[30px] inline-flex rounded-full py-1 items-center h-[18px] bg-gray-400 shadow">
                <div className="w-[15px] bg-white ml-[2px] rounded-full h-[15px]"></div>
              </span>
            </h2>
            <div className="flex items-center">
              <ul className="flex flex-row   gap-2 md:flex-col w-full">
                {store.map((prod, i) => (
                  <li key={i}>
                    <Link className="text-[10px] md:text-[14px]" href="/">
                      {prod.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          )
        )
      }
        <div className="grid grid-cols-2 text-[10px] w-[100%] gap-6 md:text-[14px] md:grid-cols-4">
          {sortedproduct?.map((e) => (
            <div key={e.id} className="border p-4 rounded-lg shadow-md">
              <Link className="font-bold transition-[900] pb-2 hover:scale-[1.056]" href={`/productspage/${e.id}`}>
                <div>
                  <img
                    className="w-[60%] h-[150px] md:h-[200px] object-contain"
                    src={Array.isArray(e.images) ? e.images[0] : e.images || "/fallback-image.png"}
                    alt={e.title || "Product Image"}
                    loading="lazy"
                  />
                  <div className="pl-2">{e.title}</div>
                  <div className="pl-2">{e.beauty}</div>
                  <div className="pl-2">${e.price}</div>
                  <div className="pl-2">{e.rating}</div>
                 
                </div>
              </Link>
              {/* Add to Cart Button */}
              {/* <button
                onClick={() =>
                  addToCart({
                    ...e,
                    images: Array.isArray(e.images) ? e.images[0] : e.images || "/fallback-image.png",
                    rating: e.rating || 0, // Ensure rating is provided
                  })
                }
                className="w-[90%] mx-auto h-[30px] bg-gray-600 text-center flex items-center justify-center text-white font-semibold rounded-full hover:bg-gray-800 transition mt-1"
              >
                Add to bag
              </button> */}
             
            </div>
          ))}
        </div>
        <Toaster/>
      </div>
    </div>
  );
}

export default Prodpage;


