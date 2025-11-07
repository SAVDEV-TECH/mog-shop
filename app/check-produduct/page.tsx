// Create: app/check-products/page.tsx
"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CheckProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        const data = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(data);
        console.log("📦 All products:", data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkProducts();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Product Database Check</h1>
        
        {products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xl text-gray-600 mb-4">❌ No products found in database!</p>
            <p className="text-gray-500">You need to add products first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-green-600 font-semibold">✅ Found {products.length} products</p>
            
            {products.map((product, index) => (
              <div key={product.id} className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-bold text-lg mb-2">Product {index + 1}: {product.name || "Unnamed"}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> {product.id}
                  </div>
                  <div>
                    <span className="font-medium">Price:</span> ₦{product.price?.toLocaleString() || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Stock:</span> {product.stock || 0}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> {product.category || "N/A"}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Image field:</span>{" "}
                    <code className="bg-yellow-100 px-2 py-1 rounded">
                      {product.image ? product.image : "❌ EMPTY or MISSING"}
                    </code>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Images field (old):</span>{" "}
                    <code className="bg-yellow-100 px-2 py-1 rounded">
                      {product.images ? product.images : "N/A"}
                    </code>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">All fields:</span>
                    <pre className="bg-gray-800 text-green-400 p-2 rounded mt-1 overflow-x-auto text-xs">
                      {JSON.stringify(product, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 