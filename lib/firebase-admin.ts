// import * as admin from 'firebase-admin';

// // Prefer a service account JSON string in env (FIREBASE_SERVICE_ACCOUNT_KEY)
// // Fallback to individual env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
// const serviceAccountKey = (process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string) || undefined;

// if (!admin.apps.length) {
// 	try {
// 		if (serviceAccountKey) {
// 			const serviceAccount = JSON.parse(serviceAccountKey);
// 			admin.initializeApp({
// 				credential: admin.credential.cert(serviceAccount),
// 			});
// 			console.log('✓ Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_KEY');
// 		} else if (
// 			process.env.FIREBASE_PROJECT_ID &&
// 			process.env.FIREBASE_CLIENT_EMAIL &&
// 			process.env.FIREBASE_PRIVATE_KEY
// 		) {
// 			const privateKey = (process.env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, '\n');
// 			admin.initializeApp({
// 				credential: admin.credential.cert({
// 					projectId: process.env.FIREBASE_PROJECT_ID,
// 					clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
// 					privateKey,
// 				}),
// 			});
// 			console.log('✓ Firebase Admin initialized from individual env vars');
// 		} else {
// 			console.warn('⚠️ Firebase Admin not initialized: no service account found in environment variables');
// 		}
// 	} catch (err) {
// 		console.error('Firebase Admin initialization error:', err);
// 		throw err;
// 	}
// }

// export const adminDb = admin.firestore();
// export const adminAuth = admin.auth();
// export default admin;