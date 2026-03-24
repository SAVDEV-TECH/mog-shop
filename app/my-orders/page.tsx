"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";

interface Order {
  id: string;
  userId?: string;
  email?: string;
  createdAt?: any;
  status?: string;
  total?: number;
  items?: any[];
  [key: string]: any;
}

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/signin");
      return;
    }

    async function fetchOrders() {
      try {
        // Query by userId (uid)
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user?.uid)
        );
        const snapshot = await getDocs(q);
        let fetchedOrders: Order[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Also try fetching by email as fallback
        if (fetchedOrders.length === 0 && user?.email) {
          const emailQuery = query(
            collection(db, "orders"),
            where("email", "==", user.email)
          );
          const emailSnapshot = await getDocs(emailQuery);
          fetchedOrders = emailSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }

        // Sort in-memory instead of using orderBy (avoids index requirement)
        fetchedOrders.sort((a: Order, b: Order) => {
          const dateA = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
          const dateB = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
          return dateB.getTime() - dateA.getTime();
        });

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user, authLoading, router]);

  // Helper to safely format dates
  const formatDate = (createdAt: any) => {
    try {
      if (!createdAt) return "Recent";
      if (createdAt?.toDate) return createdAt.toDate().toLocaleDateString();
      if (typeof createdAt === "string" || typeof createdAt === "number")
        return new Date(createdAt).toLocaleDateString();
      return "Recent";
    } catch {
      return "Recent";
    }
  };

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
                  <div className="flex flex-col md:flex-row gap-6 border-b border-gray-100 dark:border-gray-800 pb-6 mb-6">
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
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                      <div className="pt-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${order.status === "paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}>
                          {order.status || "Pending"}
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
                      {order.items && order.items.length > 4 && (
                        <div className="w-16 h-16 rounded-2xl border-4 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 z-10">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>

                    {/* Order Actions */}
                    <div className="md:w-1/4 flex flex-col justify-center items-end gap-3">
                      <p className="text-xl font-black text-gray-900 dark:text-white">
                        ₦{order.total?.toLocaleString()}
                      </p>
                      <Link
                        href={`/success?id=${order.id}`}
                        className="flex items-center gap-2 px-6 py-3 bg-mog/10 text-mog hover:bg-mog hover:text-white rounded-2xl text-xs font-bold transition-all group/btn"
                      >
                        View Details
                        <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>

                  {/* Order Tracking Visualizer */}
                  <div className="w-full pt-2">
                     <p className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">Track Order Delivery</p>
                     {order.status === 'cancelled' ? (
                       <div className="text-red-500 font-bold bg-red-50 dark:bg-red-900/10 p-4 rounded-xl text-center uppercase tracking-widest text-sm border border-red-100 dark:border-red-900/30">
                         ❌ This order was cancelled
                       </div>
                     ) : (
                       <div className="flex items-center justify-between relative px-4">
                         {/* Connecting Line */}
                         <div className="absolute left-[30px] right-[30px] top-4 h-1 bg-gray-200 dark:bg-gray-800 -z-10 rounded-full overflow-hidden">
                           <div className="h-full bg-mog transition-all duration-1000" style={{ width: `${(Math.max(["pending", "paid", "delivered"].indexOf(order.status || 'pending'), 0) / 2) * 100}%` }} />
                         </div>
                         
                         {/* Steps */}
                         {["pending", "paid", "delivered"].map((step, stepIdx) => {
                           const isActive = ["pending", "paid", "delivered"].indexOf(order.status || 'pending') >= stepIdx;
                           return (
                             <div key={step} className="flex flex-col items-center gap-3">
                               <div className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center transition-all duration-500 ease-out ${isActive ? 'bg-mog border-mog shadow-lg shadow-mog/30 scale-110' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}>
                                 {isActive && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                               </div>
                               <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-mog' : 'text-gray-400'}`}>{step}</span>
                             </div>
                           );
                         })}
                       </div>
                     )}
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
              <p className="text-gray-500 mb-8 max-w-xs">
                You haven't placed any orders yet. Start shopping to see your history!
              </p>
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