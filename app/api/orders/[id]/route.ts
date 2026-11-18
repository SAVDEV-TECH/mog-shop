import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { isAdmin } from '@/lib/adminAuth';
import { getOrderForViewer } from '@/lib/orders';

export const runtime = 'nodejs';

/**
 * GET /api/orders/:id?token=<accessToken>
 *
 * Returns an order to the holder of its access token (e.g. a guest viewing the
 * success page), the signed-in owner, or an admin. Guest orders are no longer
 * publicly readable in Firestore, so this is how receipts are loaded.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = req.nextUrl.searchParams.get('token');

    let uid: string | null = null;
    let admin = false;
    const authHeader = req.headers.get('Authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (idToken) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        uid = decoded.uid;
        admin = isAdmin(decoded.email);
      } catch {
        // Invalid token: continue as anonymous viewer
      }
    }

    const order = await getOrderForViewer(id, token, { uid, isAdmin: admin });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ order }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Order lookup error:', error);
    return NextResponse.json({ error: 'Could not load order' }, { status: 500 });
  }
}
