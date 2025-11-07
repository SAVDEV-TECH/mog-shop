 // lib/productClient.ts
"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

// === Get single product by ID ===
export async function getProductById(id: string) {
  const ref = doc(db, "products", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Product not found");
  return { id: snap.id, ...snap.data() };
}

// === Update product by ID ===
export async function updateProduct(id: string, data: Partial<{ name: string; price: number; category: string; imageUrl: string; }>) {
  const ref = doc(db, "products", id);
  await updateDoc(ref, data);
  return { message: "Product updated successfully" };
}

// === Delete product by ID ===
export async function deleteProduct(id: string) {
  const ref = doc(db, "products", id);
  await deleteDoc(ref);
  return { message: "Product deleted successfully" };
}
