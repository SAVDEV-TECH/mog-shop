"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ShoppingBag, Truck, CreditCard, AlertCircle, HelpCircle } from "lucide-react";

export default function TermsOfService() {
  const lastUpdated = "July 25, 2026";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Mogshops
        </Link>

        {/* Header Banner */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText size={26} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Welcome to <strong>Mogshops</strong>. By accessing or using our website, web app, or mobile applications, you agree to be bound by these Terms of Service. Please read them carefully before placing an order.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm space-y-10">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
              <ShoppingBag size={20} className="text-indigo-500" />
              <h2>1. Account Registration & Use</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              To place orders on Mogshops, you may create an account or check out as a guest. You must be at least 18 years old or under the supervision of a parent/guardian to use our service. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
              <CreditCard size={20} className="text-indigo-500" />
              <h2>2. Pricing, Product Catalog & Orders</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300 pl-2">
              <li><strong>Pricing:</strong> All grocery prices are listed in Nigerian Naira (₦) and include applicable taxes unless specified otherwise. Prices are subject to market fluctuations without prior notice.</li>
              <li><strong>Wholesale Purchases:</strong> Minimum quantity requirements apply for wholesale pricing tiers as specified on individual product listings.</li>
              <li><strong>Order Acceptance:</strong> We reserve the right to cancel or limit any order due to stock unavailability, pricing errors, or suspected fraudulent transactions.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
              <Truck size={20} className="text-indigo-500" />
              <h2>3. Delivery & Dispatch Policies</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Mogshops strives to deliver fresh groceries and provisions promptly to your doorstep:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300 pl-2">
              <li><strong>Delivery Locations:</strong> Deliveries are available across designated service regions in Rivers State (Port Harcourt / Choba) and select areas.</li>
              <li><strong>Recipient Presence:</strong> Someone must be available at the specified delivery address to receive and inspect the order.</li>
              <li><strong>Perishable Goods:</strong> For fresh produce and groceries, inspection must occur immediately upon delivery.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
              <AlertCircle size={20} className="text-indigo-500" />
              <h2>4. Refunds & Return Policy</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              If you receive damaged, defective, or incorrect grocery items, please notify Mogshops customer support within 24 hours of delivery. Refunds or replacements will be processed promptly upon inspection. Non-perishable packaged items carry a standard 7-day return guarantee if unopened and in original packaging.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-8">
            <div className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
              <HelpCircle size={20} className="text-indigo-500" />
              <h2>5. Contact & Customer Support</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              If you have any questions regarding these Terms of Service, please contact our support team:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl text-sm space-y-1">
              <p className="font-semibold text-gray-900 dark:text-white">Mogshops Customer Care</p>
              <p className="text-gray-600 dark:text-gray-400">Email: savde388@gmail.com</p>
              <p className="text-gray-600 dark:text-gray-400">WhatsApp / Phone: +234 903 762 4245</p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
