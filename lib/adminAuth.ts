  // ====== ADMIN AUTH UTILITY (lib/adminAuth.ts) ======
 export const ADMIN_EMAILS = [
   "admin@mogshop.com",
   "savde388@gmail.com", // Replace with your actual admin email
 ];
 
 export const isAdmin = (email: string | null | undefined): boolean => {
   if (!email) return false;
   return ADMIN_EMAILS.includes(email.toLowerCase());
 };