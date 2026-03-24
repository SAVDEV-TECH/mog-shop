"use client";
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  image?: string;
}

export default function BulkProductUpload({ products, onComplete }: { products: Product[], onComplete?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const normalizeCategory = (cat: string) => {
    let finalCategory = cat.trim();
    if (finalCategory) {
      const normalizedInput = finalCategory.toLowerCase().replace(/s$/i, '');
      const matchingProduct = products.find(p => {
        if (!p.category) return false;
        const existingCat = p.category.trim().toLowerCase().replace(/s$/i, '');
        return existingCat === normalizedInput;
      });
      if (matchingProduct && matchingProduct.category) {
        finalCategory = matchingProduct.category;
      } else {
        finalCategory = finalCategory.charAt(0).toUpperCase() + finalCategory.slice(1);
      }
    }
    return finalCategory;
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleProcessCSV = async () => {
    if (!file) {
      toast.error("Please select a CSV file first");
      return;
    }
    setUploading(true);
    setProgress(0);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim() !== '');
      if (lines.length < 2) {
        toast.error("CSV file must have a header and at least one row");
        setUploading(false);
        return;
      }

      // Simple CSV parser
      const parseLine = (line: string) => {
        const result = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
          if (line[i] === '"') {
             inQuote = !inQuote;
          } else if (line[i] === ',' && !inQuote) {
             result.push(cur);
             cur = '';
          } else {
             cur += line[i];
          }
        }
        result.push(cur);
        return result.map(s => s.trim().replace(/^"|"$/g, ''));
      };

      const headers = parseLine(lines[0] || '').map(h => h.toLowerCase());
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const priceIdx = headers.findIndex(h => h.includes('price'));
      const stockIdx = headers.findIndex(h => h.includes('stock'));
      const catIdx = headers.findIndex(h => h.includes('category'));
      const descIdx = headers.findIndex(h => h.includes('desc'));
      const imgIdx = headers.findIndex(h => h.includes('image'));

      if (nameIdx === -1 || priceIdx === -1) {
        toast.error("CSV must contain 'name' and 'price' columns");
        setUploading(false);
        return;
      }

      const totalRecords = lines.length - 1;
      let successCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const row = parseLine(lines[i] || '');
        if (row.length < 2 || !row[nameIdx]) continue;

        const name = row[nameIdx] || "";
        const price = parseFloat(row[priceIdx] || "0") || 0;
        const stock = stockIdx !== -1 ? parseInt(row[stockIdx] || "0") || 0 : 0;
        let category = catIdx !== -1 ? (row[catIdx] || "Uncategorized") : "Uncategorized";
        const description = descIdx !== -1 ? (row[descIdx] || "") : "";
        const image = imgIdx !== -1 ? (row[imgIdx] || "") : "";

        category = normalizeCategory(category);

        const productData = {
          name,
          price,
          stock,
          category,
          description,
          image: image,
          imageUrl: image,
          slug: generateSlug(name),
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, "products"), productData);
        successCount++;
        setProgress(Math.round(((i) / totalRecords) * 100));
      }

      toast.success(`Successfully uploaded ${successCount} products!`);
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
      toast.error("Failed to process CSV file");
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8 mb-8 border border-blue-100">
      <h3 className="text-xl font-bold mb-4">Bulk Upload Products</h3>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <input 
          type="file" 
          accept=".csv" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100 border p-2 rounded-lg"
        />
        <button 
          onClick={handleProcessCSV} 
          disabled={uploading || !file}
          className="w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {uploading ? `Uploading... ${progress}%` : "Process Bulk Upload"}
        </button>
      </div>
      <p className="text-sm text-gray-500 mt-2">Upload a CSV file with headers: Name, Price, Stock, Category, Description, Image</p>
    </div>
  );
}
