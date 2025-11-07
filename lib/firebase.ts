 // lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {getAuth} from "firebase/auth"

// ✅ Fixed: Using NEXT_PUBLIC_ prefix for client-side access
const firebaseConfig = {
  apiKey: process.env['NEXT_PUBLIC_FIREBASE_API_KEY'],
  authDomain: process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
  projectId: process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
  storageBucket: process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
  appId: process.env['NEXT_PUBLIC_FIREBASE_APP_ID'],
  measurementId: process.env['NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID']
};

// Debug: Log config to check if values are loaded (remove in production)
console.log("Firebase Config Loaded:", {
  apiKey: firebaseConfig.apiKey ? "✅ Present" : "❌ Missing",
  projectId: firebaseConfig.projectId || "❌ Missing",
  authDomain: firebaseConfig.authDomain ? "✅ Present" : "❌ Missing",
});

// Prevent re-initialization during hot reloads
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore & Storage instances
export const auth= getAuth(app)
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;