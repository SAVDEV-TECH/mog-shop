import { db } from './firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, where, limit } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  slug: string;
  createdAt?: string | null;
}

export async function getAllProducts(): Promise<Product[]> {
  if (!db) throw new Error("Firestore Database is not initialized");
  const productsRef = collection(db, 'products');
  const q = query(productsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const createdAtVal = data['createdAt'];

    let createdAt: string | null = null;
    if (createdAtVal && typeof (createdAtVal as any).toDate === 'function') {
      createdAt = (createdAtVal as any).toDate().toISOString();
    } else if (typeof createdAtVal === 'string') {
      createdAt = createdAtVal;
    }

    return {
      id: doc.id,
      name: (data['name'] as string) || '',
      price: (data['price'] as number) || 0,
      category: (data['category'] as string) || 'Uncategorized',
      imageUrl: (data['imageUrl'] as string) || '',
      slug: (data['slug'] as string) || doc.id,
      createdAt,
    };
  });
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!db) throw new Error("Firestore Database is not initialized");
  const docRef = doc(db, 'products', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  const createdAtVal = data['createdAt'];

  let createdAt: string | null = null;
  if (createdAtVal && typeof (createdAtVal as any).toDate === 'function') {
    createdAt = (createdAtVal as any).toDate().toISOString();
  } else if (typeof createdAtVal === 'string') {
    createdAt = createdAtVal;
  }

  return {
    id: docSnap.id,
    name: (data['name'] as string) || '',
    price: (data['price'] as number) || 0,
    category: (data['category'] as string) || 'Uncategorized',
    imageUrl: (data['imageUrl'] as string) || '',
    slug: (data['slug'] as string) || docSnap.id,
    createdAt,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!db) throw new Error("Firestore Database is not initialized");
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  const createdAtVal = data['createdAt'];

  let createdAt: string | null = null;
  if (createdAtVal && typeof (createdAtVal as any).toDate === 'function') {
    createdAt = (createdAtVal as any).toDate().toISOString();
  } else if (typeof createdAtVal === 'string') {
    createdAt = createdAtVal;
  }

  return {
    id: doc.id,
    name: (data['name'] as string) || '',
    price: (data['price'] as number) || 0,
    category: (data['category'] as string) || 'Uncategorized',
    imageUrl: (data['imageUrl'] as string) || '',
    slug: (data['slug'] as string) || doc.id,
    createdAt,
  };
}
