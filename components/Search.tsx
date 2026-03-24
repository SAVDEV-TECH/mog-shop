'use client'

import React, { useEffect, useState, useRef } from 'react'
import { FiSearch } from "react-icons/fi";
import Link from "next/link";
import Image from 'next/image';

interface SearchProps {
    isOpen: boolean;
    isClose: () => void;
}

const Search: React.FC<SearchProps> = ({ isOpen, isClose }) => {
    const [searchquery, setsearchquery] = useState('');
    
    interface Product {
        id: string;
        name: string;
        imageUrl: string;
        price: number;
        category?: string;
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

        fetchAllProducts();
    }, []);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.closest("input") || target.closest("#cancel-button")) {
                return;
            }
            setsearchquery('');
            setresult([]);
            isClose();
        };

        if (isOpen) {
            document.addEventListener("click", handleClick);
        }

        return () => {
            document.removeEventListener("click", handleClick);
        };
    }, [isOpen, isClose]);

    // Search products based on name
    useEffect(() => {
        if (searchquery.length < 2) {
            setresult([]);
            return;
        }

        setloading(true);
        
        // Filter products by name (case-insensitive)
        const filtered = allProducts.filter(product =>
            product.name.toLowerCase().includes(searchquery.toLowerCase())
        );
        
        setresult(filtered);
        setloading(false);
    }, [searchquery, allProducts]);

    return (
        <div>
            {isOpen && (
                <div className="fixed left-0 top-0 w-full z-10">
                    <div
                        ref={searchRef}
                        className="w-full h-[50vh] overflow-y-scroll px-10 bg-white"
                    >
                        <div className="flex items-center gap-7 justify-between sticky top-0 bg-white z-20 py-4 border-b">
                            <div className='hidden md:flex flex-shrink-0'>
                                <Image src="/mog.png" alt="Mogshop logo" width={64} height={64} className="object-contain" />
                            </div>
                            <div className="flex gap-4 bg-[#e5e5e5] group transition-all ease-linear hover:bg-slate-300 h-max w-[680px] rounded-[30px] items-center">
                                <div className="px-[7px] rounded-full py-[7px] bg-[#e5e5e5]">
                                    <FiSearch size={20} />
                                </div>
                                <input
                                    value={searchquery}
                                    onChange={(e) => setsearchquery(e.target.value)}
                                    className="w-[50%] md:w-[600px] group hover:bg-slate-300 outline-none flex-grow rounded-r-[30px] py-[6px] bg-[#e5e5e5]"
                                    type="text"
                                    placeholder="search"
                                />
                            </div>
                            <h3
                                id="cancel-button"
                                onClick={isClose}
                                className="font-bold cursor-pointer text-[17px]"
                            >
                                Cancel
                            </h3>
                        </div>

                        {loading && <p className="mt-4 text-center">Loading...</p>}

                        {searchquery.length >= 2 && !loading && result.length === 0 && (
                            <p className="mt-4 text-center text-gray-500">No products found</p>
                        )}

                        <ul className="mt-4">
                            {result.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/ProductDetailpage/${item.id}`}
                                    className="p-2 flex items-center gap-4 border-b cursor-pointer hover:bg-gray-100"
                                    onClick={() => isClose()}
                                >
                                    <Image
                                        src={item.imageUrl || "/globe.svg"}
                                        alt={item.name || "Product Image"}
                                        width={80}
                                        height={80}
                                        className="object-contain w-[80px] h-[80px]"
                                        loading="lazy"
                                    />
                                    <div className="flex-grow">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-gray-500">{item.category}</p>
                                        <p className="text-green-700 font-bold">#{item.price}</p>
                                    </div>
                                </Link>
                            ))}
                        </ul>

                        <div className="flex flex-col text-nowrap w-full md:w-[70%] mt-8 mx-auto pb-4">
                            <span className="grid my-2 font-bold text-gray-700">Popular Categories</span>
                            <div className="flex flex-wrap gap-3 text-[14px]">
                                {popularSearches.length > 0 ? popularSearches.map(
                                    (item, index) => (
                                        <span
                                            key={index}
                                            onClick={() => setsearchquery(item)}
                                            className="px-4 py-2 rounded-full font-medium text-gray-700 bg-[#f0f0f0] cursor-pointer hover:bg-gray-800 hover:text-white transition-colors"
                                        >
                                            {item}
                                        </span>
                                    )
                                ) : (
                                    <span className="text-gray-500 text-sm italic">Loading categories...</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="h-[50vh] w-full opacity-10 bg-[#000000e0]"></div>
                </div>
            )}
        </div>
    );
}

export default Search;
