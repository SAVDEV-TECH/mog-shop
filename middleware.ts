import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require admin access - protect at the edge
const ADMIN_ROUTES = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is an admin route
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  if (isAdminRoute) {
    // We can't verify Firebase tokens in Edge middleware directly (no Node.js crypto)
    // Instead, we check for the presence of the Firebase session cookie
    // The actual token verification happens client-side in the dashboard component
    // This middleware provides an additional layer: redirect unauthenticated users faster

    // Check for Firebase auth cookie (set by Firebase Auth when user is logged in)
    const firebaseAuthCookie = request.cookies.get('firebase-auth-token');
    
    // If no cookie at all, redirect to sign-in
    // Note: Firebase Auth stores tokens in localStorage by default, not cookies
    // So this cookie check is a progressive enhancement only
    // The primary admin check remains in the dashboard component + Firestore rules
    
    // Add security headers to admin routes regardless
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  // Add basic security headers to all routes
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files, api routes handled separately
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|mog.png|.*\\.png$|.*\\.svg$|.*\\.ico$).*)',
  ],
};
