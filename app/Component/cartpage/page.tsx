"use client";
import { useCart } from "@/app/Component/ContextCart/page";

export default function CartPage() {
  const { state, dispatch } = useCart();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">Shopping Cart</h2>
      {state.items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <ul>
          {state.items.map((item) => (
            <li key={item.id} className="flex justify-between border-b p-2">
              <div>
                {item.name} - ${item.price} x {item.quantity}
              </div>
              <button
                onClick={() => dispatch({ type: "REMOVE_ITEM", id: item.id })}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <button 
        onClick={() => dispatch({ type: "CLEAR_CART" })} 
        className="bg-gray-600 text-white px-4 py-2 mt-4 rounded"
      >
        Clear Cart
      </button>
    </div>
  );
}
