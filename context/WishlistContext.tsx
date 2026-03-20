"use client";
import React, { createContext, useContext, useReducer, useEffect } from "react";

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  images: string;
  slug: string;
}

interface WishlistState {
  items: WishlistItem[];
}

type WishlistAction =
  | { type: "TOGGLE_ITEM"; item: WishlistItem }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "CLEAR_WISHLIST" }
  | { type: "SET_WISHLIST"; items: WishlistItem[] };

const initialState: WishlistState = {
  items: [],
};

const WISHLIST_STORAGE_KEY = "mogshop_wishlist";

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case "TOGGLE_ITEM": {
      const exists = state.items.find(item => item.id === action.item.id);
      if (exists) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.item.id),
        };
      } else {
        return {
          ...state,
          items: [...state.items, action.item],
        };
      }
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.id),
      };
    case "CLEAR_WISHLIST":
      return initialState;
    case "SET_WISHLIST":
      return { ...state, items: action.items };
    default:
      return state;
  }
}

const WishlistContext = createContext<{
  state: WishlistState;
  dispatch: React.Dispatch<WishlistAction>;
  isInWishlist: (id: string) => boolean;
} | null>(null);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.items && Array.isArray(parsed.items)) {
          dispatch({ type: "SET_WISHLIST", items: parsed.items });
        }
      } catch (e) {
        console.error("Failed to load wishlist", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const isInWishlist = (id: string) => state.items.some(item => item.id === id);

  return (
    <WishlistContext.Provider value={{ state, dispatch, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};
