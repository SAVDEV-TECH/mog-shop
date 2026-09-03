"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, CheckCircle2, ShieldAlert, Send } from "lucide-react";

export default function AccountDeletionRequest() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate submission request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Mogshops
        </Link>

        {/* Card Wrapper */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Account Deletion Request</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Request permanent removal of your Mogshops account and personal data.
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle2 size={48} className="text-green-600 dark:text-green-400 mx-auto" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Deletion Request Received</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-md mx-auto">
                We have received your account deletion request for <strong>{email}</strong>. Our support team will process this request within 48 hours and remove your Firebase Auth profile and associated data.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 flex gap-3">
                <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Warning:</strong> Deleting your account is permanent. All saved shipping addresses, order histories, and wishlist items will be permanently erased.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Account Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter the email associated with your account"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Reason for leaving (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us why you wish to delete your account..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-xl transition duration-200 shadow-md active:scale-95 disabled:opacity-50"
              >
                {loading ? "Submitting Request..." : (
                  <>
                    <Send size={18} />
                    Submit Deletion Request
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400">
            Need help? Contact support at <a href="mailto:savde388@gmail.com" className="underline text-gray-600 dark:text-gray-300">savde388@gmail.com</a>
          </div>
        </div>

      </div>
    </div>
  );
}
