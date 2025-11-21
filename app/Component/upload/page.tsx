"use client";
import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select an image");

    setLoading(true);
    try {
      // 1. Post the file and metadata to our server upload endpoint (/api/upload)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("price", price);
      formData.append("category", category);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson?.error || 'Upload failed');

      // 2. Optionally save to products via /api/products if upload route didn't already
      // If your /api/upload already creates the product document, skip this step.
      if (!uploadJson.product) {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            price: Number(price),
            category,
            imageUrl: uploadJson.imageUrl,
          }),
        });
        const data = await res.json();
        alert(data.message || uploadJson.message || "Uploaded!");
      } else {
        alert(uploadJson.message || "Uploaded!");
      }
    } catch (err: unknown) {
      console.log('Upload error:', err);
      const message = err instanceof Error ? err.message : String(err);
      alert(message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Upload Product</h1>

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
        className="border p-2 w-full mb-2"
      />

      <label className="sr-only" htmlFor="product-image">Product Image</label>
      <input
        id="product-image"
        aria-label="Product Image"
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
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


