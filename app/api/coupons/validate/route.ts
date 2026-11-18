import { NextRequest, NextResponse } from 'next/server';
import { OrderError, evaluateCoupon } from '@/lib/orders';

export const runtime = 'nodejs';

/**
 * POST /api/coupons/validate
 * Validates a promo/discount code against a cart subtotal and returns the
 * computed discount in Naira.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const subtotal = Number(body.subtotal);
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json({ error: 'Valid cart subtotal is required' }, { status: 400 });
    }

    const coupon = await evaluateCoupon(body.code, subtotal);
    if (!coupon) {
      return NextResponse.json({ error: 'Please enter a promo code' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discount: coupon.discount,
      description: coupon.description,
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ valid: false, error: error.message }, { status: error.status });
    }
    console.error('Coupon validation error:', error);
    return NextResponse.json({ valid: false, error: 'Could not validate promo code' }, { status: 500 });
  }
}
