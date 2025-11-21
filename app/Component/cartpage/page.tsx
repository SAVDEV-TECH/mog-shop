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
      <h2 className="text-2xl font-bold mb-4">🛒 MogShop Cart</h2>
      <Backbutton />

      {state.items.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {state.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center bg-gray-100 rounded-lg p-3 shadow-sm"
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
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-gray-600">₦{item.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() =>
                      dispatch({ type: "DECREASE_QUANTITY", id: item.id })
                    }
                    className="px-2 py-1 bg-gray-300 rounded"
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      dispatch({ type: "INCREASE_QUANTITY", id: item.id })
                    }
                    className="px-2 py-1 bg-gray-300 rounded"
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

          <hr className="my-6 border-gray-300" />

          {/* Total Section */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Total:</h3>
            <p className="text-xl font-bold">₦{total.toLocaleString()}</p>
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

