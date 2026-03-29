"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

export default function CartDrawer() {
  const { state: { items }, isCartOpen, setIsCartOpen, dispatch, total } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity" 
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[90%] sm:w-[400px] bg-white dark:bg-[#0a0a0a] shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col border-l border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <h2 className="text-lg font-bold">Your Cart ({items.length})</h2>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <ShoppingBag size={48} className="opacity-20" />
              <p>Your cart is empty.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800">
                  <Image 
                    src={(item.wholesaleImageUrl && item.minWholesaleQty && item.quantity >= item.minWholesaleQty ? item.wholesaleImageUrl : (item.images || "/globe.svg"))} 
                    alt={item.name} 
                    width={80} 
                    height={80} 
                    className="w-full h-full object-contain p-1"
                    unoptimized
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                      <button 
                        onClick={() => dispatch({ type: "REMOVE_ITEM", id: item.id })}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex flex-col mt-1">
                      <p className={`font-bold text-sm ${item.wholesalePrice && item.minWholesaleQty && item.quantity >= item.minWholesaleQty ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        ₦{(item.wholesalePrice && item.minWholesaleQty && item.quantity >= item.minWholesaleQty ? item.wholesalePrice : item.price).toLocaleString()}
                      </p>
                      {item.wholesalePrice && item.minWholesaleQty && item.quantity >= item.minWholesaleQty && (
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold w-fit mt-0.5 uppercase tracking-tighter">
                          Wholesale Price Applied
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1">
                      <button 
                        className="px-2 text-gray-500 hover:text-black dark:hover:text-white"
                        onClick={() => dispatch({ type: "DECREASE_QUANTITY", id: item.id })}
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button 
                        className="px-2 text-gray-500 hover:text-black dark:hover:text-white"
                        onClick={() => dispatch({ type: "INCREASE_QUANTITY", id: item.id })}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0a0a0a]">
            <div className="flex justify-between items-center mb-4 font-bold text-lg">
              <span>Subtotal</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
            <Link 
              href="/cart"
              onClick={() => setIsCartOpen(false)}
              className="w-full block text-center py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:opacity-90 transition-opacity mb-2"
            >
              Checkout Now
            </Link>
            
            <button 
              onClick={() => {
                const message = `Hello Mogshop! I'd like to order:\n${items.map(item => `- ${item.name} (${item.quantity}x)`).join('\n')}\n\nTotal: ₦${total.toLocaleString()}`;
                window.open(`https://wa.me/2349037624245?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-full font-bold hover:bg-[#128C7E] transition-colors"
            >
              <FaWhatsapp size={20} />
              Order via WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  );
}
