import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

interface OrderItemInput {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      items, 
      customerInfo, 
      paymentMethod, 
      paymentReference,
      deliveryFee: clientDeliveryFee 
    } = body;

    // 1. Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }

    if (!customerInfo || !customerInfo.fullName || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      return NextResponse.json({ error: 'Missing required customer delivery information' }, { status: 400 });
    }

    if (!['paystack', 'payment-on-delivery', 'pod'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // 2. Identify user or guest
    const authHeader = req.headers.get('Authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    let userId = 'guest';
    let userEmail = customerInfo.email;
    let isGuest = true;

    if (idToken) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        userId = decoded.uid;
        userEmail = decoded.email || customerInfo.email;
        isGuest = false;
      } catch (err) {
        console.warn('ID token verification failed, falling back to guest:', err);
      }
    }

    // 3. Fetch store settings for authoritative delivery fee
    let authoritativeDeliveryFee = 2000;
    try {
      const settingsDoc = await adminDb.collection('settings').doc('storeConfig').get();
      if (settingsDoc.exists) {
        authoritativeDeliveryFee = settingsDoc.data()?.['deliveryFee'] ?? 2000;
      }
    } catch (err) {
      console.warn('Could not fetch storeConfig deliveryFee, using default 2000:', err);
    }

    // 4. Validate & recalculate product prices and check stock from Firestore
    const validatedItems = [];
    let serverSubtotal = 0;

    for (const item of items as OrderItemInput[]) {
      if (!item.id || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json({ error: `Invalid item format in order` }, { status: 400 });
      }

      const productDoc = await adminDb.collection('products').doc(item.id).get();
      if (!productDoc.exists) {
        return NextResponse.json({ error: `Product "${item.name}" was not found in our catalog.` }, { status: 400 });
      }

      const prodData = productDoc.data()!;
      const basePrice = typeof prodData['price'] === 'number' ? prodData['price'] : Number(prodData['price']) || 0;
      const wholesalePrice = prodData['wholesalePrice'] ? Number(prodData['wholesalePrice']) : null;
      const minWholesaleQty = prodData['minWholesaleQty'] ? Number(prodData['minWholesaleQty']) : null;

      // Determine correct price (support wholesale if qualified)
      let effectivePrice = basePrice;
      if (wholesalePrice && minWholesaleQty && item.quantity >= minWholesaleQty) {
        effectivePrice = wholesalePrice;
      }

      // Check stock if tracked
      const currentStock = typeof prodData['stock'] === 'number' ? prodData['stock'] : null;
      if (currentStock !== null && currentStock < item.quantity) {
        return NextResponse.json({
          error: `Sorry, "${prodData['name'] || item.name}" only has ${currentStock} item(s) left in stock.`
        }, { status: 400 });
      }

      const itemTotal = effectivePrice * item.quantity;
      serverSubtotal += itemTotal;

      validatedItems.push({
        id: item.id,
        name: prodData['name'] || item.name,
        price: effectivePrice,
        quantity: item.quantity,
        image: prodData['imageUrl'] || prodData['image'] || item.image || '',
      });
    }

    const serverGrandTotal = serverSubtotal + authoritativeDeliveryFee;

    // 5. If Paystack, verify payment reference server-side
    const normalizedMethod = paymentMethod === 'pod' ? 'payment-on-delivery' : paymentMethod;
    if (normalizedMethod === 'paystack') {
      if (!paymentReference) {
        return NextResponse.json({ error: 'Payment reference is required for digital payments' }, { status: 400 });
      }

      const paystackSecretKey = process.env['PAYSTACK_SECRET_KEY'];
      if (!paystackSecretKey) {
        return NextResponse.json({ error: 'Paystack secret key not configured on server' }, { status: 500 });
      }

      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(paymentReference)}`,
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.status || verifyData.data?.status !== 'success') {
        return NextResponse.json({ 
          error: verifyData.data?.gateway_response || 'Payment verification failed' 
        }, { status: 400 });
      }

      const paidAmountNaira = verifyData.data.amount / 100;
      if (Math.abs(paidAmountNaira - serverGrandTotal) > 2) {
        console.error(`Amount mismatch: expected ₦${serverGrandTotal}, received ₦${paidAmountNaira}`);
        return NextResponse.json({ 
          error: 'Paid amount does not match order grand total' 
        }, { status: 400 });
      }
    }

    // 6. Run Firestore transaction to decrement stock atomically and save order
    const orderRef = adminDb.collection('orders').doc();

    await adminDb.runTransaction(async (transaction) => {
      // Re-read stock inside transaction for consistency
      for (const item of validatedItems) {
        const prodRef = adminDb.collection('products').doc(item.id);
        const prodSnap = await transaction.get(prodRef);
        if (prodSnap.exists) {
          const pData = prodSnap.data()!;
          if (typeof pData['stock'] === 'number') {
            if (pData['stock'] < item.quantity) {
              throw new Error(`Insufficient stock for ${pData['name']}`);
            }
            transaction.update(prodRef, {
              stock: FieldValue.increment(-item.quantity)
            });
          }
        }
      }

      // Create order document
      const orderPayload = {
        userId,
        userEmail,
        isGuest,
        customerInfo: {
          fullName: customerInfo.fullName,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city || '',
          state: customerInfo.state || 'Rivers',
        },
        items: validatedItems,
        subtotal: serverSubtotal,
        deliveryFee: authoritativeDeliveryFee,
        total: serverGrandTotal,
        paymentMethod: normalizedMethod,
        paymentReference: paymentReference || null,
        status: normalizedMethod === 'paystack' ? 'paid' : 'pending',
        createdAt: FieldValue.serverTimestamp(),
      };

      transaction.set(orderRef, orderPayload);
    });

    // 7. Trigger background notification
    const orderDataForNotification = {
      id: orderRef.id,
      customerName: customerInfo.fullName,
      customerEmail: customerInfo.email,
      phone: customerInfo.phone,
      deliveryAddress: `${customerInfo.address}, ${customerInfo.city || ''}`,
      items: validatedItems,
      subtotal: serverSubtotal,
      deliveryFee: authoritativeDeliveryFee,
      total: serverGrandTotal,
      paymentMethod: normalizedMethod,
      paymentReference: paymentReference || null,
      customerInfo: customerInfo,
      userEmail,
      isGuest,
    };

    // Send notification in background without blocking response
    fetch(`${req.nextUrl.origin}/api/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
      },
      body: JSON.stringify({
        orderDetails: orderDataForNotification,
        userEmail,
        isGuest,
      }),
    }).catch((notifErr) => {
      console.warn('Background notification error (order succeeded):', notifErr);
    });

    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      total: serverGrandTotal,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to place order. Please try again.'
    }, { status: 500 });
  }
}
