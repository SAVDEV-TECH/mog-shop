import { adminAuth } from "./firebaseAdmin";
import { isAdmin } from "./adminAuth";

/**
 * Server-side utility to verify a Firebase ID token and check if the user is an admin.
 */
export const verifyAdminToken = async (idToken: string | null): Promise<boolean> => {
  if (!idToken) return false;
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const email = decodedToken.email;
    return isAdmin(email);
  } catch (error) {
    console.error("Error verifying admin token:", error);
    return false;
  }
};
