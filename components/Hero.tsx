"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, Zap, ShieldCheck, Truck } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative w-full h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden bg-[#050505]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/hero.png"
          alt="MogShop Premium Products"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"></div>
      </div>

      <div className="relative z-10 w-11/12 max-w-7xl mx-auto flex flex-col items-start pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
            <Zap size={14} />
            New Arrivals Shipped Daily
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight">
            Elevate Your <span className="text-mog">Lifestyle</span> with <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">MogShop Luxury</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-lg leading-relaxed font-medium">
            Discover a curated collection of gourmet meats, premium pet essentials, and high-end aesthetics. Quality defined by excellence.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => {
                const element = document.getElementById("shop-section");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-8 py-4 bg-mog text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.05] transition-transform shadow-xl shadow-blue-900/40 group"
            >
              Shop Collection
              <ShoppingBag size={20} className="group-hover:rotate-12 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-white/20 transition-all">
              Our Story
              <ArrowRight size={20} />
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-8 pt-12">
            <div className="flex items-center gap-2 text-gray-400">
              <Truck size={20} className="text-blue-500" />
              <div className="text-sm">
                <p className="font-bold text-gray-200">Express Delivery</p>
                <p className="text-[10px]">Within 24 Hours</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <ShieldCheck size={20} className="text-purple-500" />
              <div className="text-sm">
                <p className="font-bold text-gray-200">Secure Checkout</p>
                <p className="text-[10px]">100% Guaranteed</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
      <div className="absolute top-24 right-1/4 w-48 h-48 bg-purple-600/10 rounded-full blur-[80px]"></div>
    </div>
  );
}
