"use client";
import { useCart } from "@/app/Component/ContextCart/page";
import { useAuth } from "@/app/ContextAuth/Authcontext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
// import { CreditCard, Truck } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface PaystackSetupOptions {
  key: string;
  email: string;
  amount: number;
  currency?: string;
  ref?: string;
  callback?: (response: PaystackResponse) => void;
  onClose?: () => void;
}

interface PaystackResponse {
  reference?: string;
  status?: string;
  message?: string;
}

interface PaystackHandler {
  openIframe: () => void;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackSetupOptions) => PaystackHandler;
    };
  }
}

interface CustomerInfo {
  email?: string;
  address?: string;
  phone?: string;
  fullName?: string;
}

export default function PaymentPage() {
  const { state, total, dispatch } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "pod" | "">("");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const deliveryFee = 2000;
  const grandTotal = total + deliveryFee;

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Check if user is authenticated
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", "/payment");
      router.push("/signin");
      return;
    }

    // Get customer info from sessionStorage
    const storedInfo = sessionStorage.getItem("customerInfo");
    if (storedInfo) {
      setCustomerInfo(JSON.parse(storedInfo));
    } else {
      // If no customer info, redirect back to order page
      router.push("/order");
    }
  }, [user, authLoading, router]);

  // Save order to Firestore and send email notification
  const saveOrderToFirebase = async (paymentMethod: string, paymentRef?: string) => {
    try {
      const orderData = {
        userId: user?.uid,
        userEmail: user?.email,
        customerInfo: customerInfo,
        items: state.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.images,
        })),
        subtotal: total,
        deliveryFee: deliveryFee,
        total: grandTotal,
        paymentMethod: paymentMethod,
        paymentReference: paymentRef || null,
        status: paymentMethod === "paystack" ? "paid" : "pending",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      console.log("Order saved with ID: ", docRef.id);

      // Send email notification (you can use a cloud function for this)
      await sendOrderNotification(docRef.id, orderData);

      return docRef.id;
    } catch (error) {
      console.log("Error saving order: ", error);
      throw error;
    }
  };

  // Send email notification (This should ideally be done via a backend/cloud function)
  const sendOrderNotification = async (
    orderId: string,
    orderData: { userEmail?: string | null; total?: number }
  ) => {
    try {
      // You would typically call a cloud function or API endpoint here
      // For now, we'll just log it
      console.log("Sending order notification email...", {
        to: orderData.userEmail,
        orderId: orderId,
        total: orderData.total,
      });

      // Example: Call your cloud function
      // await fetch('/api/send-order-email', {
      //   method: 'POST',
      //   body: JSON.stringify({ orderId, orderData })
      // });
    } catch (error) {
      console.error("Error sending notification: ", error);
    }
  };

  const handlePaystackPayment = async () => {
    setLoading(true);

    // Check if Paystack script is loaded
    if (typeof window.PaystackPop === "undefined") {
      alert("Paystack is not loaded. Please refresh the page and try again.");
      setLoading(false);
      return;
    }

    const handler = window.PaystackPop.setup({
      key: "pk_test_c96cccb18b1d6540ead612acc09289a21aaee16f", // Replace with your Paystack public key
      email: customerInfo!.email || '',
      amount: grandTotal * 100, // Paystack expects amount in kobo
      currency: "NGN",
      ref: "ORD_" + Math.floor(Math.random() * 1000000000) + Date.now(),
      callback: async function (response: PaystackResponse) {
        try {
          // Save order to Firebase
          const orderId = await saveOrderToFirebase("paystack", response.reference);

          alert(
            `✅ Payment successful!\n\nOrder ID: ${orderId}\nReference: ${response.reference}\n\nYou will receive a confirmation email shortly.`
          );

          // Clear cart and customer info
          dispatch({ type: "CLEAR_CART" });
          sessionStorage.removeItem("customerInfo");

          // Redirect to success page or home
          router.push("/");
        } catch (error) {
          alert("Payment successful but there was an error saving your order. Please contact support.");
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
      onClose: function () {
        alert("Payment cancelled");
        setLoading(false);
      },
    });

    handler.openIframe();
  };

  const handlePaymentOnDelivery = async () => {
    const confirmOrder = confirm(
      `📦 Confirm Order\n\nTotal Amount: ₦${grandTotal.toLocaleString()}\n\nYou will pay cash on delivery.\n\nProceed?`
    );

    if (confirmOrder) {
      setLoading(true);
      try {
        // Save order to Firebase
        const orderId = await saveOrderToFirebase("payment-on-delivery");

        alert(
          `✅ Order placed successfully!\n\nOrder ID: ${orderId}\n` +
            `Total: ₦${grandTotal.toLocaleString()}\n` +
            `Payment Method: Cash on Delivery\n` +
            `Delivery Address: ${customerInfo!.address}\n\n` +
            `We'll contact you at ${customerInfo!.phone} for delivery confirmation.\n` +
            `You will receive a confirmation email shortly.`
        );

        // Clear cart and customer info
        dispatch({ type: "CLEAR_CART" });
        sessionStorage.removeItem("customerInfo");

        // Redirect to home
        router.push("/");
      } catch (error) {
        alert("There was an error placing your order. Please try again.");
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCompleteOrder = () => {
    if (!paymentMethod) {
      alert("Please select a payment method");
      return;
    }

    if (paymentMethod === "paystack") {
      handlePaystackPayment();
    } else if (paymentMethod === "pod") {
      handlePaymentOnDelivery();
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center mt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  if (!customerInfo || state.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center mt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6">💳 Payment</h2>

      {/* Customer & Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Delivery Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Name:</p>
            <p className="font-medium">{customerInfo?.fullName}</p>
          </div>
          <div>
            <p className="text-gray-600">Phone:</p>
            <p className="font-medium">{customerInfo?.phone}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-600">Email:</p>
            <p className="font-medium">{customerInfo?.email}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-600">Address:</p>
            <p className="font-medium">{customerInfo?.address}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Order Items ({state.items.length})</h3>
        <div className="space-y-2">
          {state.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium">
                ₦{(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t mt-4 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Delivery Fee:</span>
            <span>₦{deliveryFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t">
            <span>Total:</span>
            <span className="text-green-600">₦{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>

        <div className="space-y-3">
          {/* Paystack Option */}
          <div
            onClick={() => setPaymentMethod("paystack")}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
              paymentMethod === "paystack"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                paymentMethod === "paystack" ? "border-blue-500" : "border-gray-300"
              }`}
            >
              {paymentMethod === "paystack" && (
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              )}
            </div>
            {/* <CreditCard className="mr-3 text-blue-600" size={24} /> */}
            <div>
              <div className="font-medium">Pay with Paystack</div>
              <div className="text-sm text-gray-600">Card, Bank Transfer, USSD</div>
            </div>
          </div>

          {/* Payment on Delivery Option */}
          <div
            onClick={() => setPaymentMethod("pod")}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
              paymentMethod === "pod"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                paymentMethod === "pod" ? "border-blue-500" : "border-gray-300"
              }`}
            >
              {paymentMethod === "pod" && (
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              )}
            </div>
            {/* <Truck className="mr-3 text-green-600" size={24} /> */}
            <div>
              <div className="font-medium">Payment on Delivery</div>
              <div className="text-sm text-gray-600">Pay with cash when you receive your order</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={() => router.back()}
          className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
          disabled={loading}
        >
          Back
        </button>
        <button
          onClick={handleCompleteOrder}
          disabled={loading}
          className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
        >
          {loading ? "Processing..." : `Complete Order - ₦${grandTotal.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}