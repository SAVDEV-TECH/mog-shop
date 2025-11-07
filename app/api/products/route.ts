 // app/api/products/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';



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
  try {
    console.log("Fetching products from Firestore...");
    
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    console.log(`Found ${snapshot.size} products`);

    const products = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const createdAtVal = data['createdAt'] as unknown;

      // Support Firestore Timestamp objects and ISO strings
      let createdAt: string | null = null;
      if (createdAtVal && typeof (createdAtVal as { toDate?: unknown }).toDate === 'function') {
        createdAt = (createdAtVal as { toDate: () => Date }).toDate().toISOString();
      } else if (typeof createdAtVal === 'string') {
        createdAt = createdAtVal;
      }

      return {
        id: doc.id,
        name: (data['name'] as string) || '',
        price: (data['price'] as number) || 0,
        category: (data['category'] as string) || 'Uncategorized',
        imageUrl: (data['imageUrl'] as string) || '',
        createdAt,
      };
    });

    return NextResponse.json(products, { status: 200 });
  } catch (err) {
    console.log("Error fetching products:", err);
    
    if (err instanceof Error) {
      console.log("Error details:", {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
    }
    
    return NextResponse.json({ 
      error: "Failed to fetch products",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}