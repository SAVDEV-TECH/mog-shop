 // ====== ORDER PAGE (order/page.tsx) ======
 // ====== ORDER PAGE (order/page.tsx) ======
"use client";
import { useCart } from "@/app/Component/ContextCart/page";
import { useAuth } from "@/app/ContextAuth/Authcontext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";


export default function OrderPage() {
  const { state, total } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Check if user is authenticated
    if (!user) {
      // Store intended destination
      sessionStorage.setItem("redirectAfterLogin", "/order");
      // Redirect to sign in
      router.push("/signin");
      return;
    }

    // Pre-fill email and name if user is logged in
    setCustomerInfo(prev => ({
      ...prev,
      email: user.email || "",
      fullName: user.displayName || "",
    }));
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleProceedToPayment = () => {
    // Validation
    if (!customerInfo.fullName || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Store customer info in sessionStorage for payment page
    sessionStorage.setItem("customerInfo", JSON.stringify(customerInfo));
    
    // Navigate to payment page
    router.push("/payment");
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  // This should not show if redirected, but just in case
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Redirecting to sign in...</p>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center">
        <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Your cart is empty</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Add some items to your cart before placing an order.</p>
        <button
          onClick={() => router.push("/")}
          className="bg-mog text-white px-6 py-2 rounded-lg"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 dark:text-gray-100">📋 Order Details</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Order Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-black border border-transparent dark:border-gray-800 p-6">
          <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">Order Summary</h3>
          
          <div className="space-y-3 mb-4">
            {state.items.map((item) => (
              <div key={item.id} className="flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                {item.images && (
                  <Image
                    src={item.images}
                    alt={item.name}
                    width={50}
                    height={50}
                    className="rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium dark:text-gray-100">{item.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ₦{item.price.toLocaleString()} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold dark:text-gray-100">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="dark:text-gray-100">₦{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Delivery Fee:</span>
              <span className="dark:text-gray-100">₦2,000</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="dark:text-gray-100">Total:</span>
              <span className="text-green-600 dark:text-green-400">₦{(total + 2000).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right: Customer Information Form */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-black border border-transparent dark:border-gray-800 p-6">
          <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">Delivery Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={customerInfo.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-mog"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={customerInfo.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-mog"
                placeholder="john@example.com"
                
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Using your account email</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={customerInfo.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-mog"
                placeholder="0801234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={customerInfo.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-mog"
                rows={3}
                placeholder="Enter your full delivery address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">City</label>
                <input
                  type="text"
                  name="city"
                  value={customerInfo.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-mog"
                  placeholder="Port Harcourt"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">State</label>
                <input
                  type="text"
                  name="state"
                  value={customerInfo.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-mog"
                  placeholder="Rivers"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => router.back()}
              className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-600 transition"
            >
              Back to Cart
            </button>
            <button
              onClick={handleProceedToPayment}
              className="flex-1 bg-mog text-white px-4 py-3 rounded-lg font-semibold hover:opacity-95 transition"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

