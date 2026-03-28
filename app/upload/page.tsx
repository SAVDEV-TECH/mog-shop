"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";


export default function UploadPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select an image");
      return;
    }

    setLoading(true);
    try {
      const idToken = await user?.getIdToken();

      // 1. Post the file and metadata to our server upload endpoint (/api/upload)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("price", price);
      formData.append("category", category);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson?.error || 'Upload failed');

      // 2. Optionally save to products via /api/products if upload route didn't already
      // If your /api/upload already creates the product document, skip this step.
      if (!uploadJson.product) {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            name,
            price: Number(price),
            category,
            imageUrl: uploadJson.imageUrl,
          }),
        });
        const data = await res.json();
        toast.success(data.message || uploadJson.message || "Uploaded!");
      } else {
        toast.success(uploadJson.message || "Uploaded!");
      }
    } catch (err: unknown) {
      console.log('Upload error:', err);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white dark:bg-gray-950 rounded-xl shadow-md dark:shadow-black border border-transparent dark:border-gray-800 mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 italic">🚀 Upload Product</h1>

      <label className="sr-only" htmlFor="product-name">Product Name</label>
      <input
        id="product-name"
        aria-label="Product Name"
        type="text"
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 w-full mb-2"
      />

      <label className="sr-only" htmlFor="product-price">Price</label>
      <input
        id="product-price"
        aria-label="Product Price"
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="border p-2 w-full mb-2"
      />

      <label className="sr-only" htmlFor="product-category">Category</label>
      <input
        id="product-category"
        aria-label="Product Category"
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border border-gray-300 dark:border-gray-800 p-3 w-full mb-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-mog focus:outline-none"
      />

      <input
        id="product-image"
        aria-label="Product Image"
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-6 block w-full text-sm text-gray-500 dark:text-gray-400
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          dark:file:bg-gray-800 dark:file:text-blue-400
          hover:file:bg-blue-100 dark:hover:file:bg-gray-700 transition"
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-mog text-white px-4 py-2 rounded"
      >
        {loading ? "Uploading..." : "Upload Product"}
      </button>
    </div>
  );
}


