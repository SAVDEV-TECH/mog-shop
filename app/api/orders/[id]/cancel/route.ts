import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { isAdmin } from '@/lib/adminAuth';
import { OrderError, cancelPendingOrder } from '@/lib/orders';

export const runtime = 'nodejs';

/**
 * POST /api/orders/:id/cancel
 * Allows the signed-in owner (or holder of the receipt accessToken, or an admin)
 * to cancel a pending order and atomically restore product stock.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const token =
      (typeof body?.token === 'string' ? body.token : null) ||
      req.nextUrl.searchParams.get('token');

    let uid: string | null = null;
    let admin = false;
    const authHeader = req.headers.get('Authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (idToken) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        uid = decoded.uid;
        admin = decoded['admin'] === true || isAdmin(decoded.email);
      } catch {
        // Continue as anonymous viewer if token is invalid
      }
    }

    const result = await cancelPendingOrder(id, token, { uid, isAdmin: admin });
    return NextResponse.json({ success: true, order: result });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Order cancel error:', error);
    return NextResponse.json({ error: 'Could not cancel order' }, { status: 500 });
  }
}
