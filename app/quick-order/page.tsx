"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { FiSearch, FiShoppingCart, FiChevronLeft, FiPlus, FiMinus, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  wholesalePrice?: number;
  minWholesaleQty?: number;
  category: string;
  imageUrl: string;
  wholesaleImageUrl?: string;
  slug: string;
}

export default function QuickOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { dispatch, setIsCartOpen } = useCart();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
        
        // Initialize quantities to 0
        const initialQtys: Record<string, number> = {};
        data.forEach((p: Product) => {
          initialQtys[p.id] = 0;
        });
        setQuantities(initialQtys);
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleQtyChange = (id: string, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, value)
    }));
  };

  const handleAddToCart = (product: Product) => {
    const qty = quantities[product.id] || 0;
    if (qty <= 0) {
      toast.error('Please enter a quantity greater than 0');
      return;
    }

    dispatch({
      type: "ADD_ITEM",
      item: {
        id: product.id,
        name: product.name,
        price: product.price,
        wholesalePrice: product.wholesalePrice,
        minWholesaleQty: product.minWholesaleQty,
        wholesaleImageUrl: product.wholesaleImageUrl,
        images: product.imageUrl,
        quantity: qty,
        slug: product.slug,
      },
    });

    toast.success(`Added ${qty} ${product.name} to cart!`);
    setQuantities(prev => ({ ...prev, [product.id]: 0 }));
  };

  const addAllToCart = () => {
    const selectedEntries = Object.entries(quantities).filter(([_, qty]) => qty > 0);
    
    if (selectedEntries.length === 0) {
      toast.error('No quantities specified.');
      return;
    }

    selectedEntries.forEach(([id, qty]) => {
      const product = products.find(p => p.id === id);
      if (product) {
        dispatch({
          type: "ADD_ITEM",
          item: {
            id: product.id,
            name: product.name,
            price: product.price,
            wholesalePrice: product.wholesalePrice,
            minWholesaleQty: product.minWholesaleQty,
            wholesaleImageUrl: product.wholesaleImageUrl,
            images: product.imageUrl,
            quantity: qty,
            slug: product.slug,
          },
        });
      }
    });

    toast.success(`Successfully added ${selectedEntries.length} items to cart!`);
    setIsCartOpen(true);
    
    // Reset all quantities
    const resetQtys: Record<string, number> = {};
    products.forEach(p => { resetQtys[p.id] = 0; });
    setQuantities(resetQtys);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-mog border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-24">
      
      {/* Search Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-[60px] md:top-[70px] z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link href="/#shop-section" className="flex items-center text-sm font-medium text-mog hover:opacity-80 transition-opacity mb-1">
                <FiChevronLeft className="mr-1" /> Back to Store
              </Link>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">Quick Restock Form</h1>
            </div>
            
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search provisions for bulk restock..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-mog outline-none text-sm transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* Table Header (Desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[10px] uppercase font-bold tracking-widest text-gray-400">
            <div className="col-span-5">Product Details</div>
            <div className="col-span-2 text-center">Retail Price</div>
            <div className="col-span-2 text-center">Wholesale Price</div>
            <div className="col-span-3 text-right">Quantity / Add</div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredProducts.map((p) => (
              <div key={p.id} className="grid grid-cols-1 md:grid-cols-12 md:gap-4 px-6 md:px-8 py-6 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group">
                {/* Product Info */}
                <div className="col-span-5 flex items-center gap-4 mb-4 md:mb-0">
                  <div className="relative w-16 h-16 bg-white dark:bg-gray-900 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800 ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all">
                    <Image 
                        src={p.wholesaleImageUrl || p.imageUrl} 
                        alt={p.name} 
                        fill 
                        className="object-contain p-2" 
                    />
                    {p.wholesaleImageUrl && (
                        <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-[8px] font-bold px-1 rounded-tl-md uppercase">
                            Carton
                        </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm md:text-base">{p.name}</h3>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{p.category}</p>
                    {/* Mobile Price View */}
                    <div className="md:hidden flex flex-wrap gap-2 mt-1 items-center">
                        <span className="text-sm font-black text-gray-900 dark:text-white">₦{p.price.toLocaleString()}</span>
                        {p.wholesalePrice && (
                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">
                                Bulk: ₦{p.wholesalePrice.toLocaleString()} ({p.minWholesaleQty}+)
                            </span>
                        )}
                    </div>
                  </div>
                </div>

                {/* Retail Price (Desktop) */}
                <div className="hidden md:flex col-span-2 items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  ₦{p.price.toLocaleString()}
                </div>

                {/* Wholesale Price (Desktop) */}
                <div className="hidden md:flex col-span-2 items-center justify-center">
                  {p.wholesalePrice ? (
                    <div className="text-center">
                      <p className="text-sm font-black text-blue-600 dark:text-blue-400">₦{p.wholesalePrice.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">MIN. {p.minWholesaleQty} UNITS</p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-300">N/A</span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="col-span-3 flex items-center justify-end gap-3">
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 border border-transparent focus-within:border-mog transition-colors">
                    <button 
                      onClick={() => handleQtyChange(p.id, (quantities[p.id] || 0) - 1)}
                      className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-all text-gray-500 hover:text-red-500"
                    >
                      <FiMinus size={14} />
                    </button>
                    <input 
                      type="number" 
                      value={quantities[p.id] || 0}
                      onChange={(e) => handleQtyChange(p.id, parseInt(e.target.value) || 0)}
                      className="w-12 text-center bg-transparent outline-none font-bold text-sm text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      onClick={() => handleQtyChange(p.id, (quantities[p.id] || 0) + 1)}
                      className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-all text-gray-500 hover:text-mog"
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleAddToCart(p)}
                    className={`hidden md:flex p-2.5 rounded-full transition-all transform active:scale-90 ${
                        (quantities[p.id] || 0) > 0 
                        ? 'bg-mog text-white shadow-lg shadow-mog/20' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <FiShoppingCart size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="p-20 text-center">
                <p className="text-gray-500">No products found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 px-6 py-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Order</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">
                {Object.values(quantities).filter(q => q > 0).length} items selected
            </p>
          </div>
          <div className="flex-1 sm:flex-none flex gap-3">
              <button 
                onClick={() => {
                   const reset: any = {};
                   products.forEach(p => reset[p.id] = 0);
                   setQuantities(reset);
                }}
                className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold hover:text-red-500 transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={() => {
                   const selectedEntries = Object.entries(quantities).filter(([_, qty]) => qty > 0);
                   const orderList = selectedEntries.map(([id, qty]) => {
                       const p = products.find(prod => prod.id === id);
                       return `- ${p?.name} (${qty}x)`;
                   }).join('\n');
                   const message = `Hello Mogshop! I'm interested in these restock items:\n${orderList}`;
                   window.open(`https://wa.me/2349037624245?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#128C7E] transition-colors flex items-center gap-2"
              >
                <FaWhatsapp size={20} />
                WhatsApp Inquiry
              </button>
              <button 
                onClick={addAllToCart}
                className="flex-1 sm:flex-none px-10 py-3 bg-mog text-white rounded-xl font-black text-lg shadow-xl shadow-mog/20 hover:scale-[1.02] transform transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <FiCheckCircle size={20} /> Bulk Add to Cart
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
