import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminToken } from "@/lib/adminAuthServer";

const apiKey = (process.env['GEMINI_API_KEY'] || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);

const ProductSchema = z.object({
  name: z.string().nullable(),
  price: z.number().nullable(),
  category: z.string().nullable(),
  description: z.string().nullable().optional(),
  wholesalePrice: z.number().nullable().optional(),
  minWholesaleQty: z.number().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

// Helper to find a real image URL using DuckDuckGo
async function findRealImageUrl(query: string): Promise<string | null> {
  try {
    const url = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}+product+image&o=json`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://duckduckgo.com/',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].image;
    }
  } catch (e) {
    console.warn("DuckDuckGo search failed, trying fallback...");
  }
  
  // Fallback to a high-quality placeholder if search fails
  return null;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const isAuthorized = await verifyAdminToken(idToken);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const { message, audio, mimeType, image, imageMimeType } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const modelNames = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-pro-latest"
    ];

    // Diagnostic: List available models if we hit a wall
    const listAvailableModels = async () => {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env['GEMINI_API_KEY']}`);
        const data = await response.json();
        console.log("📋 Available Models for this Key:", data.models?.map((m: any) => m.name).join(", "));
      } catch (e) {
        console.error("❌ Failed to list models:", e);
      }
    };

    let resultText = "";
    let success = false;

    const prompt = `
      You are a product catalog assistant for Mogshops. 
      Extract product information from the provided inputs (text, audio, or image).
      
      Return a JSON object with:
      - name: string
      - price: number
      - category: string
      - description: string
      - wholesalePrice: number (optional)
      - minWholesaleQty: number (optional)
      
      If a field is missing, use null.
      Format the response as a clean JSON object without markdown blocks.
    `;

    const parts: any[] = [{ text: prompt }];
    if (audio) parts.push({ inlineData: { data: audio, mimeType: mimeType || "audio/webm" } });
    if (image) parts.push({ inlineData: { data: image, mimeType: imageMimeType || "image/jpeg" } });
    if (message) parts.push({ text: `User message context: "${message}"` });

    let lastError: any = null;
    for (const name of modelNames) {
      try {
        console.log(`🤖 Attempting AI parse with model: ${name}...`);
        const model = genAI.getGenerativeModel({ 
          model: name,
          tools: [{ googleSearch: {} }] as any
        });
        const result = await model.generateContent(parts);
        resultText = result.response.text();
        if (resultText) { success = true; break; }
      } catch (e: any) {
        lastError = e;
        console.warn(`⚠️ Model ${name} with tools failed:`, e.message);
        try {
          const modelFallback = genAI.getGenerativeModel({ model: name });
          const resultFallback = await modelFallback.generateContent(parts);
          resultText = resultFallback.response.text();
          if (resultText) { success = true; break; }
        } catch (e2: any) { 
          lastError = e2;
          console.warn(`❌ Model ${name} fallback failed:`, e2.message);
          continue; 
        }
      }
    }

    if (!success) {
      await listAvailableModels();
      return NextResponse.json(
        { error: "AI service failed for all models.", details: lastError?.message },
        { status: 503 }
      );
    }

    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : resultText;
    
    let rawData;
    try {
      rawData = JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON Parse Error. Raw text:", resultText);
      throw new Error("AI returned invalid JSON format.");
    }

    // Robust schema with coercion for numeric fields
    const RobustProductSchema = z.object({
      name: z.string().nullable().default("Unknown Product"),
      price: z.preprocess((val) => {
        if (typeof val === 'string') return parseFloat(val.replace(/[^\d.]/g, ''));
        return val;
      }, z.number().nullable().default(0)),
      category: z.string().nullable().default("General"),
      description: z.string().nullable().optional(),
      wholesalePrice: z.preprocess((val) => {
        if (typeof val === 'string') return parseFloat(val.replace(/[^\d.]/g, ''));
        return val;
      }, z.number().nullable().optional()),
      minWholesaleQty: z.preprocess((val) => {
        if (typeof val === 'string') return parseInt(val.toString().replace(/[^\d]/g, ''), 10);
        return val;
      }, z.number().nullable().optional()),
      imageUrl: z.string().nullable().optional(),
    });

    const validatedData = RobustProductSchema.parse(rawData);

    // If no image was uploaded, try to find one automatically
    if (!image && !validatedData.imageUrl && validatedData.name) {
      console.log(`🔍 AI Agent: Searching for real image for "${validatedData.name}"...`);
      try {
        const foundUrl = await findRealImageUrl(validatedData.name);
        if (foundUrl) {
          console.log(`✅ AI Agent: Found real image: ${foundUrl}`);
          validatedData.imageUrl = foundUrl.trim();
        }
      } catch (imgError) {
        console.warn("Image search failed, but continuing with product data.");
      }
    }

    return NextResponse.json(validatedData);

  } catch (error: any) {
    console.error("AI Parse Error:", error);
    if (error instanceof z.ZodError) {
      console.error("Zod Validation Errors:", error.issues);
      return NextResponse.json({ 
        error: "Data validation failed", 
        details: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ') 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to parse product info", details: error.message }, { status: 500 });
  }
}
