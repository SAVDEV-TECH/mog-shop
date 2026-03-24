 "use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProductDetailsPage from "../ProductDetailpage"; // ✅ correct relative path

interface Product {
  id: string;
  name: string;
  price: number;
  rating?: number;
  category: string;
  imageUrl: string;
  slug: string;
  description?: string;
  stock?: number;
}

export default function ProductPageWrapper({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      try {
        const q = query(
          collection(db, "products"),
          where("slug", "==", slug)
        );
        const snapshot = await getDocs(q);

        const docData = snapshot.docs[0];
        if (docData) {
          setProduct({ id: docData.id, ...docData.data() } as Product);
        } else {
          console.warn("No product found for slug:", slug);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="text-center p-10 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Product not found</p>
        <p className="text-gray-500 dark:text-gray-400">
          The product you're looking for might have been moved or deleted.
        </p>
      </div>
    </div>
  );

  return <ProductDetailsPage product={product} />;
}

// import { useEffect, useState } from "react";
// import { collection, query, where, getDocs } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import ProductDetailsPage from "./ProductDetailpage";

// interface Product {
//   id: string;
//   name: string;
//   price: number;
//   rating?: number;
//   category: string;
//   imageUrl: string;
//   slug: string;
//   description?: string;
//   stock?: number;
// }

// export default function ProductPageWrapper({ slug }: { slug: string }) {
//   const [product, setProduct] = useState<Product | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!slug) return;

//     const fetchProduct = async () => {
//       try {
//         const q = query(
//           collection(db, "products"),
//           where("slug", "==", slug)
//         );
//         const snapshot = await getDocs(q);

//         if (!snapshot.empty) {
//           const docData = snapshot.docs[0];
//           setProduct({ id: docData.id, ...docData.data() } as Product);
//         } else {
//           console.warn("No product found for slug:", slug);
//         }
//       } catch (err) {
//         console.error("Error fetching product:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProduct();
//   }, [slug]);

//   if (loading) return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
//       <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
//     </div>
//   );

//   if (!product) return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
//       <div className="text-center p-10 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
//         <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Product not found</p>
//         <p className="text-gray-500 dark:text-gray-400">
//           The product you're looking for might have been moved or deleted.
//         </p>
//       </div>
//     </div>
//   );

//   return <ProductDetailsPage product={product} />;
// }