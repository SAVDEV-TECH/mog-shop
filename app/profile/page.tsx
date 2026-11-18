"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  ShoppingBag, 
  Heart, 
  ShieldCheck, 
  ChevronRight,
  LogOut,
  Camera,
  Phone,
  MapPin,
  Save,
  Loader2
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "Rivers",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/signin");
      return;
    }

    const loadUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.exists() ? userDoc.data() : {};
        setProfileForm({
          fullName: (data?.['fullName'] as string) || user.displayName || "",
          phone: (data?.['phone'] as string) || "",
          address: (data?.['address'] as string) || "",
          city: (data?.['city'] as string) || "",
          state: (data?.['state'] as string) || "Rivers",
        });
      } catch (err) {
        console.warn("Could not load saved profile:", err);
        setProfileForm((prev) => ({
          ...prev,
          fullName: user.displayName || "",
        }));
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [user, loading, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (profileForm.phone) {
      const cleanPhone = profileForm.phone.replace(/[\s\-]/g, "");
      const phoneRegex = /^(0[7-9][0-1]\d{8}|\+?234[7-9][0-1]\d{8})$/;
      if (!phoneRegex.test(cleanPhone)) {
        toast.error("Please enter a valid Nigerian phone number (e.g. 08012345678)");
        return;
      }
    }

    setSavingProfile(true);
    try {
      const trimmedName = profileForm.fullName.trim();
      if (trimmedName && trimmedName !== user.displayName) {
        await updateProfile(user, { displayName: trimmedName });
      }
      await setDoc(
        doc(db, "users", user.uid),
        {
          fullName: trimmedName,
          email: user.email || "",
          phone: profileForm.phone.replace(/[\s\-]/g, ""),
          address: profileForm.address.trim(),
          city: profileForm.city.trim(),
          state: profileForm.state.trim() || "Rivers",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast.success("Delivery profile saved!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error("Failed to save profile changes");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      router.push("/");
    } catch {
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
                      {(profileForm.fullName || user.displayName || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-mog text-white rounded-full shadow-lg hover:scale-110 transition opacity-0 group-hover:opacity-100">
                  <Camera size={16} />
                </button>
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                  {profileForm.fullName || user.displayName || "MogShop Explorer"}
                </h2>
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

          {/* Saved Delivery Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-12 bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-transparent dark:border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Delivery Details</h3>
                <p className="text-sm text-gray-500">Auto-filled automatically whenever you check out</p>
              </div>
            </div>

            {loadingProfile ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-mog" size={24} />
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-mog transition dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="08012345678"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-mog transition dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">Delivery Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-5 text-gray-400" size={18} />
                    <textarea
                      rows={2}
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="House number, street name, and area"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-mog transition dark:text-white resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      placeholder="e.g. Port Harcourt"
                      className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-mog transition dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">State</label>
                    <input
                      type="text"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                      placeholder="e.g. Rivers"
                      className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-mog transition dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-8 py-4 bg-mog text-white font-bold rounded-2xl hover:scale-[1.02] transition shadow-lg shadow-mog/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Delivery Info
                  </button>
                </div>
              </form>
            )}
          </motion.div>

          {/* Quick Links */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <Link 
              href="/my-orders"
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-transparent dark:border-gray-800 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex items-center justify-between group"
            >
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <ShoppingBag size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Order History</h3>
                  <p className="text-sm text-gray-400">Manage recent purchases</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                <ChevronRight className="text-gray-400 group-hover:text-white transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link 
              href="/wishlist"
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-transparent dark:border-gray-800 hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500 flex items-center justify-between group"
            >
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-3xl shadow-lg shadow-red-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                  <Heart size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Wishlist</h3>
                  <p className="text-sm text-gray-400">Saved items for later</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all duration-500">
                <ChevronRight className="text-gray-400 group-hover:text-white transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
