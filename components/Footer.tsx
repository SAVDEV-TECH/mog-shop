"use client";

import Link from "next/link";
import { FaWhatsapp, FaInstagram, FaTwitter, FaFacebook } from "react-icons/fa";
import { Mail, Phone, MapPin, ShieldCheck, Truck, RefreshCcw } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-gray-800 pt-16 pb-8 transition-colors">
      <div className="w-11/12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link href="/" className="inline-block text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
              MOG<span className="text-mog">SHOPS</span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
              Nigeria's premium destination for quality groceries and everyday essentials. Experience shopping redefined with speed and trust.
            </p>
            <div className="flex gap-4">
              {[
                { icon: FaWhatsapp, href: "https://wa.me/2349037624245" },
                { icon: FaInstagram, href: "#" },
                { icon: FaTwitter, href: "#" },
                { icon: FaFacebook, href: "#" },
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-mog hover:bg-mog/10 transition-all"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6">Explore</h3>
            <ul className="space-y-4">
              {['Shop All', 'Offers & Deals', 'Wholesale', 'Become a Vendor'].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-mog transition-colors">{link}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6">Information</h3>
            <ul className="space-y-4">
              {['Shipping Policy', 'Refund Policy', 'Terms of Service', 'Privacy Policy'].map((link) => (
                <li key={link}>
                  <Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-mog transition-colors">{link}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-mog shrink-0 mt-0.5" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Rivers State, Port Harcourt,<br />Choba, Behind Anko Hotel.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-mog shrink-0" />
                <p className="text-sm text-gray-500 dark:text-gray-400">+234 903 762 4245</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-mog shrink-0" />
                <p className="text-sm text-gray-500 dark:text-gray-400">savde388@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Value Props Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-y border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
              <Truck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold dark:text-white">Same Day Delivery</h4>
              <p className="text-xs text-gray-500">For orders within Lagos</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold dark:text-white">Secure Payments</h4>
              <p className="text-xs text-gray-500">Pay on delivery or card</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
              <RefreshCcw size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold dark:text-white">7-Day Guarantee</h4>
              <p className="text-xs text-gray-500">Hassle-free returns</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 gap-4">
          <p className="text-xs text-gray-400 font-medium">
            &copy; {currentYear} MogShops Nigeria. All rights reserved. Built for quality.
          </p>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 grayscale opacity-50">
               <div className="w-8 h-5 bg-gray-200 dark:bg-gray-800 rounded-sm" />
               <div className="w-8 h-5 bg-gray-200 dark:bg-gray-800 rounded-sm" />
               <div className="w-8 h-5 bg-gray-200 dark:bg-gray-800 rounded-sm" />
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
