import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { verifyAdminToken } from "@/lib/adminAuthServer";

// Configure Cloudinary (server-side only)
cloudinary.config({
  cloud_name: process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'], 
  api_key: process.env['CLOUDINARY_API_KEY'],
  api_secret: process.env['CLOUDINARY_API_SECRET'],
});

// Define Cloudinary upload result type
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  [key: string]: unknown;
}

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

export async function POST(req: Request) {
  try {
    // Check authorization
    const authHeader = req.headers.get('Authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    const isAuthorized = await verifyAdminToken(idToken);
    
    if (!isAuthorized) {
      return NextResponse.json({ 
        error: "Unauthorized: Admin access required" 
      }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const wholesaleFile = formData.get("wholesaleFile") as File | null;
    const name = formData.get("name") as string | null;
    const price = formData.get("price") as string | null;
    const wholesalePrice = formData.get("wholesalePrice") as string | null;
    const minWholesaleQty = formData.get("minWholesaleQty") as string | null;
    const category = (formData.get("category") as string) || 'Uncategorized';

    // Validation
    if (!file || !name || !price) {
      return NextResponse.json({ 
        error: "File, name and price are required" 
      }, { status: 400 });
    }

    // Validate prices
    const priceNumber = parseFloat(price);
    const wholesalePriceNumber = wholesalePrice ? parseFloat(wholesalePrice) : null;
    const minQtyNumber = minWholesaleQty ? parseInt(minWholesaleQty) : null;

    if (isNaN(priceNumber)) {
      return NextResponse.json({ 
        error: "Invalid price value" 
      }, { status: 400 });
    }

    console.log("Uploading main file to Cloudinary...");

    // Helper for Cloudinary uploads
    const uploadToCloudinary = async (fileToUpload: File) => {
      const arrayBuffer = await fileToUpload.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "products", resource_type: "auto" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryUploadResult);
          }
        );
        uploadStream.end(buffer);
      });
    };

    // Upload main image
    const uploadResult = await uploadToCloudinary(file);
    
    // Upload wholesale image if provided
    let wholesaleUploadResult = null;
    if (wholesaleFile) {
      console.log("Uploading wholesale file to Cloudinary...");
      wholesaleUploadResult = await uploadToCloudinary(wholesaleFile);
    }

    console.log("Saving product to Firestore...");

    // Prepare product data
    const productData = {
      name: String(name).trim(),
      price: priceNumber,
      wholesalePrice: wholesalePriceNumber,
      minWholesaleQty: minQtyNumber,
      category: String(category).trim(),
      imageUrl: uploadResult.secure_url,
      wholesaleImageUrl: wholesaleUploadResult?.secure_url || null,
      publicId: uploadResult.public_id,
      wholesalePublicId: wholesaleUploadResult?.public_id || null,
      slug: name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''),
      createdAt: serverTimestamp(),
    };

    // Sanitize data before saving
    const sanitizedData = sanitizeData(productData);

    // Save product info in Firestore
    if (!db) throw new Error("Database not initialized");
    const docRef = await addDoc(collection(db, "products"), sanitizedData);

    return NextResponse.json({
      message: "Product uploaded successfully",
      product: {
        id: docRef.id,
        ...sanitizedData
      },
    });
  } catch (err) {
    console.error("Upload error:", err);
    
    if (err instanceof Error) {
      console.error("Error details:", {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
    }
    
    return NextResponse.json({ 
      error: "Upload failed",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}