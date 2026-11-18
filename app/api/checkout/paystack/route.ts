import { NextRequest, NextResponse } from 'next/server';
import { OrderError, createPaystackCheckout } from '@/lib/orders';

export const runtime = 'nodejs';

/**
 * Starts a Paystack checkout: prices the cart on the server, stores it as a
 * pending checkout, and returns the reference + exact amount (in kobo) the
 * browser must pass to Paystack.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { reference, amountKobo, email, quote } = await createPaystackCheckout(
      body.items,
      body.customerInfo,
      req.headers.get('Authorization'),
      body.couponCode
    );

    return NextResponse.json({
      reference,
      amountKobo,
      email,
      subtotal: quote.subtotal,
      discount: quote.discount || 0,
      couponCode: quote.couponCode || null,
      deliveryFee: quote.deliveryFee,
      total: quote.total,
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Checkout init error:', error);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 });
  }
}
