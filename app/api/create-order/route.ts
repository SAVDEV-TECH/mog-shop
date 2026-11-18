import { NextRequest, NextResponse } from 'next/server';
import { OrderError, completePaystackCheckout, placeCashOnDeliveryOrder, type PlacedOrder } from '@/lib/orders';
import { scheduleOrderNotifications } from '@/lib/orderNotifications';

export const runtime = 'nodejs';

/**
 * Creates an order.
 *
 *  - Cash on delivery: { paymentMethod: 'payment-on-delivery' | 'pod', items, customerInfo }
 *  - Paystack:         { paymentMethod: 'paystack', paymentReference }
 *      The reference must come from POST /api/checkout/paystack. This call is
 *      idempotent: if the Paystack webhook already created the order, the
 *      existing order is returned instead of creating a duplicate.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { items, customerInfo, paymentMethod, paymentReference } = body;
    const authorization = req.headers.get('Authorization');

    let order: PlacedOrder;
    if (paymentMethod === 'paystack') {
      order = await completePaystackCheckout(paymentReference, {
        rawItems: items,
        rawCustomerInfo: customerInfo,
        authorizationHeader: authorization,
      });
    } else if (paymentMethod === 'payment-on-delivery' || paymentMethod === 'pod') {
      order = await placeCashOnDeliveryOrder(items, customerInfo, authorization);
    } else {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Send emails / alerts after the response, without blocking the customer.
    const notification = order.notification;
    if (notification) {
      scheduleOrderNotifications(notification.details, notification.userEmail);
    }

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      accessToken: order.accessToken,
      total: order.total,
    }, { status: order.created ? 201 : 200 });

  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to place order. Please try again.' }, { status: 500 });
  }
}
