"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ChevronLeft,
  ShieldCheck,
  CreditCard
} from "lucide-react";

export default function CartPage() {
  const { state, dispatch, total } = useCart();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pt-10 pb-20">
      <div className="w-11/12 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => router.push("/")}
            className="p-2 bg-white dark:bg-gray-900 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">Shopping Cart</h1>
        </div>

        <AnimatePresence mode="wait">
          {state.items.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-900 rounded-[3rem] shadow-sm border border-dashed border-gray-200 dark:border-gray-800"
            >
              <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag size={40} className="text-gray-300" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-8 font-medium">Add some items to start your MogShop journey!</p>
              <button 
                onClick={() => router.push('/')}
                className="bg-mog text-white px-10 py-4 rounded-[2rem] font-bold shadow-xl shadow-mog/20 hover:scale-[1.05] transition"
              >
                Discover Products
              </button>
            </motion.div>
          ) : (
            <div key="items" className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Product List */}
              <div className="lg:col-span-8 space-y-4">
                {state.items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white dark:bg-gray-900 rounded-3xl p-5 md:p-6 shadow-sm border border-transparent dark:border-gray-800 flex gap-4 md:gap-6 items-center"
                  >
                    <div className="relative w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800">
                      <Image
                        src={item.images || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200 truncate">{item.name}</h3>
                      <p className="text-mog font-black text-sm">₦{item.price.toLocaleString()}</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
                        <button
                          onClick={() => dispatch({ type: "DECREASE_QUANTITY", id: item.id })}
                          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm hover:bg-gray-50 transition active:scale-90"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold text-sm w-4 text-center dark:text-gray-200">{item.quantity}</span>
                        <button
                          onClick={() => dispatch({ type: "INCREASE_QUANTITY", id: item.id })}
                          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm hover:bg-gray-50 transition active:scale-90"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => dispatch({ type: "REMOVE_ITEM", id: item.id })}
                        className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition"
                        title="Remove item"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}

                <button
                  onClick={() => dispatch({ type: "CLEAR_CART" })}
                  className="px-6 py-3 text-red-500 font-bold text-sm flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition"
                >
                  <Trash2 size={16} />
                  Clear Shopping Cart
                </button>
              </div>

              {/* Checkout Summary */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-transparent dark:border-gray-800"
                >
                  <h2 className="text-xl font-bold mb-6 dark:text-white">Summary</h2>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Subtotal</span>
                      <span className="font-bold dark:text-gray-200">₦{total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Vat / Taxes</span>
                      <span className="font-bold text-green-600">Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between text-2xl pt-4 border-t border-gray-50 dark:border-gray-800 font-black text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span>₦{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push("/order")}
                    className="w-full bg-mog text-white py-5 rounded-[2rem] font-bold shadow-xl shadow-mog/20 hover:scale-[1.02] shadow-xl shadow-mog/20 transition flex items-center justify-center gap-2"
                  >
                    Checkout Now
                    <ArrowRight size={20} />
                  </button>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <ShieldCheck size={18} className="text-blue-500" />
                      Secure Merchant Checkout
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <CreditCard size={18} className="text-purple-500" />
                      Pay with Cards or POD
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
