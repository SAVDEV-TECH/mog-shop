"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  ShoppingBag, 
  ArrowRight, 
  Package, 
  Truck, 
  Calendar,
  CreditCard,
  MapPin
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        router.push("/");
        return;
      }

      try {
        const docRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-mog border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium italic">Verifying your order...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pt-10 pb-20">
      <div className="w-11/12 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl shadow-blue-900/10 border border-transparent dark:border-gray-800 overflow-hidden">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-mog p-12 text-center relative overflow-hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 100 }}
              className="relative z-10 inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-md rounded-full border-4 border-white/30 mb-6"
            >
              <CheckCircle2 size={48} className="text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative z-10"
            >
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Order Confirmed!</h1>
              <p className="text-blue-100 font-medium">Thank you for shopping with MogShop</p>
            </motion.div>
            
            {/* Decorative background shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl -ml-32 -mb-32"></div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Order Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                    <Package size={20} className="text-mog" />
                    Order Details
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Order ID</span>
                      <span className="font-bold text-gray-900 dark:text-gray-200">#{orderId?.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Placed on</span>
                      <span className="font-bold text-gray-900 dark:text-gray-200">
                        {order?.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Processing...'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Payment Method</span>
                      <span className="font-bold text-mog uppercase tracking-wider text-xs">{order?.paymentMethod || 'POD'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                    <MapPin size={20} className="text-mog" />
                    Shipping Address
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">{order?.customerInfo?.fullName}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {order?.customerInfo?.address}<br />
                      {order?.customerInfo?.city}, {order?.customerInfo?.state || 'NG'}<br />
                      {order?.customerInfo?.phone}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <Link 
                    href="/my-orders"
                    className="flex items-center gap-2 text-mog font-bold hover:underline"
                  >
                    View in My Orders
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                  <ShoppingBag size={20} className="text-mog" />
                  Purchased Items
                </h2>
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                  {order?.items?.map((item: any, i: number) => (
                    <div key={i} className="flex gap-4 items-center">
                      <div className="relative w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">₦{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shipping</span>
                      <span className="font-bold text-green-600">₦{order?.deliveryFee?.toLocaleString() || '2,000'}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black text-gray-900 dark:text-white pt-2">
                      <span>Total Paid</span>
                      <span>₦{order?.total?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-widest">
                  <Truck size={18} />
                  Expected Delivery: 24 - 48 Hours
                </div>
              </div>
            </div>

            <div className="mt-12 pt-12 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4">
              <Link 
                href="/"
                className="flex-1 bg-mog text-white py-5 rounded-[2rem] font-bold text-center hover:scale-[1.02] transition shadow-xl shadow-mog/20"
              >
                Continue Shopping
              </Link>
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 py-5 rounded-[2rem] font-bold text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-mog border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium italic">Loading your order details...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
