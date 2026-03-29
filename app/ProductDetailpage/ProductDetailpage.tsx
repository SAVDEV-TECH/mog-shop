"use client"

import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Heart,
  Star,
  ChevronRight,
  BadgeCheck,
  Truck,
  ShieldCheck,
  RefreshCcw,
  Minus,
  Plus
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useState } from "react";
import toast from "react-hot-toast";
import ProductReviews from "@/components/ProductReviews";

// interface Product {
//   id: string;
//   name: string;
//   price: number;
//   rating?: number;
//   category: string;
//   imageUrl: string;
//   slug: string;
//   description?: string;
//   stock?: number;
// }

// ✅ Add this interface
interface Product {
  id: string;
  name: string;
  price: number;
  wholesalePrice?: number;
  minWholesaleQty?: number;
  rating?: number;
  category: string;
  imageUrl: string;
  wholesaleImageUrl?: string;
  slug: string;
  description?: string;
  stock?: number;
}

interface ProductDetailsPageProps {
  product: Product;
}

export default function ProductDetailsPage({ product }: ProductDetailsPageProps) {
  const { dispatch, setIsCartOpen } = useCart();
  const { state: { items: wishlistItems }, dispatch: wishlistDispatch } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [isHovering, setIsHovering] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('reviews');

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-10 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Product not found</p>
          <p className="text-gray-500 dark:text-gray-400">The product you're looking for might have been moved or deleted.</p>
        </div>
      </div>
    );
  }

  const productImage = product.imageUrl || "/placeholder.png";
  const isWishlisted = wishlistItems.some(item => item.id === product.id);

  const handleAddToCart = () => {
    dispatch({
      type: "ADD_ITEM",
      item: {
        id: product.id,
        name: product.name,
        price: product.price,
        wholesalePrice: product.wholesalePrice,
        minWholesaleQty: product.minWholesaleQty,
        wholesaleImageUrl: product.wholesaleImageUrl,
        images: productImage,
        quantity: quantity,
        slug: product.slug,
      },
    });
    setIsCartOpen(true);
    toast.success(`Success! ${quantity} ${product.name} added to cart`, {
      icon: "🎉",
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  const toggleWishlist = () => {
    wishlistDispatch({
      type: 'TOGGLE_ITEM',
      item: {
        id: product.id,
        name: product.name,
        price: product.price,
        images: productImage,
        slug: product.slug
      }
    });

    if (isWishlisted) {
      toast.error("Removed from favourites");
    } else {
      toast.success("Added to favourites!", { icon: "❤️" });
    }
  };

  const incrementQty = () => setQuantity(prev => prev + 1);
  const decrementQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
          <span className="hover:text-mog transition-colors cursor-pointer">Home</span>
          <ChevronRight size={14} />
          <span className="hover:text-mog transition-colors cursor-pointer uppercase">{product.category}</span>
          <ChevronRight size={14} />
          <span className="text-gray-900 dark:text-white font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div
              className="relative aspect-square lg:aspect-[4/5] rounded-3xl bg-white dark:bg-gray-900 overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <Image
                alt={product.name}
                fill
                priority
                className={`object-contain p-4 transition-transform duration-700 ease-out ${isHovering ? 'scale-110' : 'scale-100'}`}
                src={(product.wholesaleImageUrl && quantity >= (product.minWholesaleQty || 12)) ? product.wholesaleImageUrl : productImage}
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Floating Action Badge */}
              <div className="absolute top-6 left-6">
                <span className="px-3 py-1 bg-mog/10 backdrop-blur-md text-mog text-xs font-bold rounded-full uppercase tracking-wider border border-mog/20">
                  {product.category}
                </span>
              </div>

              {/* Wishlist Button */}
              <button
                onClick={toggleWishlist}
                className={`absolute top-6 right-6 p-3 rounded-full shadow-lg transition-all duration-300 ${isWishlisted
                  ? 'bg-red-500 text-white scale-110'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-red-500 backdrop-blur-md'
                  }`}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Thumbnail Preview (Optional placeholder for now) */}
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-20 h-20 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-2 cursor-pointer hover:border-mog transition-colors overflow-hidden">
                  <Image src={productImage} alt="thumbnail" width={80} height={80} className="w-full h-full object-contain opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Product Details Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.floor(product.rating || 5) ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {product.rating ? `(${product.rating} Rating)` : "(5.0/5.0)"}
                </span>
                <span className="text-gray-300 dark:text-gray-700">|</span>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                  <BadgeCheck size={16} /> In Stock
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-mog">
                  ₦{product.price.toLocaleString()}
                </span>
                <span className="text-lg text-gray-400 line-through">
                  ₦{(product.price * 1.2).toLocaleString()}
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">
                  -20% OFF
                </span>
              </div>
              
              {product.wholesalePrice && product.minWholesaleQty && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                    Bulk Discount: ₦{product.wholesalePrice.toLocaleString()} when you buy {product.minWholesaleQty}+ items
                  </p>
                </div>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
              {product.description || "Experience the perfect blend of quality and style with this premium product. Designed for those who appreciate excellence, it offers unmatched performance and durability."}
            </p>

            <div className="h-px bg-gray-200 dark:bg-gray-800 w-full" />

            {/* Quantity Selector */}
            <div className="space-y-3">
              <span className="text-sm font-bold uppercase tracking-wider text-gray-500">Quantity</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                  <button onClick={decrementQty} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300">
                    <Minus size={18} />
                  </button>
                  <span className="w-12 text-center font-bold text-gray-900 dark:text-white">{quantity}</span>
                  <button onClick={incrementQty} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <button
                onClick={handleAddToCart}
                className="group flex items-center justify-center gap-3 bg-mog text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-mog/90 shadow-xl shadow-mog/20 transition-all duration-300 transform active:scale-95"
              >
                <ShoppingCart className="group-hover:translate-x-1 transition-transform" />
                Add to Cart
              </button>
              <button 
                onClick={() => {
                  const message = `Hello Mogshop! I'm interested in: ${product.name} (Qty: ${quantity})\nPrice: ₦${product.price.toLocaleString()}\nLink: ${window.location.href}`;
                  window.open(`https://wa.me/2349037624245?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="flex items-center justify-center gap-3 bg-[#25D366] text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-[#128C7E] transition-all duration-300 transform active:scale-95 shadow-xl shadow-green-500/20"
              >
                <FaWhatsapp size={24} />
                WhatsApp Order
              </button>
            </div>

            {/* Features/Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 mt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                  <Truck size={24} />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Free Delivery</span>
                <span className="text-[10px] text-gray-500">On orders over ₦100k</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                  <ShieldCheck size={24} />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Secure Payment</span>
                <span className="text-[10px] text-gray-500">100% encrypted SSL</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                  <RefreshCcw size={24} />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Easy Returns</span>
                <span className="text-[10px] text-gray-500">7-day return policy</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-20">
          <div className="border-b border-gray-200 dark:border-gray-800 mb-8">
            <nav className="flex gap-8">
              <button 
                onClick={() => setActiveTab('desc')}
                className={`px-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'desc' ? 'text-mog border-mog' : 'text-gray-500 border-transparent hover:text-gray-900 dark:hover:text-white'}`}
              >
                Description
              </button>
              <button 
                onClick={() => setActiveTab('specs')}
                className={`px-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'specs' ? 'text-mog border-mog' : 'text-gray-500 border-transparent hover:text-gray-900 dark:hover:text-white'}`}
              >
                Specifications
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`px-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'reviews' ? 'text-mog border-mog' : 'text-gray-500 border-transparent hover:text-gray-900 dark:hover:text-white'}`}
              >
                Feedback & Reviews
              </button>
            </nav>
          </div>
          
          {activeTab === 'desc' && (
            <div className="py-2 prose dark:prose-invert max-w-none animate-in fade-in">
              <p className="text-gray-600 dark:text-gray-400">
                Elevate your lifestyle with our premium {product.name}. Crafted with precision and attention to detail, this piece represents the pinnacle of modern design. Whether you're looking for performance, style, or reliability, this product delivers on all fronts.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 list-none p-0">
                {['Premium Quality Material', 'Modern Ergonomic Design', 'Vibrant Long-lasting Finish', 'Optimized for Performance'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-mog" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="py-2 animate-in fade-in">
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden max-w-2xl">
                <div className="grid grid-cols-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-bold text-sm uppercase">Category</div>
                  <div className="p-4 font-medium text-gray-900 dark:text-white capitalize">{product.category}</div>
                </div>
                <div className="grid grid-cols-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-bold text-sm uppercase">Availability</div>
                  <div className="p-4 font-medium text-green-600 dark:text-green-500">In Stock</div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-bold text-sm uppercase">Shipping</div>
                  <div className="p-4 font-medium text-gray-900 dark:text-white">Ships in 24 hours</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <ProductReviews productId={product.id} />
          )}

        </div>
      </div>
    </div>
  );
}
