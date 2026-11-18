"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import Script from "next/script";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  ChevronLeft, 
  ShoppingBag, 
  CheckCircle2,
  Lock,
  Package,
  Loader2
} from "lucide-react";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

interface PaystackResponse {
  reference?: string;
  status?: string;
  message?: string;
}

interface CustomerInfo {
  email?: string;
  address?: string;
  phone?: string;
  fullName?: string;
  city?: string;
  state?: string;
}

export default function PaymentPage() {
  const { state, total, dispatch } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "pod" | "">("");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(2000);
  const [paystackPublicKey, setPaystackPublicKey] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(true);

  const grandTotal = total + deliveryFee;

  useEffect(() => {
    if (authLoading) return;

    // Load from sessionStorage (with localStorage fallback)
    const storedInfo = sessionStorage.getItem("customerInfo") || localStorage.getItem("customerInfo");
    if (storedInfo) {
      setCustomerInfo(JSON.parse(storedInfo));
    } else {
      // If no info at all, redirect back
      router.push("/order");
    }

    // Fetch store settings
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "storeConfig"));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setDeliveryFee(data?.['deliveryFee'] || 2000);
          setPaystackPublicKey(data?.['paystackPublicKey'] || "");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, [user, authLoading, router]);

  const authHeaders = async (): Promise<Record<string, string>> => {
    const idToken = user ? await user.getIdToken() : null;
    return idToken ? { Authorization: `Bearer ${idToken}` } : {};
  };

  const cartItemsPayload = () =>
    state.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.images,
    }));

  const createOrderViaApi = async (method: string, paymentRef?: string) => {
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await authHeaders())
        },
        body: JSON.stringify({
          items: cartItemsPayload(),
          customerInfo,
          paymentMethod: method,
          paymentReference: paymentRef || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      return { orderId: data.orderId as string, accessToken: data.accessToken as string };
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  const goToReceipt = (orderId: string, accessToken: string) => {
    dispatch({ type: "CLEAR_CART" });
    sessionStorage.removeItem("customerInfo");
    localStorage.removeItem("customerInfo");
    const params = new URLSearchParams({ id: orderId });
    if (accessToken) params.set("token", accessToken);
    router.push(`/success?${params.toString()}`);
  };

  const completePaystackOrder = async (reference: string) => {
    try {
      const { orderId, accessToken } = await createOrderViaApi("paystack", reference);
      goToReceipt(orderId, accessToken);
    } catch (error: any) {
      // The payment went through; the Paystack webhook will still create the order.
      toast.error(
        `${error.message || "We couldn't confirm your order yet."} Your payment reference is ${reference}. ` +
        `If you were charged, your order will be confirmed by email shortly.`,
        { duration: 12000 }
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPayment = async () => {
    const paystackKey = paystackPublicKey || process.env['NEXT_PUBLIC_PAYSTACK_KEY'] || "";
    if (!paystackKey) {
      toast.error("Payment system not configured. Please contact support.");
      return;
    }
    // @ts-ignore
    if (typeof window === "undefined" || !window.PaystackPop) {
      toast.error("Payment system is still loading. Please try again in a moment.");
      return;
    }

    setLoading(true);

    // 1. Create a server-side checkout session (server decides the amount)
    let checkout: { reference: string; amountKobo: number; email: string };
    try {
      const res = await fetch('/api/checkout/paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ items: cartItemsPayload(), customerInfo }),
      });
      const data = await res.json();
      if (!res.ok || !data.reference) {
        throw new Error(data.error || 'Could not start checkout');
      }
      checkout = data;
    } catch (error: any) {
      toast.error(error.message || "Could not start checkout. Please try again.");
      setLoading(false);
      return;
    }

    // 2. Open Paystack with the server-issued reference and amount
    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: checkout.email || customerInfo!.email || user?.email || '',
      amount: checkout.amountKobo,
      currency: "NGN",
      ref: checkout.reference,
      callback: function (response: PaystackResponse) {
        completePaystackOrder(response.reference || checkout.reference);
      },
      onClose: function () {
        toast("Payment cancelled.");
        setLoading(false);
      },
    });
    handler.openIframe();
  };

  const handlePaymentOnDelivery = async () => {
    setLoading(true);
    try {
      const { orderId, accessToken } = await createOrderViaApi("payment-on-delivery");
      goToReceipt(orderId, accessToken);
    } catch (error: any) {
      toast.error(error.message || "Error placing order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingSettings || (!customerInfo && state.items.length > 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Preparing secure checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pt-10 pb-20">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      
      <div className="w-11/12 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="p-2 bg-white dark:bg-gray-900 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Secure Checkout</h1>
            <p className="text-sm text-gray-500">Review your order and select payment</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Checkout Section */}
          <div className="lg:col-span-7 space-y-6">
            {/* Delivery Info Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-transparent dark:border-gray-800"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Truck size={20} />
                </div>
                <h2 className="text-xl font-bold dark:text-white">Delivery Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Recipient</p>
                  <p className="text-gray-900 dark:text-gray-200 font-medium">{customerInfo?.fullName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Contact</p>
                  <p className="text-gray-900 dark:text-gray-200 font-medium">{customerInfo?.phone}</p>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Destination</p>
                  <p className="text-gray-900 dark:text-gray-200 font-medium">{customerInfo?.address}, {customerInfo?.city}</p>
                </div>
              </div>
            </motion.div>

            {/* Payment Method Selector */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-transparent dark:border-gray-800"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                  <CreditCard size={20} />
                </div>
                <h2 className="text-xl font-bold dark:text-white">Payment Method</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setPaymentMethod("paystack")}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                    paymentMethod === "paystack" 
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-lg shadow-blue-900/5" 
                    : "border-gray-100 dark:border-gray-800 hover:border-gray-200"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === "paystack" ? "border-blue-600" : "border-gray-300"}`}>
                    {paymentMethod === "paystack" && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900 dark:text-white">Digital Payment (Secure)</p>
                    <p className="text-xs text-gray-500">Pay via Card, Bank Transfer, or USSD</p>
                  </div>
                  <div className="flex gap-2 opacity-60">
                    <div className="w-8 h-5 bg-blue-800 rounded-sm" /> {/* Visa icon mockup */}
                    <div className="w-8 h-5 bg-red-600 rounded-sm" />  {/* Mastercard icon mockup */}
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod("pod")}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                    paymentMethod === "pod" 
                    ? "border-mog bg-mog-50/10 dark:bg-mog/10 shadow-lg shadow-mog/5" 
                    : "border-gray-100 dark:border-gray-800 hover:border-gray-200"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === "pod" ? "border-mog" : "border-gray-300"}`}>
                    {paymentMethod === "pod" && <div className="w-3 h-3 bg-mog rounded-full" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900 dark:text-white">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Pay ₦{grandTotal.toLocaleString()} when items arrive</p>
                  </div>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Package size={20} className="text-gray-400" />
                  </div>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Sidebar / Summary */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-transparent dark:border-gray-800 sticky top-24"
            >
              <h2 className="text-xl font-bold mb-6 dark:text-white">Order Summary</h2>
              
              <div className="max-h-60 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-hide">
                {state.items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="relative w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shrink-0">
                      <Image
                        src={item.images || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-contain p-2"
                      />
                      <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-200 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Quality Assured</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-200">₦{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-6 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold text-gray-900 dark:text-gray-200">₦{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-bold text-green-600">
                    {loadingSettings ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      `₦${deliveryFee.toLocaleString()}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-lg pt-3 border-t border-gray-100 dark:border-gray-800 font-extrabold text-gray-900 dark:text-white">
                  <span>Grand Total</span>
                  <span>₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => paymentMethod === "paystack" ? handlePaystackPayment() : handlePaymentOnDelivery()}
                disabled={loading || !paymentMethod}
                className="w-full bg-mog text-white py-5 rounded-[2rem] font-extrabold uppercase tracking-widest text-sm shadow-xl shadow-mog/20 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Lock size={18} />
                    Complete Secure Order
                  </>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-4 py-3 bg-gray-50 dark:bg-gray-800/30 rounded-2xl">
                <ShieldCheck size={18} className="text-green-500" />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Encrypted & Guaranteed</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}