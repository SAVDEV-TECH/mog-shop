"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Package, X, Loader2, Check, AlertCircle, Plus, BrainCircuit, Mic, Square, Volume2, Search, Edit } from "lucide-react";
import toast from "react-hot-toast";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ProductData {
  name: string;
  price: number;
  category: string;
  description?: string;
  wholesalePrice?: number;
  minWholesaleQty?: number;
  imageUrl?: string;
}

export default function ProductAIAgent({ onProductParsed, products }: { 
  onProductParsed: (data: ProductData, existingId?: string) => void,
  products?: any[] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ProductData | null>(null);
  const [existingProduct, setExistingProduct] = useState<any | null>(null);
  const [step, setStep] = useState<"input" | "review">("input");
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Image state
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        processMedia(blob, "audio");
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Microphone access denied or not available");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processMedia = async (blob?: Blob, type: "audio" | "text" | "image" = "text") => {
    setLoading(true);
    try {
      let body: any = { message: input };
      
      if (type === "audio" && blob) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        await new Promise((resolve) => (reader.onloadend = resolve));
        body.audio = (reader.result as string).split(",")[1];
        body.mimeType = blob.type;
      }

      if (image) {
        const parts = image.split(",");
        if (parts.length > 1) {
          body.image = parts[1];
          const mimeMatch = parts[0]?.match(/:(.*?);/);
          if (mimeMatch) {
            body.imageMimeType = mimeMatch[1];
          }
        }
      }
        
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/ai/parse-product", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.error) {
        let errorMsg = data.error;
        if (data.details?.toLowerCase().includes("quota") || data.details?.toLowerCase().includes("429")) {
          const retryMatch = data.details.match(/retry in ([\d.]+)s/i);
          const seconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
          errorMsg = `AI Quota exceeded. Please wait ${seconds} seconds and try again.`;
        } else if (res.status === 503) {
          errorMsg = "AI Service temporarily busy. Retrying with a different model...";
        }
        throw new Error(errorMsg);
      }

      // Check if product already exists in the catalog
      const existing = products?.find(p => 
        p.name.toLowerCase().trim() === data.name.toLowerCase().trim()
      );
      setExistingProduct(existing || null);

      setParsedData(data);
      setStep("review");
    } catch (err: any) {
      toast.error(err.message || "Failed to process media");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => processMedia();

  const handleConfirm = () => {
    if (parsedData) {
      onProductParsed(parsedData, existingProduct?.id);
      setIsOpen(false);
      setStep("input");
      setParsedData(null);
      setExistingProduct(null);
      setInput("");
      setImage(null);
      toast.success("Product details loaded into form!");
    }
  };

  const handleAutoSave = async () => {
    if (!parsedData) return;
    
    if (existingProduct) {
      // If it exists, just load it into the form for updating
      handleConfirm();
      return;
    }

    setLoading(true);
    try {
      const generateSlug = (name: string) =>
        name.toLowerCase().trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');

      const productData = {
        name: parsedData.name || "",
        price: Number(parsedData.price) || 0,
        wholesalePrice: Number(parsedData.wholesalePrice) || 0,
        minWholesaleQty: Number(parsedData.minWholesaleQty) || 0,
        stock: 100,
        category: parsedData.category || "General",
        description: parsedData.description || "",
        image: parsedData.imageUrl || "",
        imageUrl: parsedData.imageUrl || "",
        wholesaleImageUrl: "",
        slug: generateSlug(parsedData.name || "unnamed"),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "products"), productData);
      
      toast.success("Product instantly saved to catalog!");
      setIsOpen(false);
      setStep("input");
      setParsedData(null);
      setExistingProduct(null);
      setInput("");
      setImage(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to auto-save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            className="mb-6 w-[400px] bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20 dark:border-gray-800/50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-mog via-blue-600 to-indigo-700 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <BrainCircuit size={120} />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                    <Sparkles size={20} className="text-yellow-300 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-tight leading-tight">Mog Intelligence</h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-blue-100 opacity-80">Vision + Voice + Auto-Image v3.5</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {step === "input" ? (
                <div className="space-y-4">
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 leading-relaxed">
                      {isRecording ? "Listening..." : "Upload an image, record audio, or type details."}
                    </p>
                  </div>
                  
                  <div className="relative group">
                    {image && (
                      <div className="absolute -top-2 -left-2 z-20">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="relative"
                        >
                          <img src={image} className="w-20 h-20 object-cover rounded-2xl border-2 border-white shadow-xl" />
                          <button 
                            onClick={() => setImage(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                          >
                            <X size={12} />
                          </button>
                        </motion.div>
                      </div>
                    )}

                    {isRecording ? (
                      <div className="w-full h-40 bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl border border-mog flex flex-col items-center justify-center gap-4">
                        <div className="flex items-center gap-1 h-12">
                          {[...Array(6)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ height: [10, 40, 10] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                              className="w-1.5 bg-mog rounded-full"
                            />
                          ))}
                        </div>
                        <button
                          onClick={stopRecording}
                          className="px-6 py-2 bg-red-500 text-white rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-500/20"
                        >
                          <Square size={14} fill="white" /> Stop
                        </button>
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Describe your product or upload a photo..."
                          className="w-full h-40 p-5 bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-mog/10 focus:border-mog outline-none text-sm transition-all resize-none dark:text-white"
                        />
                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                           <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl hover:bg-mog/10 hover:text-mog transition-all"
                            title="Upload Image"
                          >
                            <Package size={20} />
                          </button>
                           <button
                            onClick={startRecording}
                            className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl hover:bg-mog/10 hover:text-mog transition-all"
                            title="Speak"
                          >
                            <Mic size={20} />
                          </button>
                           <button
                            onClick={handleSend}
                            disabled={loading || (!input.trim() && !image)}
                            className="p-3 bg-mog text-white rounded-2xl shadow-xl shadow-mog/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center min-w-[44px]"
                          >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-4 bg-mog/5 p-4 rounded-[2rem] border border-mog/10">
                    <div className="w-20 h-20 bg-mog/10 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-inner group relative">
                      {image || parsedData?.imageUrl ? (
                        <img src={image || parsedData?.imageUrl || ""} alt="Product" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={32} className="text-mog opacity-40" />
                      )}
                      {!image && !parsedData?.imageUrl && (
                        <button 
                          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(parsedData?.name || "")}+product+image&tbm=isch`, "_blank")}
                          className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[8px] font-bold"
                        >
                          <Search size={12} className="mb-1" />
                          SEARCH WEB
                        </button>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{parsedData?.name || "Unknown Product"}</h4>
                        <button 
                           onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(parsedData?.name || "")}+product+image&tbm=isch`, "_blank")}
                           className="p-1.5 hover:bg-mog/10 text-mog rounded-lg transition-colors"
                           title="Search actual image on web"
                        >
                          <Search size={14} />
                        </button>
                      </div>
                      <p className="text-mog font-black text-xl">₦{parsedData?.price?.toLocaleString() || "0"}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[10px] px-2 py-0.5 bg-mog/10 text-mog rounded-full font-bold uppercase tracking-tighter">{parsedData?.category || "No Category"}</span>
                        {existingProduct ? (
                          <span className="text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-bold uppercase tracking-tighter flex items-center gap-1">
                            <AlertCircle size={10} /> Exists (Update)
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold uppercase tracking-tighter">New Product</span>
                        )}
                      </div>
                      {parsedData?.imageUrl && !image && (
                         <p className="text-[8px] text-green-600 font-bold mt-1 uppercase flex items-center gap-1">
                           <Sparkles size={10} /> Auto-discovered Image
                         </p>
                      )}
                    </div>
                  </div>


                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-[1.5rem] border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Wholesale</p>
                      <p className="font-bold text-gray-700 dark:text-gray-300">₦{parsedData?.wholesalePrice?.toLocaleString() || "N/A"}</p>
                    </div>
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-[1.5rem] border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Min. Qty</p>
                      <p className="font-bold text-gray-700 dark:text-gray-300">{parsedData?.minWholesaleQty || "N/A"} units</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setStep("input")}
                      className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                    >
                      Retry
                    </button>
                    <button 
                      onClick={existingProduct ? handleConfirm : handleAutoSave}
                      className={`flex-[2] py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                        existingProduct 
                          ? "bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-orange-500/20" 
                          : "bg-gradient-to-r from-mog to-blue-600 text-white shadow-mog/20"
                      } hover:scale-[1.02] active:scale-[0.98]`}
                    >
                      {existingProduct ? <><Edit size={18} /> Update Product</> : <><Check size={18} /> Save to Catalog</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-br from-mog via-blue-600 to-indigo-700 text-white rounded-full shadow-[0_16px_32px_-8px_rgba(30,64,175,0.5)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Sparkles size={28} className="relative z-10 group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
}
