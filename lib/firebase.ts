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

// Prevent re-initialization during hot reloads
let app;
try {
  if (getApps().length > 0) {
    app = getApp();
  } else if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
  } else {
    console.warn("⚠️ Firebase configuration is missing API Key. Initialization skipped on server.");
    // Return a dummy app or handle it gracefully
    app = {} as any; 
  }
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);
  app = {} as any;
}

import { Firestore } from "firebase/firestore";
import { Auth } from "firebase/auth";
import { FirebaseStorage } from "firebase/storage";

// Firestore & Storage instances
export const auth = ((app && (app as any).options) ? getAuth(app) : null) as Auth;
export const db = ((app && (app as any).options) ? getFirestore(app) : null) as Firestore;
export const storage = ((app && (app as any).options) ? getStorage(app) : null) as FirebaseStorage;


export default app;