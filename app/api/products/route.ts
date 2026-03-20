 // app/api/products/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAllProducts } from '@/lib/products';



// Helper function to sanitize data for Firestore
function sanitizeData(data: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values
    if (value === undefined) continue;

    // Convert NaN to null
    if (typeof value === 'number' && isNaN(value as number)) {
      sanitized[key] = null;
      continue;
    }

    // Keep valid values
    sanitized[key] = value;
  }

  return sanitized;
}

// Helper function to generate a slug from a name
function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// === Create product (POST) ===
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, category, imageUrl } = body;

    // Validate required fields
    if (!name || !price || !imageUrl) {
      return NextResponse.json({ 
        error: "Missing required fields: name, price, imageUrl" 
      }, { status: 400 });
    }

    // Prepare product data
    const productData = {
      name: String(name).trim(),
      price: parseFloat(price), // Ensure it's a number
      category: category ? String(category).trim() : "Uncategorized",
      imageUrl: String(imageUrl).trim(),
      slug: generateSlug(String(name)),
      createdAt: serverTimestamp(),
    };

    // Validate price is a valid number
    if (isNaN(productData.price)) {
      return NextResponse.json({ 
        error: "Invalid price value" 
      }, { status: 400 });
    }

    // Sanitize data before saving
    const sanitizedData = sanitizeData(productData);

    console.log("Attempting to save product:", sanitizedData);

    if (!db) throw new Error("Database not initialized");
  const productsRef = collection(db, 'products');
  const docRef = await addDoc(productsRef, sanitizedData);

    console.log("Product saved successfully with ID:", docRef.id);

    return NextResponse.json({ 
      message: "Product added successfully",
      id: docRef.id 
    }, { status: 201 });
  } catch (err) {
    console.log("Error adding product:", err);
    
    if (err instanceof Error) {
      console.log("Error details:", {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
    }
    
    return NextResponse.json({ 
      error: "Failed to add product",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}

// === Fetch all products (GET) ===
export async function GET() {
  if (!db) {
    console.error("❌ Firestore DB instance is not available on server.");
    return NextResponse.json({ 
      error: "Database connection failed", 
      details: "Firebase configuration might be missing on the server."
    }, { status: 503 });
  }

  try {
    const products = await getAllProducts();
    return NextResponse.json(products, { status: 200 });
  } catch (err: any) {
    console.error("CRITICAL: Error fetching products in API:", err);
    return NextResponse.json({ 
      error: "Failed to fetch products",
      details: err?.message || String(err)
    }, { status: 500 });
  }
}