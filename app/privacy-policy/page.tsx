"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Trash2, Mail } from "lucide-react";

export default function PrivacyPolicy() {
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
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Shield size={26} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            At <strong>Mogshops</strong> ("we", "our", or "us"), we respect your privacy and are committed to protecting the personal data you share with us through our web and mobile applications. This Privacy Policy explains how your information is collected, used, disclosed, and safeguarded when you visit our platforms or use our grocery and delivery services.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm space-y-10">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
              <Eye size={20} className="text-blue-500" />
              <h2>1. Information We Collect</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              We collect information that identifies, relates to, or describes you ("Personal Information"). This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300 pl-2">
              <li><strong>Account Credentials:</strong> Full name, email address, phone number, and encrypted password (managed via Firebase Authentication).</li>
              <li><strong>Order & Delivery Details:</strong> Delivery address, city, state, items purchased, and transaction references.</li>
              <li><strong>Payment Data:</strong> Payment confirmations handled securely via third-party processors (e.g., Paystack, OPay). Mogshops does not store raw credit card numbers.</li>
              <li><strong>Device & Technical Info:</strong> Device model, operating system, IP address, and app usage metrics.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
              <Lock size={20} className="text-blue-500" />
              <h2>2. How We Use Your Information</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Your personal information is used exclusively to provide and improve Mogshops services, specifically to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300 pl-2">
              <li>Process transactions, fulfill grocery orders, and manage dispatch/delivery.</li>
              <li>Authenticate your account and maintain session security.</li>
              <li>Send order status updates via SMS, WhatsApp, or email notifications.</li>
              <li>Provide customer support and resolve order inquiries.</li>
              <li>Comply with legal obligations and prevent fraudulent activity.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">3. Data Sharing & Disclosure</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              We do not sell, rent, or trade your personal data. We only share necessary information with trusted third-party service providers:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300 pl-2">
              <li><strong>Firebase (Google Cloud):</strong> For secure database hosting, user authentication, and app analytics.</li>
              <li><strong>Payment Processors (Paystack/OPay):</strong> For verifying and processing customer payments.</li>
              <li><strong>Delivery Logistics Partners:</strong> Driver dispatchers receive your delivery address and contact phone number solely for order fulfillment.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
              <Trash2 size={20} className="text-blue-500" />
              <h2>4. Data Retention & Account Deletion</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              We retain your personal data for as long as your account remains active or as required by financial auditing laws. You have the right to request deletion of your account and associated personal data at any time.
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              You may request account deletion directly inside your Account Settings or by visiting our public request portal at:{" "}
              <Link href="/account-deletion" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                mogshops.com/account-deletion
              </Link>.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">5. Security of Your Data</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              We use industry-standard security measures including SSL/TLS encryption for data in transit and Firebase security rules to protect your database records against unauthorized access, disclosure, or alteration.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-8">
            <div className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
              <Mail size={20} className="text-blue-500" />
              <h2>6. Contact Us</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              If you have any questions, concerns, or data privacy requests, please contact us at:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl text-sm space-y-1">
              <p className="font-semibold text-gray-900 dark:text-white">Mogshops Support</p>
              <p className="text-gray-600 dark:text-gray-400">Email: savde388@gmail.com</p>
              <p className="text-gray-600 dark:text-gray-400">Phone: +234 903 762 4245</p>
              <p className="text-gray-600 dark:text-gray-400">Location: Choba, Port Harcourt, Rivers State, Nigeria</p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
