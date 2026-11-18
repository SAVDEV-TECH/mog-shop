"use client";
import React, { createContext, useContext, useReducer, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

function isValidWishlistItem(item: any): item is WishlistItem {
  return (
    item &&
    typeof item.id === "string" && item.id.trim() !== "" &&
    typeof item.name === "string" && item.name.trim() !== "" &&
    typeof item.price === "number" && isFinite(item.price)
  );
}

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
  const { user } = useAuth();
  const syncedUidRef = useRef<string | null>(null);
  const localLoadedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.items && Array.isArray(parsed.items)) {
          dispatch({ type: "SET_WISHLIST", items: parsed.items.filter(isValidWishlistItem) });
        }
      } catch (e) {
        console.error("Failed to load wishlist", e);
      }
    }
    localLoadedRef.current = true;
  }, []);

  // Merge and sync wishlist from Firestore when user signs in
  useEffect(() => {
    if (!user) {
      syncedUidRef.current = null;
      return;
    }
    let cancelled = false;

    const syncFromCloud = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (cancelled) return;
        const cloudWishlist = userDoc.exists() && Array.isArray(userDoc.data()?.['wishlist'])
          ? (userDoc.data()!['wishlist'] as any[]).filter(isValidWishlistItem)
          : [];

        const mergedMap = new Map<string, WishlistItem>();
        for (const item of cloudWishlist) {
          mergedMap.set(item.id, item);
        }
        for (const localItem of state.items) {
          mergedMap.set(localItem.id, localItem);
        }
        syncedUidRef.current = user.uid;
        dispatch({ type: "SET_WISHLIST", items: Array.from(mergedMap.values()) });
      } catch (e) {
        console.warn("Could not sync wishlist from Firestore:", e);
        syncedUidRef.current = user.uid;
      }
    };

    syncFromCloud();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useEffect(() => {
    if (!localLoadedRef.current) return;
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state));
    if (user && syncedUidRef.current === user.uid) {
      const cleanWishlist = state.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        images: item.images || "",
        slug: item.slug || item.id,
      }));
      setDoc(doc(db, "users", user.uid), { wishlist: cleanWishlist }, { merge: true }).catch(e =>
        console.warn("Could not persist wishlist to Firestore:", e)
      );
    }
  }, [state, user]);

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
