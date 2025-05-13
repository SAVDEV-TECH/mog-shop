"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import ProductGarage from "../ProductGarage/productGarage";
import Image from "next/image";

const store = [
  { text: "Beef" },
  { text: "Cat Food" },
  { text: "Apple" },
  { text: "Nail Polish" },
  { text: "Cucumber" },
  { text: "Cooking Oil" },
];

interface productsparam {
  id: number;
  images: string[];
  title: string;
  rating: number;
  price: string;
}

function Prodpage() {
  const [slidetoleft, setSlidetoleft] = useState(true);
  const [isfixed, setIsFixed] = useState(false);
  const [isMobile, setisMobile] = useState(false);
  const [products, setProducts] = useState<productsparam[]>([]);

  useEffect(() => {
    const checkScroll = () => {
      setIsFixed(window.scrollY > 200);
    };
    window.addEventListener("scroll", checkScroll);
    return () => {
      window.removeEventListener("scroll", checkScroll);
    };
  }, []);

  useEffect(() => {
    async function fetchproduct() {
      const res = await fetch(`https://dummyjson.com/products`);
      const data = await res.json();
      setProducts(data.products);
    }
    fetchproduct();
  }, []);

  useEffect(() => {
    const checkisMobile = () => {
      setisMobile(window.innerWidth <= 768);
    };
    checkisMobile();
    window.addEventListener("resize", checkisMobile);
    return () => window.removeEventListener("resize", checkisMobile);
  }, []);

  return (
    <div>
      <ProductGarage setSlidetoleft={setSlidetoleft} slidetoleft={slidetoleft} />

      <div className="w-[92%] flex flex-col relative p-3 md:flex-row mx-auto gap-2 justify-center">
        {/* Sidebar for categories (mobile or desktop) */}
        {(isMobile || slidetoleft) && (
          <div
            className={`${
              isfixed ? "sticky top-10" : ""
            } md:overflow-y-scroll w-full md:h-[80vh] md:w-[20%]`}
          >
            <h2 className="flex justify-between md:border-b border-gray-400 pb-7 gap-3 items-center">
              <p className="text-[20px] text-nowrap">Pick up today</p>
              <span className="w-[30px] inline-flex rounded-full py-1 items-center h-[18px] bg-gray-400 shadow">
                <div className="w-[15px] bg-white ml-[2px] rounded-full h-[15px]"></div>
              </span>
            </h2>
            <ul className="flex flex-row gap-2 md:flex-col w-full">
              {store.map((prod, i) => (
                <li key={i}>
                  <Link className="text-[10px] md:text-[14px]" href="/">
                    {prod.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 text-[10px] w-[100%] gap-6 md:text-[14px] md:grid-cols-4">
          {products.length ? (
            products.map((e: productsparam) => {
              const imageSrc = Array.isArray(e.images) && e.images.length > 0 ? e.images[0] : "/globe.svg";
              return (
                <Link
                  key={e.id}
                  href={`/productspage/${e.id}`}
                  className="group relative font-bold inline-block border p-4 rounded-lg shadow-md transition-transform duration-300 hover:scale-[1.05]"
                >
                  <span className="absolute inset-0 bg-gray-300 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl pointer-events-none" />

                  <div>
                    <Image
                      src={(imageSrc || "/globe.svg").trim()}
                      alt={e.title || "Product Image"}
                      width={300}
                      height={200}
                      className="object-contain w-[60%] h-[150px] md:h-[200px] mx-auto"
                      loading="lazy"
                    />
                    <div className="pl-2 mt-2 text-sm md:text-base font-medium">{e.title}</div>
                    <div className="pl-2 text-green-700">${e.price}</div>
                    <div className="pl-2 text-yellow-500">⭐ {e.rating}</div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="animate-pulse">No products available</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Prodpage;
