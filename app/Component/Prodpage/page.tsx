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

interface ProductsParam {
  id: number;
  images: string[];
  title: string;
  rating: number;
  price: number; // Changed to number to match DummyJSON response
  category: string; // Added category to enable filtering
  thumbnail: string; // Added thumbnail for backup image
  description: string; // Added description for future use
}

function Prodpage() {
  const [slidetoleft, setSlidetoleft] = useState(true);
  const [isfixed, setIsFixed] = useState(false);
  const [isMobile, setisMobile] = useState(false);
  const [products, setProducts] = useState<ProductsParam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Categories state derived from products
  const [categories, setCategories] = useState<string[]>([]);

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
      setLoading(true);
      setError(null);
      try {
        // Replace with your Cloudflare Worker URL in production
        const res = await fetch("https://dummyjson.com/products", {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error(`Error: ${res.status} - ${res.statusText}`);
        }
        
        const data = await res.json();
        
        if (!data || !data.products || !Array.isArray(data.products)) {
          throw new Error("Invalid data format received");
        }
        
        setProducts(data.products);
        
        // Extract unique categories from products
        const uniqueCategories = Array.from(new Set<string>(data.products.map((p: ProductsParam) => p.category)));
        setCategories(uniqueCategories);
        
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to fetch products:", err);
        setError(err.message || "Failed to load products");
        setLoading(false);
      }
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

  // Filter products by category if one is selected
  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === selectedCategory)
    : products;

  return (
    <div>
      <ProductGarage setSlidetoleft={setSlidetoleft} slidetoleft={slidetoleft} />

      <div className="w-[92%] flex flex-col relative p-3 md:flex-row mx-auto gap-2 justify-center">
        {/* Sidebar for categories (mobile or desktop) */}
        {(isMobile || slidetoleft) && (
          <div
            className={`${ isfixed ? "  md:sticky top-10" : ""
            } md:overflow-y-scroll w-full md:h-[80vh] md:w-[20%]`}
          >
            <h2 className="flex justify-between md:border-b border-gray-400 pb-7 gap-3 items-center">
              <p className="text-[20px] text-nowrap">Pick up today</p>
              <span className="w-[30px] inline-flex rounded-full py-1 items-center h-[18px] bg-gray-400 shadow">
                <div className="w-[15px] bg-white ml-[2px] rounded-full h-[15px]"></div>
              </span>
            </h2>
            
            {/* Display dynamically fetched categories instead of hardcoded ones */}
            <div className="mt-4 mb-2 font-bold">Categories</div>
            <ul className="flex flex-row gap-2 md:flex-col w-full">
              <li>
                <button 
                  className={`text-[10px] md:text-[14px] ${selectedCategory === null ? 'font-bold text-blue-600' : ''}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  All Products
                </button>
              </li>
              {categories.map((category, i) => (
                <li key={i}>
                  <button 
                    className={`text-[10px] md:text-[14px] ${selectedCategory === category ? 'font-bold text-blue-600' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
            
            <div className="mt-6 mb-2 font-bold">Popular</div>
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
          {loading ? (
            // Loading state
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="border p-4 rounded-lg shadow-md animate-pulse">
                <div className="bg-gray-200 h-[150px] md:h-[200px] w-[60%] mx-auto mb-4"></div>
                <div className="bg-gray-200 h-4 w-3/4 mb-2 rounded"></div>
                <div className="bg-gray-200 h-4 w-1/4 mb-2 rounded"></div>
                <div className="bg-gray-200 h-4 w-1/3 rounded"></div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="col-span-full text-center p-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-base md:text-lg mb-2">Error loading products</p>
              <p className="text-gray-600">{error}</p>
              <button 
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : filteredProducts.length ? (
            // Show products
            filteredProducts.map((product: ProductsParam) => {
              // Use thumbnail as primary image source, fallback to first image in array, then default image
              const imageSrc = product.thumbnail || 
                (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "/globe.svg");
              
              return (
                <Link
                  key={product.id}
                  href={`/productspage/${product.id}`}
                  className="group relative font-bold inline-block border p-4 rounded-lg shadow-md transition-transform duration-300 hover:scale-[1.05]"
                >
                  <span className="absolute inset-0 bg-gray-300 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl pointer-events-none" />

                  <div>
                    <Image
                      src={(imageSrc || "/globe.svg").trim()}
                      alt={product.title || "Product Image"}
                      width={300}
                      height={200}
                      className="object-contain w-[60%] h-[150px] md:h-[200px] mx-auto"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = "/globe.svg";
                      }}
                    />
                    <div className="pl-2 mt-2 text-sm md:text-base font-medium truncate">{product.title}</div>
                    <div className="pl-2 text-green-700">${product.price}</div>
                    <div className="pl-2 text-yellow-500">⭐ {product.rating}</div>
                    <div className="pl-2 mt-1 text-xs text-gray-500">{product.category}</div>
                  </div>
                </Link>
              );
            })
          ) : (
            // No products found
            <div className="col-span-full text-center p-10">
              <p className="text-gray-500">No products available in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Prodpage;