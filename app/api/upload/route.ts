//  // app/api/upload/route.ts
// import { v2 as cloudinary } from "cloudinary";
// import { NextResponse } from "next/server";
// import { db } from "@/lib/firebase";
// import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// // Configure Cloudinary (server-side only)
// cloudinary.config({
//   cloud_name: process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'], 
//   api_key: process.env['CLOUDINARY_API_KEY'],
//   api_secret: process.env['CLOUDINARY_API_SECRET'],
// });

// // Define Cloudinary upload result type
// interface CloudinaryUploadResult {
//   secure_url: string;
//   public_id: string;
//   [key: string]: unknown;
// }

// // Helper function to sanitize data for Firestore
// function sanitizeData(data: Record<string, unknown>) {
//   const sanitized: Record<string, unknown> = {};

//   for (const [key, value] of Object.entries(data)) {
//     // Skip undefined values
//     if (value === undefined) continue;

//     // Convert NaN to null
//     if (typeof value === 'number' && isNaN(value as number)) {
//       sanitized[key] = null;
//       continue;
//     }

//     // Keep valid values
//     sanitized[key] = value;
//   }

//   return sanitized;
// }

// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("file") as File | null;
//     const name = formData.get("name") as string | null;
//     const price = formData.get("price") as string | null;
//     const category = (formData.get("category") as string) || 'Uncategorized';

//     // Validation
//     if (!file || !name || !price) {
//       return NextResponse.json({ 
//         error: "File, name and price are required" 
//       }, { status: 400 });
//     }

//     // Validate price
//     const priceNumber = parseFloat(price);
//     if (isNaN(priceNumber)) {
//       return NextResponse.json({ 
//         error: "Invalid price value" 
//       }, { status: 400 });
//     }

//     console.log("Uploading file to Cloudinary...");

//     // Convert file to buffer
//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     // Upload to Cloudinary
//     const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
//       const uploadStream = cloudinary.uploader.upload_stream(
//         { 
//           folder: "products",
//           resource_type: "auto"
//         },
//         (error, result) => {
//           if (error) {
//             console.error("Cloudinary upload error:", error);
//             reject(error);
//           } else {
//             console.log("Cloudinary upload successful:", result?.secure_url);
//             resolve(result as CloudinaryUploadResult);
//           }
//         }
//       );
//       uploadStream.end(buffer);
//     });

//     console.log("Saving product to Firestore...");

//     // Prepare product data
//     const productData = {
//       name: String(name).trim(),
//       price: priceNumber,
//       category: String(category).trim(),
//       imageUrl: uploadResult.secure_url,
//       publicId: uploadResult.public_id, // Store for potential deletion later
//       createdAt: serverTimestamp(),
//     };

//     // Sanitize data before saving
//     const sanitizedData = sanitizeData(productData);

//     console.log("Product data to save:", sanitizedData);

//     // Save product info in Firestore
//     const docRef = await addDoc(collection(db, "products"), sanitizedData);

//     console.log("Product saved successfully with ID:", docRef.id);

//     return NextResponse.json({
//       message: "Product uploaded successfully",
//       product: {
//         id: docRef.id,
//         name: sanitizedData.name,
//         price: sanitizedData.price,
//         category: sanitizedData.category,
//         imageUrl: sanitizedData.imageUrl,
//       },
//     });
//   } catch (err) {
//     console.error("Upload error:", err);
    
//     if (err instanceof Error) {
//       console.error("Error details:", {
//         message: err.message,
//         name: err.name,
//         stack: err.stack
//       });
//     }
    
//     return NextResponse.json({ 
//       error: "Upload failed",
//       details: err instanceof Error ? err.message : String(err)
//     }, { status: 500 });
//   }
// }