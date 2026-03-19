"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import ProductGarage from "./ProductGarage";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Heart } from "lucide-react";


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

function ProdPage() {
  const [slidetoleft, setSlidetoleft] = useState(true);
  const [isMobile, setisMobile] = useState(false);
  const [products, setProducts] = useState<ProductsParam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const { dispatch } = useCart();
  const { dispatch: wishlistDispatch, isInWishlist } = useWishlist();
  const router = useRouter();
  
  const [categories, setCategories] = useState<string[]>([]);

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
    toast.success(`${product.name} added to cart!`);
  };

  const handleToggleWishlist = (product: ProductsParam, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const inWishlist = isInWishlist(product.id);
    wishlistDispatch({
      type: "TOGGLE_ITEM",
      item: {
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.imageUrl,
      },
    });
    
    if (inWishlist) {
      toast.success(`Removed ${product.name} from wishlist`);
    } else {
      toast.success(`Added ${product.name} to wishlist!`, {
        icon: "❤️"
      });
    }
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

      {/* Back Button - Sticky at top */}
      <div className="sticky top-0 z-20 bg-white dark:bg-[#0a0a0a] shadow-sm dark:shadow-black border-b border-transparent dark:border-gray-800">
        <div className="w-11/12 max-w-7xl mx-auto py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            <span className="text-sm md:text-base">Back</span>
          </button>
        </div>
      </div>

      <div className="w-11/12 max-w-7xl flex flex-col relative p-3 md:flex-row mx-auto gap-6 justify-center">
        {/* Sidebar for categories (mobile or desktop) */}
        {(isMobile || slidetoleft) && (
          <div
            className="md:sticky md:top-24 md:overflow-y-auto w-full md:h-[calc(100vh-8rem)] md:w-1/4 lg:w-1/5 shrink-0"
          >
            <h2 className="flex justify-between md:border-b border-gray-400 dark:border-gray-800 pb-7 gap-3 items-center">
              <p className="text-[20px] text-nowrap text-gray-900 dark:text-gray-100">Pick up today</p>
              <span className="w-[30px] inline-flex rounded-full py-1 items-center h-[18px] bg-gray-400 dark:bg-gray-600 shadow">
                <div className="w-[15px] bg-white dark:bg-[#0a0a0a] ml-[2px] rounded-full h-[15px]"></div>
              </span>
            </h2>
            
            <div className="mt-4 mb-2 font-bold text-gray-900 dark:text-gray-100">Categories</div>
            <ul className="flex flex-row gap-2 md:flex-col w-full">
              <li>
                <button 
                  className={`text-[10px] md:text-[14px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 ${selectedCategory === null ? 'font-bold text-blue-600 dark:!text-blue-400' : ''}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  All Products
                </button>
              </li>
              {categories.map((category, i) => (
                <li key={i}>
                  <button 
                    className={`text-[10px] md:text-[14px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 ${selectedCategory === category ? 'font-bold text-blue-600 dark:!text-blue-400' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
            
            <div className="mt-6 mb-2 font-bold text-gray-900 dark:text-gray-100">Popular</div>
            <ul className="flex flex-row gap-2 md:flex-col w-full">
              {store.map((prod, i) => (
                <li key={i}>
                  <Link className="text-[10px] md:text-[14px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100" href="/">
                    {prod.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Products Grid with Search Bar */}
        <div className="flex-1 w-full min-w-0">
          {/* Search Bar */}
          <div className="mb-6 sticky top-16 md:top-20 bg-white dark:bg-[#0a0a0a] z-10 py-3 transition-colors">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition text-sm md:text-base"
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
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 text-[10px] gap-6 md:text-[14px] md:grid-cols-4">
            {loading ? (
              // Loading state
              Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 rounded-lg shadow-md dark:shadow-none animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-800 h-[150px] md:h-[200px] w-[60%] mx-auto mb-4 rounded"></div>
                  <div className="bg-gray-200 dark:bg-gray-800 h-4 w-3/4 mb-2 rounded"></div>
                  <div className="bg-gray-200 dark:bg-gray-800 h-4 w-1/4 mb-2 rounded"></div>
                  <div className="bg-gray-200 dark:bg-gray-800 h-4 w-1/3 rounded"></div>
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
                    className="group relative font-bold inline-block border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md dark:shadow-none transition-all duration-300 hover:scale-[1.05] hover:shadow-xl dark:hover:shadow-blue-900/10"
                  >
                    <span className="absolute inset-0 bg-gray-300 dark:bg-white opacity-0 group-hover:opacity-10 dark:group-hover:opacity-5 transition-opacity duration-300 rounded-2xl pointer-events-none" />

                    {/* Wishlist Heart Button */}
                    <button
                      onClick={(e) => handleToggleWishlist(product, e)}
                      className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-sm hover:bg-white dark:hover:bg-gray-700 transition"
                    >
                      <Heart 
                        size={18} 
                        className={`${isInWishlist(product.id) ? "fill-red-500 text-red-500" : "text-gray-400 dark:text-gray-500"}`} 
                      />
                    </button>

                    <div>
                      <Image
                        src={product.imageUrl || "/placeholder.svg"}
                        alt={product.name || "Product Image"}
                        width={300}
                        height={200}
                        className="object-contain w-[60%] h-[150px] md:h-[200px] mx-auto"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                      <div className="pl-2 mt-2 text-sm md:text-base font-medium truncate text-gray-900 dark:text-gray-100">{product.name}</div>
                      <div className="pl-2 text-green-700 dark:text-green-500">#{product.price}</div>
                      <div className="pl-2 mt-1 text-xs text-gray-500 dark:text-gray-400">{product.category}</div>
                      
                      {/* Buttons */}
                      <div className="flex flex-col gap-2 mt-3">
                        <Link
                          href={`/ProductDetailpage/${product.id}`}
                          className="w-full bg-mog text-white text-center py-2 px-3 rounded text-xs md:text-sm hover:opacity-95 transition"
                        >
                          View Product
                        </Link>
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className="w-full bg-mogorange text-white py-2 px-3 rounded text-xs md:text-sm hover:opacity-95 transition"
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
                <p className="text-gray-500 dark:text-gray-400">
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

export default ProdPage;
