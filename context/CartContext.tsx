"use client";
import React, { createContext, useContext, useReducer, useMemo, useEffect } from "react";

// ====== Type definitions ======
interface CartItem {
  images?: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  slug: string;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "INCREASE_QUANTITY"; id: string }
  | { type: "DECREASE_QUANTITY"; id: string }
  | { type: "CLEAR_CART" }
  | { type: "SET_CART"; items: CartItem[] };

// ====== Create context ======
const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

const initialState: CartState = {
  items: [],
};

// Key for localStorage
const CART_STORAGE_KEY = "mogshop_cart";

// ====== Reducer ======
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((item) => item.id === action.item.id);
      if (existing) {
        // increase quantity if item already in cart
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.item.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      } else {
        return {
          ...state,
          items: [...state.items, { ...action.item, quantity: 1 }],
        };
      }
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
      };

    case "INCREASE_QUANTITY":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };

    case "DECREASE_QUANTITY":
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.id === action.id
              ? { ...item, quantity: Math.max(item.quantity - 1, 1) }
              : item
          )
          .filter((item) => item.quantity > 0),
      };

    case "CLEAR_CART":
      return initialState;

    case "SET_CART":
      return { ...state, items: action.items };

    default:
      throw new Error(`Unhandled action type`);
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use a temporary state initially for SSR matching
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isCartOpen, setIsCartOpen] = React.useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart.items && Array.isArray(parsedCart.items)) {
          dispatch({ type: "SET_CART", items: parsedCart.items });
        }
      } catch (e) {
        console.error("Failed to load cart from localStorage", e);
      }
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (state.items.length > 0 || localStorage.getItem(CART_STORAGE_KEY)) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Memoized total calculation
  const total = useMemo(
    () =>
      state.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [state.items]
  );

  return (
    <CartContext.Provider value={{ state, dispatch, total, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
};

// ====== Hook ======
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within an CartProvider");
  }
  return context;
};
