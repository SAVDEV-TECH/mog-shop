import 'server-only';
import * as admin from 'firebase-admin';

const firebaseAdminConfig = process.env['FIREBASE_SERVICE_ACCOUNT_JSON'] 
  ? JSON.parse(process.env['FIREBASE_SERVICE_ACCOUNT_JSON'])
  : null;

if (!admin.apps.length && firebaseAdminConfig) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseAdminConfig),
    databaseURL: `https://${firebaseAdminConfig.project_id}.firebaseio.com`
  });
} else if (!admin.apps.length) {
    // Fallback if no service account is provided, but we are on GCP or similar environment
    admin.initializeApp();
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
