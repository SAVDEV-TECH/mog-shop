"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import ProductGarage from "../ProductGarage/productGarage";
import Image from "next/image";
import { useCart } from "../ContextCart/page";

const store = [
  { text: "Beef" },
  { text: "Cat Food" },
  { text: "Apple" },
  { text: "Nail Polish" },
  { text: "Cucumber" },
  { text: "Cooking Oil" },
];

interface ProductsParam {
  id: string;
  imageUrl: string;
  name: string;
  price: number;
  category?: string;
}

function Prodpage() {
  const [slidetoleft, setSlidetoleft] = useState(true);
  const [isfixed, setIsFixed] = useState(false);
  const [isMobile, setisMobile] = useState(false);
  const [products, setProducts] = useState<ProductsParam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const { dispatch } = useCart();
  
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
        const res = await fetch("/api/products", {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error(`Error: ${res.status} - ${res.statusText}`);
        }
        
        const data = await res.json();
        if (!data || !Array.isArray(data)) {
          throw new Error("Invalid data format received");
        }

        setProducts(data);
        
        const uniqueCategories = Array.from(
          new Set<string>(data.map((p: ProductsParam) => p.category || "Uncategorized"))
        );

        setCategories(uniqueCategories);
        setLoading(false);
      } catch (err: unknown) {
        console.log("Failed to fetch products:", err);
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Failed to load products");
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

  const handleAddToCart = (product: ProductsParam, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dispatch({
      type: "ADD_ITEM",
      item: {
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.imageUrl,
        quantity: 1,
      },
    });
  };

  // Filter products by category and search query
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.category?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <ProductGarage setSlidetoleft={setSlidetoleft} slidetoleft={slidetoleft} />

      <div className="w-[92%] flex flex-col relative p-3 md:flex-row mx-auto gap-2 justify-center">
        {/* Sidebar for categories (mobile or desktop) */}
        {(isMobile || slidetoleft) && (
          <div
            className={`${isfixed ? "md:sticky top-10" : ""} md:overflow-y-scroll w-full md:h-[80vh] md:w-[20%]`}
          >
            <h2 className="flex justify-between md:border-b border-gray-400 pb-7 gap-3 items-center">
              <p className="text-[20px] text-nowrap">Pick up today</p>
              <span className="w-[30px] inline-flex rounded-full py-1 items-center h-[18px] bg-gray-400 shadow">
                <div className="w-[15px] bg-white ml-[2px] rounded-full h-[15px]"></div>
              </span>
            </h2>
            
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

        {/* Products Grid with Search Bar */}
        <div className="w-[100%]">
          {/* Search Bar */}
          <div className="mb-6 sticky top-0 bg-white z-10 py-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition text-sm md:text-base"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-xs md:text-sm text-gray-600">
                Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 text-[10px] gap-6 md:text-[14px] md:grid-cols-4">
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
                return (
                  <div
                    key={product.id}
                    className="group relative font-bold inline-block border p-4 rounded-lg shadow-md transition-transform duration-300 hover:scale-[1.05]"
                  >
                    <span className="absolute inset-0 bg-gray-300 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl pointer-events-none" />

                    <div>
                      <Image
                        src={product.imageUrl || "/globe.svg"}
                        alt={product.name || "Product Image"}
                        width={300}
                        height={200}
                        className="object-contain w-[60%] h-[150px] md:h-[200px] mx-auto"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/globe.svg";
                        }}
                      />
                      <div className="pl-2 mt-2 text-sm md:text-base font-medium truncate">{product.name}</div>
                      <div className="pl-2 text-green-700">#{product.price}</div>
                      <div className="pl-2 mt-1 text-xs text-gray-500">{product.category}</div>
                      
                      {/* Buttons */}
                      <div className="flex flex-col gap-2 mt-3">
                        <Link
                          href={`/ProductDetailpage/${product.id}`}
                          className="w-full bg-blue-600 text-white text-center py-2 px-3 rounded text-xs md:text-sm hover:bg-blue-700 transition"
                        >
                          View Product
                        </Link>
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className="w-full bg-black text-white py-2 px-3 rounded text-xs md:text-sm hover:bg-gray-800 transition"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // No products found
              <div className="col-span-full text-center p-10">
                <p className="text-gray-500">
                  {searchQuery 
                    ? `No products found matching "${searchQuery}"` 
                    : "No products available in this category"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Prodpage;