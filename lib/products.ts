import { db } from './firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, where, limit } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  price: number;
  wholesalePrice?: number;
  minWholesaleQty?: number;
  stock?: number;
  rating?: number;
  reviewCount?: number;
  description?: string;
  category: string;
  imageUrl: string;
  wholesaleImageUrl?: string;
  slug: string;
  createdAt?: string | null;
}

function mapProductDoc(id: string, data: Record<string, unknown>): Product {
  const createdAtVal = data['createdAt'];

  let createdAt: string | null = null;
  if (createdAtVal && typeof (createdAtVal as any).toDate === 'function') {
    createdAt = (createdAtVal as any).toDate().toISOString();
  } else if (typeof createdAtVal === 'string') {
    createdAt = createdAtVal;
  }

  return {
    id,
    name: (data['name'] as string) || '',
    price: (data['price'] as number) || 0,
    wholesalePrice: (data['wholesalePrice'] as number) || undefined,
    minWholesaleQty: (data['minWholesaleQty'] as number) || undefined,
    stock: typeof data['stock'] === 'number' ? (data['stock'] as number) : undefined,
    rating: typeof data['rating'] === 'number' ? (data['rating'] as number) : undefined,
    reviewCount: typeof data['reviewCount'] === 'number' ? (data['reviewCount'] as number) : undefined,
    description: typeof data['description'] === 'string' ? (data['description'] as string) : undefined,
    category: (data['category'] as string) || 'Uncategorized',
    imageUrl: (data['imageUrl'] as string) || (data['image'] as string) || '',
    wholesaleImageUrl: (data['wholesaleImageUrl'] as string) || undefined,
    slug: (data['slug'] as string) || id,
    createdAt,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  if (!db) throw new Error("Firestore Database is not initialized");
  const productsRef = collection(db, 'products');
  const q = query(productsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => mapProductDoc(d.id, d.data()));
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!db) throw new Error("Firestore Database is not initialized");
  const docRef = doc(db, 'products', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return mapProductDoc(docSnap.id, docSnap.data());
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!db) throw new Error("Firestore Database is not initialized");
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  if (!docSnap) return null;
  return mapProductDoc(docSnap.id, docSnap.data());
}
