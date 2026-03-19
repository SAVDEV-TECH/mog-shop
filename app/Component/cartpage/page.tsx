 "use client";
import { useCart } from "@/app/Component/ContextCart/page";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Backbutton from '@/app/Component/Backbutton/page';

export default function CartPage() {
  const { state, dispatch, total } = useCart(); // now includes total
    const router = useRouter();
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">🛒 MogShop Cart</h2>
      <Backbutton />

      {state.items.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {state.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  {item.images && (
                    <Image
                      src={item.images}
                      alt={item.name}
                      width={60}
                      height={60}
                      className="rounded-md object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">₦{item.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() =>
                      dispatch({ type: "DECREASE_QUANTITY", id: item.id })
                    }
                    className="px-2 py-1 bg-gray-300 dark:bg-gray-700 dark:text-gray-100 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                  >
                    −
                  </button>
                  <span className="text-gray-900 dark:text-gray-100">{item.quantity}</span>
                  <button
                    onClick={() =>
                      dispatch({ type: "INCREASE_QUANTITY", id: item.id })
                    }
                    className="px-2 py-1 bg-gray-300 dark:bg-gray-700 dark:text-gray-100 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                  >
                    +
                  </button>
                  <button
                    onClick={() => dispatch({ type: "REMOVE_ITEM", id: item.id })}
                    className="text-red-500 ml-4"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <hr className="my-6 border-gray-300 dark:border-gray-700" />

          {/* Total Section */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Total:</h3>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">₦{total.toLocaleString()}</p>
          </div>

          {/* Buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => dispatch({ type: "CLEAR_CART" })}
              className="bg-mogorange text-white px-4 py-2 rounded"
            >
              Clear Cart
            </button>

            <button
              onClick={() => router.push("/order")}
              className="bg-mog text-white px-4 py-2 rounded"
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

