 

'use client'

import React, { useEffect, useState, useRef } from 'react'
import { FiSearch } from "react-icons/fi";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface SearchProps {
    isOpen: boolean;
    isClose: () => void;
}

const Page: React.FC<SearchProps> = ({ isOpen, isClose }) => {
    const [searchquery, setsearchquery] = useState('');
    // const [selectedproduct, setselectedproduct] = useState<any | null>(null);
    interface Product {
        id: number;
        title: string;
        images: string;
    }

    const [result, setresult] = useState<Product[]>([]);
    const [loading, setloading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
  

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Prevent closing when clicking on search input or cancel button
            if (target.closest("input") || target.closest("#cancel-button")) {
                return;
            }
            setsearchquery('')
            setresult([])
            isClose(); // Close the search container
            
        };

        if (isOpen) {
            document.addEventListener("click", handleClick);
        }

        return () => {
            document.removeEventListener("click", handleClick);
        };
    }, [isOpen,isClose]);

    useEffect(() => {
        if (searchquery.length < 2) {
            setresult([]);
            return;
        }

        const fetchresult = async () => {
            const dataapi = await fetch(`https://dummyjson.com/products/search?q=${searchquery}`);
            const res = await dataapi.json();
            setresult(res.products);
            setloading(false);
        };

        fetchresult();
    }, [searchquery]);

    return (
       < div>  
      

{isOpen && (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed left-0 top-0 w-full z-10 "
        >
            <motion.div
                initial={{ height: 0 }}
                animate={{ height: "50vh" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                ref={searchRef}
                className="w-full py-1 overflow-y-scroll px-10 bg-white"
            >
                <div className="flex items-center gap-7 justify-between">
                    <div className='hidden md:flex'>
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            role="img"
                            width="74px"
                            height="74px"
                            fill="none"
                        >
                            <path
                                fill="currentColor"
                                fillRule="evenodd"
                                d="M21 8.719L7.836 14.303C6.74 14.768 5.818 15 5.075 15c-.836 0-1.445-.295-1.819-.884-.485-.76-.273-1.982.559-3.272.494-.754 1.122-1.446 1.734-2.108-.144.234-1.415 2.349-.025 3.345.275.2.666.298 1.147.298.386 0 .829-.063 1.316-.19L21 8.719z"
                                clipRule="evenodd"
                            ></path>
                        </svg>
                    </div>
                    <div className="flex gap-4 bg-[#e5e5e5] group transition-all ease-linear hover:bg-slate-300 h-max w-[680px] rounded-[30px] items-center">
                        <div className="px-[7px] rounded-full py-[7px] bg-[#e5e5e5]">
                            <FiSearch size={20} />
                        </div>
                        <input
                            value={searchquery}
                            onChange={(e) => setsearchquery(e.target.value)}
                            className=" w-[50%]    md:w-[600px] group hover:bg-slate-300 outline-none flex-grow rounded-r-[30px] py-[6px] bg-[#e5e5e5]"
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

                {loading && <li>Loading...</li>}

                <motion.ul
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="mt-4"
                >
                    {result.map((item) => (
                        <Link
                            key={item.id}
                            href={`/`}
                            className="p-2 flex items-center justify-between border-b cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                             
                                isClose();
                            }}
                        >
                            {item.title}
                            <img
                                src={item.images}
                                alt={item.title}
                                className="w-20 h-20 object-contain mt-2"
                            />
                        </Link>
                    ))}
                </motion.ul>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
                    className="flex flex-col text-nowrap  w-full md:w-[50%] mt-4 mx-auto"
                >
                    <span className="grid my-2 font-bold">Popular search</span>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut", delay: 0.3 }}
                        className="transform grid  gap-2 text-[14px] grid-cols-4 md:grid-cols-6"
                    >
                        {["home", "air max", "jordan", "Drunks", "Drunks", "jordan", "Drunks", "Drunks"].map(
                            (item, index) => (
                                <span
                                    key={index}
                                    className="px-4 w-max text-center py-2 rounded  text-black bg-[#e5e5e5]"
                                >
                                    {item}
                                </span>
                            )
                        )}
                    </motion.div>
                </motion.div>
            </motion.div>
            <motion.div
               
                className="h-[50vh] w-full opacity-10 bg-[#000000e0]"
            ></motion.div>
        </motion.div>
    </AnimatePresence>
)}

        </div>
    )
}

export default Page;
