"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ShoppingBag,
  ExternalLink,
  Calendar,
  CreditCard
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/signin");
      return;
    }

    async function fetchOrders() {
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user?.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-mog border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pt-10 pb-20">
      <div className="w-11/12 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">Order History</h1>
            <p className="text-gray-500 font-medium">Manage your recent purchases and tracking</p>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-transparent dark:border-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300">
            Total Orders: {orders.length}
          </div>
        </div>

        <AnimatePresence>
          {orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-transparent dark:border-gray-800 hover:shadow-xl hover:shadow-blue-900/5 transition-all group"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Order Meta */}
                    <div className="md:w-1/4 space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">#{order.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</p>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                          <Calendar size={14} />
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Recent'}
                        </div>
                      </div>
                      <div className="pt-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          order.status === 'paid' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {order.status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="md:w-2/4 flex -space-x-4 overflow-hidden py-2">
                      {order.items?.slice(0, 4).map((item: any, i: number) => (
                        <div key={i} className="relative w-16 h-16 rounded-2xl border-4 border-white dark:border-gray-900 bg-gray-50 dark:bg-gray-800 overflow-hidden shadow-sm shrink-0">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                      ))}
                      {order.items?.length > 4 && (
                        <div className="w-16 h-16 rounded-2xl border-4 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 z-10">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>

                    {/* Order Actions */}
                    <div className="md:w-1/4 flex flex-col justify-center items-end gap-3">
                      <p className="text-xl font-black text-gray-900 dark:text-white">₦{order.total?.toLocaleString()}</p>
                      <Link
                        href={`/success?id=${order.id}`}
                        className="flex items-center gap-2 px-6 py-3 bg-mog/10 text-mog hover:bg-mog hover:text-white rounded-2xl text-xs font-bold transition-all group/btn"
                      >
                        View Details
                        <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag size={48} className="text-gray-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No orders found</h3>
              <p className="text-gray-500 mb-8 max-w-xs">You haven't placed any orders yet. Start shopping to see your history!</p>
              <Link 
                href="/"
                className="px-10 py-4 bg-mog text-white rounded-[2rem] font-bold shadow-xl shadow-mog/20 hover:scale-105 transition"
              >
                Go to Shop
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
