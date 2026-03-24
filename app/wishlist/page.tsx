"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist, WishlistItem } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";
import { Trash2, ShoppingCart, HeartOff } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function WishlistPage() {
  const { state, dispatch: wishlistDispatch } = useWishlist();
  const { dispatch: cartDispatch, setIsCartOpen } = useCart();

  const handleRemove = (id: string, name: string) => {
    wishlistDispatch({ type: "REMOVE_ITEM", id });
    toast.success(`Removed ${name} from wishlist`);
  };

  const handleAddToCart = (item: WishlistItem) => {
    cartDispatch({
      type: "ADD_ITEM",
      item: {
        id: item.id,
        name: item.name,
        price: item.price,
        images: item.images,
        quantity: 1,
        slug: item.slug,
      },
    });
    setIsCartOpen(true);
    toast.success(`${item.name} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            ❤️ My Wishlist
          </h1>
          <BackButton />
        </div>

        {state.items.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <HeartOff className="mx-auto text-gray-300 dark:text-gray-700 mb-4" size={64} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your wishlist is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">Save items you love here to find them easily later.</p>
            <Link 
              href="/" 
              className="bg-mog text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition inline-block"
            >
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {state.items.map((item) => (
              <div 
                key={item.id}
                className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition"
              >
                <Link href={`/p/${item.slug || item.id}`} className="w-20 h-20 relative shrink-0">
                  <Image
                    src={item.images || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    className="object-contain"
                  />
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/p/${item.slug || item.id}`}>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate hover:text-mog transition-colors">{item.name}</h3>
                  </Link>
                  <p className="text-green-600 dark:text-green-500 font-semibold">₦{item.price.toLocaleString()}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="p-3 bg-mogorange text-white rounded-lg hover:opacity-95 transition flex items-center gap-2"
                    title="Add to cart"
                  >
                    <ShoppingCart size={18} />
                    <span className="hidden sm:inline">Add to Cart</span>
                  </button>
                  <button
                    onClick={() => handleRemove(item.id, item.name)}
                    className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    title="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
