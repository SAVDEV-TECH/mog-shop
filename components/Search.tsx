'use client'
import React, { useEffect, useState, useRef } from 'react'
import { FiSearch, FiX, FiShoppingCart } from "react-icons/fi";
import Link from "next/link";
import Image from 'next/image';
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

interface SearchProps {
    isOpen: boolean;
    isClose: () => void;
}

const Search: React.FC<SearchProps> = ({ isOpen, isClose }) => {
    const [searchquery, setsearchquery] = useState('');
    const { dispatch, setIsCartOpen } = useCart();
    
    interface Product {
        id: string;
        name: string;
        imageUrl: string;
        price: number;
        category?: string;
        slug: string;
    }

    const [result, setresult] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setloading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const [popularSearches, setPopularSearches] = useState<string[]>([]);

    // Fetch all products once when component mounts
    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                const response = await fetch('/api/products');
                const data = await response.json();
                setAllProducts(data);
                
                const categories = Array.from(new Set(data.map((p: any) => p.category))).filter((c): c is string => typeof c === 'string' && c.trim() !== '');
                setPopularSearches(categories.slice(0, 8));
            } catch (error) {
                console.log('Error fetching products:', error);
            }
        };

        if (isOpen) fetchAllProducts();
    }, [isOpen]);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.closest("input") || target.closest(".close-btn") || target.closest(".add-to-cart-btn")) {
                return;
            }
            if (searchRef.current && !searchRef.current.contains(target)) {
                isClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClick);
        }

        return () => {
            document.removeEventListener("mousedown", handleClick);
        };
    }, [isOpen, isClose]);

    // Search products based on name
    useEffect(() => {
        if (searchquery.length < 2) {
            setresult([]);
            return;
        }

        setloading(true);
        const filtered = allProducts.filter(product =>
            product.name.toLowerCase().includes(searchquery.toLowerCase()) ||
            (product.category && product.category.toLowerCase().includes(searchquery.toLowerCase()))
        );
        
        setresult(filtered);
        setloading(false);
    }, [searchquery, allProducts]);

    const handleAddToCart = (product: Product, e: React.MouseEvent) => {
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
            slug: product.slug,
          },
        });
        
        setIsCartOpen(true);
        isClose(); // Close search after adding to cart
        toast.success(`${product.name} added to cart!`);
    };

    return (
        <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isClose} />
            
            {/* Search Panel */}
            <div 
                ref={searchRef}
                className={`absolute top-0 left-0 w-full bg-white dark:bg-[#0a0a0a] shadow-2xl transition-transform duration-500 transform ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}
            >
                <div className="max-w-7xl mx-auto px-6 py-6 h-full max-h-[85vh] overflow-y-auto scrollbar-hide">
                    {/* Search Header */}
                    <div className="flex items-center gap-6 justify-between sticky top-0 bg-white dark:bg-[#0a0a0a] z-50 pb-6 border-b border-gray-100 dark:border-gray-800">
                        <div className='hidden md:block flex-shrink-0'>
                            <Image src="/mog.png" alt="Mogshop" width={56} height={56} className="object-contain" />
                        </div>
                        
                        <div className="relative flex-grow max-w-2xl bg-gray-100 dark:bg-gray-900 rounded-2xl group transition-all duration-300 focus-within:ring-2 focus-within:ring-mog/50">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                            <input
                                autoFocus={isOpen}
                                value={searchquery}
                                onChange={(e) => setsearchquery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
                                type="text"
                                placeholder="Search products, brands or categories..."
                            />
                        </div>

                        <button
                            onClick={isClose}
                            className="close-btn p-3 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all border border-transparent dark:border-gray-800"
                            aria-label="Close search"
                        >
                            <FiX size={24} />
                        </button>
                    </div>

                    <div className="py-8">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-10 h-10 border-4 border-mog border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : searchquery.length >= 2 ? (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Search Results ({result.length})</h3>
                                {result.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {result.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={`/p/${item.slug}`}
                                                className="p-4 flex items-center justify-between gap-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-transparent hover:border-mog hover:shadow-lg dark:hover:shadow-mog/5 transition-all group"
                                                onClick={() => isClose()}
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="relative w-20 h-20 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shrink-0">
                                                        <Image
                                                            src={item.imageUrl || "/placeholder.svg"}
                                                            alt={item.name}
                                                            fill
                                                            className="object-contain p-2 group-hover:scale-110 transition-transform"
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.category}</p>
                                                        <p className="text-mog font-black">₦{item.price.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                
                                                <button 
                                                    onClick={(e) => handleAddToCart(item, e)}
                                                    className="add-to-cart-btn p-3 rounded-full bg-mog text-white hover:bg-mog/90 transition-all transform hover:scale-110 active:scale-95 shadow-lg shadow-mog/20"
                                                    title="Add to Cart"
                                                >
                                                    <FiShoppingCart size={20} />
                                                </button>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-4xl mb-4">🔍</div>
                                        <p className="text-gray-500">No products found for "{searchquery}"</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* Popular Categories */}
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Popular Categories</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {popularSearches.map((item, index) => (
                                            <Link
                                                key={index}
                                                href={`/#shop-section?category=${encodeURIComponent(item)}`}
                                                className="px-6 py-3 rounded-full font-bold text-sm bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-mog hover:text-white transition-all transform hover:-translate-y-1"
                                                onClick={() => isClose()}
                                            >
                                                {item}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* Suggested Searches */}
                                <div className="bg-mog/5 rounded-[2rem] p-8 border border-mog/10">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Looking for something specific?</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Type product names, categories, or price ranges to find exactly what you need.</p>
                                    <div className="flex gap-4">
                                        <Link href="/#shop-section" onClick={isClose} className="text-mog font-bold flex items-center gap-2 hover:gap-3 transition-all">
                                            View all collections <span>→</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Search;
