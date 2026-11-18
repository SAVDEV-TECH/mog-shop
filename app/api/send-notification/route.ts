import { NextRequest } from 'next/server';

import { verifyAdminToken } from '@/lib/adminAuthServer';
import { sendOrderNotifications } from '@/lib/orderNotifications';

export const runtime = 'nodejs';

/**
 * Admin-only endpoint to (re)send notifications for an order.
 *
 * Order placement no longer calls this route - notifications are sent directly
 * on the server from lib/orders.ts. This endpoint previously accepted any
 * request flagged `isGuest: true`, which allowed anyone to send branded
 * emails to arbitrary addresses (open relay). It now requires an admin token.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!(await verifyAdminToken(idToken))) {
      console.warn('Unauthorized attempt to access notification API');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderDetails, userEmail } = await request.json();

    if (!orderDetails || !Array.isArray(orderDetails.items) || orderDetails.items.length === 0) {
      return Response.json({ error: 'Invalid order: no items' }, { status: 400 });
    }
    if (typeof orderDetails.total !== 'number' || orderDetails.total <= 0) {
      return Response.json({ error: 'Invalid order total' }, { status: 400 });
    }

    await sendOrderNotifications(orderDetails, userEmail || orderDetails.customerInfo?.email || '');

    return Response.json({ success: true, message: 'Notifications sent successfully' });
  } catch (error) {
    console.error('Notification error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({
      success: false,
      error: message
    }, { status: 500 });
  }
}