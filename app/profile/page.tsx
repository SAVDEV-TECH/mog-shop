"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Settings, 
  ShoppingBag, 
  Heart, 
  ShieldCheck, 
  ChevronRight,
  LogOut,
  Camera
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-mog border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pt-10 pb-20">
      <div className="w-11/12 max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-10">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* User Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-12 bg-white dark:bg-gray-900 rounded-[3rem] p-8 md:p-12 shadow-sm border border-transparent dark:border-gray-800 relative overflow-hidden"
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-mog p-1 overflow-hidden bg-gray-50 dark:bg-gray-800">
                  {user.photoURL ? (
                    <Image 
                      src={user.photoURL} 
                      alt={user.displayName || "User"} 
                      width={128} 
                      height={128} 
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black">
                      {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-mog text-white rounded-full shadow-lg hover:scale-110 transition opacity-0 group-hover:opacity-100">
                  <Camera size={16} />
                </button>
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">{user.displayName || "MogShop Explorer"}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 text-gray-500 font-medium bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full text-xs">
                    <Mail size={14} className="text-mog" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 font-medium bg-green-50 dark:bg-green-900/10 px-3 py-1 rounded-full text-xs text-green-700 dark:text-green-400">
                    <ShieldCheck size={14} />
                    Verified Account
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSignOut}
                className="px-6 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-600 hover:text-white transition group"
              >
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                Sign Out
              </button>
            </div>

            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-mog/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          </motion.div>

          {/* Quick Links */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <Link 
              href="/my-orders"
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-transparent dark:border-gray-800 hover:shadow-xl hover:shadow-blue-900/5 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Order History</h3>
                  <p className="text-sm text-gray-400">Manage recent purchases</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              href="/wishlist"
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-transparent dark:border-gray-800 hover:shadow-xl hover:shadow-red-900/5 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl">
                  <Heart size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Wishlist</h3>
                  <p className="text-sm text-gray-400">Saved items for later</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
