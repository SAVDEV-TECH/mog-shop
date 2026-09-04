import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json();

    if (!reference || typeof reference !== 'string') {
      return NextResponse.json({ verified: false, error: 'Payment reference is required' }, { status: 400 });
    }

    const paystackSecretKey = process.env['PAYSTACK_SECRET_KEY'];
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return NextResponse.json({ verified: false, error: 'Payment verification service not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Paystack API returned error:', errorData);
      return NextResponse.json(
        { verified: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    const data = await response.json();

    if (data.status && data.data?.status === 'success') {
      return NextResponse.json({
        verified: true,
        amount: data.data.amount / 100, // Convert from kobo to naira
        reference: data.data.reference,
        channel: data.data.channel,
        currency: data.data.currency,
      });
    } else {
      return NextResponse.json(
        { verified: false, error: data.data?.gateway_response || 'Payment was not successful' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { verified: false, error: 'Internal error during payment verification' },
      { status: 500 }
    );
  }
}
