"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight, 
  ChevronLeft,
  Truck,
  ShoppingBag
} from "lucide-react";

export default function OrderPage() {
  const { state, total } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", "/order");
      router.push("/signin");
      return;
    }

    setCustomerInfo(prev => ({
      ...prev,
      email: user.email || "",
      fullName: user.displayName || "",
    }));
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleProceedToPayment = () => {
    if (!customerInfo.fullName || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      toast.error("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // ✅ Save userId and userEmail alongside customer info
    sessionStorage.setItem("customerInfo", JSON.stringify({
      ...customerInfo,
      userId: user?.uid,
      userEmail: user?.email,
    }));

    router.push("/payment");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-mog border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] p-4 text-center">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-gray-400" />
        </div>
        <h2 className="text-3xl font-black mb-4 dark:text-white">Your cart is empty</h2>
        <p className="text-gray-500 max-w-sm mb-8">Looks like you haven't added anything to your cart yet.</p>
        <button
          onClick={() => router.push("/")}
          className="bg-mog text-white px-10 py-4 rounded-[2rem] font-bold hover:scale-[1.05] transition shadow-xl shadow-mog/20"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pt-10 pb-20">
      <div className="w-11/12 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => router.push("/cart")}
            className="p-2 bg-white dark:bg-gray-900 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">Shipping Info</h1>
            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Step 1 of 2</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

              {/* Form Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-7 space-y-6"
              >
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-transparent dark:border-gray-800">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-mog/10 text-mog rounded-2xl">
                      <Truck size={24} />
                    </div>
                    <h2 className="text-2xl font-bold dark:text-white">Where should we send it?</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            name="fullName"
                            value={customerInfo.fullName}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-mog transition dark:text-white"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="tel"
                            name="phone"
                            value={customerInfo.phone}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-mog transition dark:text-white"
                            placeholder="0801234567"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="email"
                          name="email"
                          value={customerInfo.email}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-mog transition dark:text-white"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">Delivery Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-6 text-gray-400" size={18} />
                        <textarea
                          name="address"
                          value={customerInfo.address}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-mog transition dark:text-white resize-none"
                          placeholder="House number, street name, and area"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">City</label>
                        <input
                          type="text"
                          name="city"
                          value={customerInfo.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-mog transition dark:text-white"
                          placeholder="e.g. Lagos"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">State</label>
                        <input
                          type="text"
                          name="state"
                          value={customerInfo.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-mog transition dark:text-white"
                          placeholder="e.g. Lagos State"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-10 border-t border-gray-50 dark:border-gray-800 flex gap-4">
                    <button
                      onClick={() => router.push("/cart")}
                      className="flex-1 py-5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-[2rem] hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      Back to Cart
                    </button>
                    <button
                      onClick={handleProceedToPayment}
                      className="flex-[2] py-5 bg-mog text-white font-bold rounded-[2rem] hover:scale-[1.02] shadow-xl shadow-mog/20 transition flex items-center justify-center gap-2"
                    >
                      Payment Method
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Summary Section */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-5"
              >
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-transparent dark:border-gray-800 sticky top-24">
                  <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
                    <ShoppingBag size={20} className="text-mog" />
                    Order Summary
                  </h3>
                  
                  <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                    {state.items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <div className="relative w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden shrink-0">
                          <Image
                            src={item.images || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-200 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">₦{item.price.toLocaleString()} × {item.quantity}</p>
                        </div>
                        <p className="text-sm font-black text-gray-900 dark:text-gray-100">₦{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 border-t border-gray-50 dark:border-gray-800 pt-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                      <span className="font-bold text-gray-900 dark:text-gray-200">₦{total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Delivery</span>
                      <span className="font-bold text-green-600">₦2,000</span>
                    </div>
                    <div className="flex justify-between text-2xl pt-4 border-t border-gray-50 dark:border-gray-800 font-black text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span>₦{(total + 2000).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-mog/5 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-mog">
                    <Truck size={16} />
                    Verified MogShop Shipping
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}