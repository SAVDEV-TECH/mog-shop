import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Star, Send } from "lucide-react";
import toast from "react-hot-toast";

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Listen for real-time review updates for this exact product
    const q = query(
      collection(db, "products", productId, "reviews"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    });
    return () => unsubscribe();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to leave a review");
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "products", productId, "reviews"), {
        userId: user.uid,
        userName: user.email?.split('@')[0] || "Anonymous",
        rating: newRating,
        comment: newComment,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
      setNewRating(5);
      toast.success("Feedback posted successfully!");
    } catch (error) {
      toast.error("Failed to post feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-2xl font-black text-gray-900 dark:text-white">Customer Feedback ({reviews.length})</h3>
        <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-2xl">
          <Star className="text-yellow-500 fill-yellow-500" size={24} />
          <span className="text-2xl font-black text-yellow-600 dark:text-yellow-500">
            {reviews.length ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : "5.0"}
          </span>
        </div>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide pb-10 relative">
        {reviews.length === 0 ? (
           <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
             <Star className="mx-auto text-gray-300 dark:text-gray-700 mb-2" size={40} />
             <p className="text-gray-500 dark:text-gray-400 font-medium">No feedback yet. Be the first to share your thoughts!</p>
           </div>
        ) : (
          reviews.map((review, idx) => (
            <div key={review.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-3xl shadow-sm flex gap-4 transition-all hover:shadow-md">
               <div className="w-12 h-12 bg-mog/10 text-mog rounded-full flex items-center justify-center font-black uppercase shrink-0 text-lg">
                  {review.userName.charAt(0)}
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <p className="font-bold text-gray-900 dark:text-white truncate">{review.userName}</p>
                     <div className="flex text-yellow-400 gap-0.5 mt-1">
                       {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                       ))}
                     </div>
                   </div>
                   <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400">
                     {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
                   </span>
                 </div>
                 <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">{review.comment}</p>
               </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-[2rem] sticky bottom-0 z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 mb-4">
           {/* Rating Selector */}
           <div className="flex items-center gap-1 bg-white dark:bg-[#0a0a0a] p-2 rounded-2xl border border-gray-100 dark:border-gray-800">
             {[1, 2, 3, 4, 5].map(star => (
               <button
                 key={star}
                 type="button"
                 onClick={() => setNewRating(star)}
                 className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
               >
                 <Star size={24} className={`${star <= newRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200 dark:text-gray-800'}`} />
               </button>
             ))}
           </div>
           {!user && <span className="text-sm font-bold text-red-500">Sign in to review</span>}
        </div>
        
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "Write your feedback or chat..." : "Please sign in to leave feedback..."}
            disabled={!user || isSubmitting}
            className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-gray-800 rounded-3xl p-5 pr-16 resize-none focus:ring-2 focus:ring-mog focus:outline-none text-gray-900 dark:text-white disabled:opacity-50 min-h-[120px]"
          />
          <button
            type="submit"
            disabled={!user || isSubmitting || !newComment.trim()}
            className="absolute right-3 bottom-3 p-4 bg-mog text-white rounded-2xl hover:bg-mog/90 transition-all shadow-xl shadow-mog/20 disabled:opacity-50 disabled:bg-gray-400 disabled:shadow-none hover:scale-105 active:scale-95"
          >
            {isSubmitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send size={20} className="ml-1" />}
          </button>
        </div>
      </form>
    </div>
  );
}
