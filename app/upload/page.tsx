"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";


export default function UploadPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [wholesaleFile, setWholesaleFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [minWholesaleQty, setMinWholesaleQty] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !name || !price) {
      toast.error("Please fill in main product details");
      return;
    }

    setLoading(true);
    try {
      const idToken = await user?.getIdToken();

      const formData = new FormData();
      formData.append("file", file);
      if (wholesaleFile) formData.append("wholesaleFile", wholesaleFile);
      formData.append("name", name);
      formData.append("price", price);
      formData.append("wholesalePrice", wholesalePrice);
      formData.append("minWholesaleQty", minWholesaleQty);
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

      toast.success(uploadJson.message || "Product uploaded successfully!");
      
      // Reset form
      setName("");
      setPrice("");
      setWholesalePrice("");
      setMinWholesaleQty("");
      setCategory("");
      setFile(null);
      setWholesaleFile(null);
      
    } catch (err: unknown) {
      console.log('Upload error:', err);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white dark:bg-gray-950 rounded-[2rem] shadow-2xl dark:shadow-black border border-gray-100 dark:border-gray-800 mt-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-mog/10 rounded-2xl flex items-center justify-center text-2xl">📦</div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Upload New Product</h1>
          <p className="text-sm text-gray-500">Add retail and wholesale provisions to Mogshops</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Product Name</label>
            <input
              type="text"
              placeholder="e.g. Milo Sachet (500g)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-4 focus:ring-2 focus:ring-mog outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Category</label>
            <input
              type="text"
              placeholder="e.g. Beverages"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-4 focus:ring-2 focus:ring-mog outline-none transition-all"
            />
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[2rem] space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mog" /> Pricing & Wholesale
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Retail Price (₦)</label>
              <input
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-mog outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Wholesale Price (₦)</label>
              <input
                type="number"
                placeholder="Optional"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Min. Bulk Qty</label>
              <input
                type="number"
                placeholder="e.g. 12"
                value={minWholesaleQty}
                onChange={(e) => setMinWholesaleQty(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Main Image (Retail)</label>
            <div className="relative group">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-100 dark:file:bg-gray-800 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-mog/10 transition cursor-pointer"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Wholesale Image (Carton)</label>
            <div className="relative group">
              <input
                type="file"
                onChange={(e) => setWholesaleFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 transition cursor-pointer"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-mog text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-mog/20 hover:scale-[1.02] transform transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing Upload...
            </>
          ) : "Publish Product"}
        </button>
      </div>
    </div>
  );
}


