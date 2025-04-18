 "use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProductContext } from '../Contextsortproduct/page';

interface ProductGarageProps {
  setSlidetoleft: React.Dispatch<React.SetStateAction<boolean>>;
  slidetoleft: boolean;
  sortType: string;
  setsortproduct: React.Dispatch<React.SetStateAction<string>>;
}
// interface product {
//   title: string;
//   price: number;
//   // Add other properties as needed
// }

function ProductGarage({ setSlidetoleft, slidetoleft, sortType }: ProductGarageProps) {
  const [isfixed, setoisfixed] = useState(false);
  const {sortedproduct, setsortedproduct} = useProductContext();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`https://dummyjson.com/products`);
        const data = await response.json();
        setsortedproduct(data.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (sortedproduct.length > 0) {
      let sorted = [...sortedproduct];
      if (sortType === "a-z") {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortType === "z-a") {
        sorted.sort((a, b) => b.title.localeCompare(a.title));
      } else if (sortType === "low price") {
        sorted.sort((a, b) => a.price - b.price);
      }
      setsortedproduct(sorted);
    }
  }, [sortType]);

  const checkscroll = () => {
    window.scrollY > 170 ? setoisfixed(true) : setoisfixed(false);
  };

  useEffect(() => {
    window.addEventListener('scroll', checkscroll);
    return () => {
      window.removeEventListener('scroll', checkscroll);
    };
  }, []);

  const handleshow = () => {
    setSlidetoleft((prev) => !prev);
  };
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
  return (
    <div className={`${isfixed ? 'fixed text-[14px] bg-white -top-14 overflow-hidden z-50' : ''} flex w-full items-center px-14 mt-6 justify-between`}>
      <div className="flex flex-col">
        <div className={`${isfixed ? 'sticky top-4 text-[14px]' : 'text-[10px]'} hidden md:flex text-[12px] md:text-[16px]`}>Men's Nike P-6000 Lifestyle Shoes</div>
      </div>
      <div className="flex item-center gap-5">
        <div onClick={handleshow} className="cursor-pointer hidden md:flex  items-center gap-2">
          <p className='text-[12px] md:text-[16px]   text-nowrap'>{slidetoleft ? 'Hide filter' : 'Show filter'}</p>
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none">
            <path stroke="currentColor" strokeWidth="1.5" d="M21 8.25H10m-5.25 0H3"></path>
            <path stroke="currentColor" strokeWidth="1.5" d="M7.5 6v0a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd"></path>
            <path stroke="currentColor" strokeWidth="1.5" d="M3 15.75h10.75m5 0H21"></path>
            <path stroke="currentColor" strokeWidth="1.5" d="M16.5 13.5v0a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd"></path>
          </svg>
        </div>
        <select 
        onChange={(e) => {
          const value = e.target.value;
          setsortedproduct((prev) => {
            let sorted = [...prev];
            if (value === "a-z") {
              sorted.sort((a, b) => a.title.localeCompare(b.title));
            } else if (value === "z-a") {
              sorted.sort((a, b) => b.title.localeCompare(a.title));
            } else if (value === "low price") {
              sorted.sort((a, b) => a.price - b.price);
            }
            return sorted;
          });
        }} title='sortproduct' className="flex text-[12px] md:text-[16px] text-nowrap items-center gap-3">
          <option title='sort' value="">Sort</option>
          <option title='a-z' value="a-z">A-Z</option>
          <option title='z-a' value="z-a">Z-A</option>
          <option title='low price' value="low price">Low Price</option>
        </select>
      </div>
    </div>
  );
}

export default ProductGarage;
