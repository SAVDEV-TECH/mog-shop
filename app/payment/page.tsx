 "use client";
import { useCart } from "@/app/Component/ContextCart/page";
import { useAuth } from "@/app/ContextAuth/Authcontext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import Backbutton from '@/app/Component/Backbutton/page';
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

  const deliveryFee = 2000;
  const grandTotal = total + deliveryFee;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", "/payment");
      router.push("/signin");
      return;
    }

    const storedInfo = sessionStorage.getItem("customerInfo");
    if (storedInfo) {
      setCustomerInfo(JSON.parse(storedInfo));
    } else {
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

      // Send email notification
      await sendOrderNotification(docRef.id, orderData);

      return docRef.id;
    } catch (error) {
      console.error("Error saving order: ", error);
      throw error;
    }
  };

  interface OrderNotificationData {
    total: number;
    items: any[];
    paymentMethod: string;
    paymentReference: string | null;
    [key: string]: any;
  }

  // Send email notification via API
  const sendOrderNotification = async (orderId: string, orderData: OrderNotificationData) => {
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderDetails: {
            id: orderId,
            total: orderData.total,
            customerName: customerInfo?.fullName,
            customerEmail: customerInfo?.email || user?.email,
            items: orderData.items,
            deliveryAddress: customerInfo?.address,
            phone: customerInfo?.phone,
            paymentMethod: orderData.paymentMethod,
            paymentReference: orderData.paymentReference,
          },
          userEmail: customerInfo?.email || user?.email,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Email notifications sent successfully!');
      } else {
        console.log('❌ Failed to send email notifications:', result.error);
        // Don't throw error - order is still saved, just email failed
      }
    } catch (error) {
      console.log("Error sending notification: ", error);
      // Don't throw error - order is still saved, just email failed
    }
  };

  const handlePaystackPayment = async () => {
    setLoading(true);

    if (typeof window.PaystackPop === "undefined") {
      toast.error("Paystack is not loaded. Please refresh the page and try again.");
      setLoading(false);
      return;
    }

    const handler = window.PaystackPop.setup({
      key: "pk_test_c96cccb18b1d6540ead612acc09289a21aaee16f",
      email: customerInfo!.email || '',
      amount: grandTotal * 100,
      currency: "NGN",
      ref: "ORD_" + Math.floor(Math.random() * 1000000000) + Date.now(),
      callback: async function (response: PaystackResponse) {
        try {
          const orderId = await saveOrderToFirebase("paystack", response.reference);

          toast.success(
            `✅ Payment successful! Order ID: ${orderId}. Reference: ${response.reference}. You will receive a confirmation email shortly.`,
            { duration: 6000 }
          );

          dispatch({ type: "CLEAR_CART" });
          sessionStorage.removeItem("customerInfo");
          router.push("/");
        } catch (error) {
          toast.error("Payment successful but there was an error saving your order. Please contact support.");
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
      onClose: function () {
        toast("Payment cancelled", { icon: "ℹ️" });
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
        const orderId = await saveOrderToFirebase("payment-on-delivery");

        toast.success(
          `✅ Order placed successfully! Order ID: ${orderId}. Total: ₦${grandTotal.toLocaleString()}. We'll contact you shortly.`,
          { duration: 8000 }
        );

        dispatch({ type: "CLEAR_CART" });
        sessionStorage.removeItem("customerInfo");
        router.push("/");
      } catch (error) {
        toast.error("There was an error placing your order. Please try again.");
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCompleteOrder = () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (paymentMethod === "paystack") {
      handlePaystackPayment();
    } else if (paymentMethod === "pod") {
      handlePaymentOnDelivery();
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center mt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

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
    <div className="max-w-3xl mx-auto p-4 text-gray-900 dark:text-gray-100">
      <h2 className="text-3xl font-bold mb-6 dark:text-gray-100">💳 Payment</h2>
      <Backbutton />
      
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-black border border-transparent dark:border-gray-800 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">Delivery Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Name:</p>
            <p className="font-medium dark:text-gray-200">{customerInfo?.fullName}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Phone:</p>
            <p className="font-medium dark:text-gray-200">{customerInfo?.phone}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-600 dark:text-gray-400">Email:</p>
            <p className="font-medium dark:text-gray-200">{customerInfo?.email}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-600 dark:text-gray-400">Address:</p>
            <p className="font-medium dark:text-gray-200">{customerInfo?.address}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-black border border-transparent dark:border-gray-800 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">Order Items ({state.items.length})</h3>
        <div className="space-y-2">
          {state.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="dark:text-gray-300">
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium dark:text-gray-100">
                ₦{(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="dark:text-gray-400">Subtotal:</span>
            <span className="dark:text-gray-100">₦{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="dark:text-gray-400">Delivery Fee:</span>
            <span className="dark:text-gray-100">₦{deliveryFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="dark:text-gray-100">Total:</span>
            <span className="text-green-600 dark:text-green-400">₦{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-black border border-transparent dark:border-gray-800 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Select Payment Method</h3>

        <div className="space-y-3">
          <div
            onClick={() => setPaymentMethod("paystack")}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
              paymentMethod === "paystack"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                paymentMethod === "paystack" ? "border-blue-500" : "border-gray-300 dark:border-gray-600"
              }`}
            >
              {paymentMethod === "paystack" && (
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              )}
            </div>
            <div>
              <div className="font-medium dark:text-gray-100">Pay with Paystack</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Card, Bank Transfer, USSD</div>
            </div>
          </div>

          <div
            onClick={() => setPaymentMethod("pod")}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
              paymentMethod === "pod"
                ? "border-mog bg-mog-50 dark:bg-mog/10"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                paymentMethod === "pod" ? "border-blue-500" : "border-gray-300 dark:border-gray-600"
              }`}
            >
              {paymentMethod === "pod" && (
                <div className="w-3 h-3 rounded-full bg-mog"></div>
              )}
            </div>
            <div>
              <div className="font-medium dark:text-gray-100">Payment on Delivery</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pay with cash when you receive your order</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => router.back()}
          className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-600 transition"
          disabled={loading}
        >
          Back
        </button>
        <button
          onClick={handleCompleteOrder}
          disabled={loading}
          className="flex-1 bg-mog text-white px-4 py-3 rounded-lg font-semibold hover:opacity-95 transition disabled:bg-gray-400"
        >
          {loading ? "Processing..." : `Complete Order - ₦${grandTotal.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}