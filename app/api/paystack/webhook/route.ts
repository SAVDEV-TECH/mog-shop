import { NextRequest, NextResponse } from 'next/server';
import { OrderError, completePaystackCheckout, isValidPaystackSignature } from '@/lib/orders';
import { scheduleOrderNotifications } from '@/lib/orderNotifications';

export const runtime = 'nodejs';

/**
 * Paystack webhook (configure in Paystack Dashboard → Settings → API Keys & Webhooks):
 *   https://<your-domain>/api/paystack/webhook
 *
 * Guarantees an order is created for every successful payment, even if the
 * customer closes the tab or loses connection before the browser callback runs.
 * Safe alongside the browser callback: order creation is idempotent per reference.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let signatureOk = false;
  try {
    signatureOk = isValidPaystackSignature(rawBody, req.headers.get('x-paystack-signature'));
  } catch (error) {
    console.error('Paystack webhook: secret key not configured', error);
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
  if (!signatureOk) {
    console.warn('Paystack webhook: invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference;
  try {
    const order = await completePaystackCheckout(reference);
    const notification = order.notification;
    if (notification) {
      console.log(`Paystack webhook created order ${order.orderId} for ${reference}`);
      scheduleOrderNotifications(notification.details, notification.userEmail);
    }
    return NextResponse.json({ received: true, orderId: order.orderId });
  } catch (error) {
    if (error instanceof OrderError && error.status < 500) {
      // Not retryable (unknown reference, amount mismatch, ...). Acknowledge so
      // Paystack stops retrying, but log loudly for manual follow-up.
      console.error(`Paystack webhook: could not create order for ${reference}: ${error.message}`);
      return NextResponse.json({ received: true, error: error.message });
    }
    // Transient failure: non-2xx makes Paystack retry later.
    console.error(`Paystack webhook: transient failure for ${reference}`, error);
    return NextResponse.json({ error: 'Temporary failure' }, { status: 500 });
  }
}
