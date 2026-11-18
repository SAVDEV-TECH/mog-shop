import 'server-only';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import type { DocumentReference } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from './firebaseAdmin';
import type { OrderNotificationDetails } from './orderNotifications';

/**
 * Server-side order logic shared by:
 *  - POST /api/checkout/paystack  (start a Paystack checkout session)
 *  - POST /api/create-order       (browser callback after payment / cash on delivery)
 *  - POST /api/paystack/webhook   (Paystack server-to-server confirmation)
 *
 * Guarantees:
 *  - Prices, delivery fee and totals are always computed on the server.
 *  - A Paystack reference can only ever produce ONE order (idempotent), so the
 *    browser callback and the webhook can both fire safely, and references
 *    cannot be replayed to create extra "paid" orders.
 *  - Every order gets a random accessToken so guests can view their own
 *    receipt without making orders publicly readable.
 */

const DEFAULT_DELIVERY_FEE = 2000;
const MAX_LINE_ITEMS = 100;
const MAX_QUANTITY = 10000;
const REFERENCE_PATTERN = /^[A-Za-z0-9_.=-]{6,100}$/;

export class OrderError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
    this.name = 'OrderError';
  }
}

export interface OrderItemInput {
  id: string;
  name?: string;
  quantity: number;
  image?: string;
}

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

export interface OrderOwner {
  userId: string;
  userEmail: string;
  isGuest: boolean;
}

export interface ValidatedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderQuote {
  items: ValidatedItem[];
  subtotal: number;
  discount?: number;
  couponCode?: string | null;
  deliveryFee: number;
  total: number;
}

export interface PlacedOrder {
  orderId: string;
  accessToken: string;
  total: number;
  /** false when the order already existed (duplicate callback / webhook retry) */
  created: boolean;
  /** present only when created === true */
  notification?: { details: OrderNotificationDetails; userEmail: string };
}

// ───────────────────────── Validation ─────────────────────────

function cleanString(value: unknown, field: string, maxLength: number, required: boolean): string {
  if (value === undefined || value === null || value === '') {
    if (required) throw new OrderError(`Missing required field: ${field}`);
    return '';
  }
  if (typeof value !== 'string') throw new OrderError(`Invalid value for ${field}`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new OrderError(`Missing required field: ${field}`);
  if (trimmed.length > maxLength) throw new OrderError(`${field} is too long`);
  return trimmed;
}

export function validateCustomerInfo(input: unknown): CustomerInfo {
  if (!input || typeof input !== 'object') {
    throw new OrderError('Missing required customer delivery information');
  }
  const ci = input as Record<string, unknown>;
  const info: CustomerInfo = {
    fullName: cleanString(ci['fullName'], 'fullName', 120, true),
    email: cleanString(ci['email'], 'email', 254, true),
    phone: cleanString(ci['phone'], 'phone', 30, true),
    address: cleanString(ci['address'], 'address', 300, true),
    city: cleanString(ci['city'], 'city', 100, false),
    state: cleanString(ci['state'], 'state', 100, false) || 'Rivers',
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) {
    throw new OrderError('Please provide a valid email address');
  }
  return info;
}

export function validateItems(input: unknown): OrderItemInput[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new OrderError('Order must contain at least one item');
  }
  if (input.length > MAX_LINE_ITEMS) {
    throw new OrderError('Too many items in a single order');
  }
  return input.map((raw) => {
    const item = (raw || {}) as Record<string, unknown>;
    const id = item['id'];
    const quantity = item['quantity'];
    if (typeof id !== 'string' || !id || id.includes('/')) {
      throw new OrderError('Invalid item format in order');
    }
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0 || quantity > MAX_QUANTITY) {
      throw new OrderError('Invalid item quantity in order');
    }
    return {
      id,
      quantity,
      name: typeof item['name'] === 'string' ? item['name'] : undefined,
      image: typeof item['image'] === 'string' ? item['image'] : undefined,
    };
  });
}

export function validateReference(reference: unknown): string {
  if (typeof reference !== 'string' || !REFERENCE_PATTERN.test(reference)) {
    throw new OrderError('A valid payment reference is required');
  }
  return reference;
}

/** Identify the caller from an optional Firebase ID token; falls back to guest. */
export async function resolveOwner(authorizationHeader: string | null, fallbackEmail: string): Promise<OrderOwner> {
  const idToken = authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.substring(7) : null;
  if (idToken) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      return { userId: decoded.uid, userEmail: decoded.email || fallbackEmail, isGuest: false };
    } catch (err) {
      console.warn('ID token verification failed, falling back to guest:', err);
    }
  }
  return { userId: 'guest', userEmail: fallbackEmail, isGuest: true };
}

// ───────────────────────── Pricing & Coupons ─────────────────────────

interface CouponRule {
  type: 'percent' | 'fixed';
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
  active?: boolean;
  description?: string;
}

const DEFAULT_COUPONS: Record<string, CouponRule> = {
  WELCOME10: {
    type: 'percent',
    value: 10,
    minSubtotal: 5000,
    maxDiscount: 5000,
    active: true,
    description: '10% off orders over ₦5,000 (up to ₦5,000)',
  },
  MOG500: {
    type: 'fixed',
    value: 500,
    minSubtotal: 10000,
    active: true,
    description: '₦500 off orders of ₦10,000 or more',
  },
};

export async function evaluateCoupon(
  rawCode: unknown,
  subtotal: number
): Promise<{ code: string; discount: number; description: string } | null> {
  if (rawCode === undefined || rawCode === null || rawCode === '') return null;
  if (typeof rawCode !== 'string') throw new OrderError('Invalid promo code');
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;
  if (!/^[A-Z0-9_-]{2,32}$/.test(code)) {
    throw new OrderError('Invalid promo code');
  }

  let rule: CouponRule | undefined;
  try {
    const snap = await adminDb.collection('coupons').doc(code).get();
    if (snap.exists) {
      const d = snap.data()!;
      rule = {
        type: d['type'] === 'percent' ? 'percent' : 'fixed',
        value: Number(d['value']) || 0,
        minSubtotal: d['minSubtotal'] ? Number(d['minSubtotal']) : undefined,
        maxDiscount: d['maxDiscount'] ? Number(d['maxDiscount']) : undefined,
        active: d['active'] !== false,
        description: typeof d['description'] === 'string' ? d['description'] : undefined,
      };
    }
  } catch {
    // Fall back to default coupons if Firestore lookup fails
  }
  if (!rule) {
    rule = DEFAULT_COUPONS[code];
  }
  if (!rule || rule.active === false || !(rule.value > 0)) {
    throw new OrderError(`Promo code "${code}" is invalid or expired`);
  }
  if (rule.minSubtotal && subtotal < rule.minSubtotal) {
    throw new OrderError(`Promo code "${code}" requires a minimum subtotal of ₦${rule.minSubtotal.toLocaleString()}`);
  }

  let discount = rule.type === 'percent' ? Math.round((subtotal * rule.value) / 100) : Math.round(rule.value);
  if (rule.maxDiscount && discount > rule.maxDiscount) {
    discount = rule.maxDiscount;
  }
  discount = Math.min(discount, subtotal);

  return {
    code,
    discount,
    description: rule.description || (rule.type === 'percent' ? `${rule.value}% discount` : `₦${rule.value.toLocaleString()} discount`),
  };
}

async function getDeliveryFee(): Promise<number> {
  try {
    const settingsDoc = await adminDb.collection('settings').doc('storeConfig').get();
    const fee = settingsDoc.exists ? Number(settingsDoc.data()?.['deliveryFee']) : NaN;
    return Number.isFinite(fee) && fee >= 0 ? fee : DEFAULT_DELIVERY_FEE;
  } catch (err) {
    console.warn(`Could not fetch storeConfig deliveryFee, using default ${DEFAULT_DELIVERY_FEE}:`, err);
    return DEFAULT_DELIVERY_FEE;
  }
}

/** Recalculate every price from Firestore (never trust the client) and pre-check stock. */
export async function buildQuote(items: OrderItemInput[], rawCouponCode?: unknown): Promise<OrderQuote> {
  const validatedItems: ValidatedItem[] = [];
  let subtotal = 0;

  for (const item of items) {
    const productDoc = await adminDb.collection('products').doc(item.id).get();
    if (!productDoc.exists) {
      throw new OrderError(`Product "${item.name || item.id}" was not found in our catalog.`);
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
    if (!(effectivePrice > 0)) {
      throw new OrderError(`"${prodData['name'] || item.name}" is not available for purchase right now.`);
    }

    // Check stock if tracked
    const currentStock = typeof prodData['stock'] === 'number' ? prodData['stock'] : null;
    if (currentStock !== null && currentStock < item.quantity) {
      throw new OrderError(`Sorry, "${prodData['name'] || item.name}" only has ${currentStock} item(s) left in stock.`);
    }

    subtotal += effectivePrice * item.quantity;
    validatedItems.push({
      id: item.id,
      name: prodData['name'] || item.name || 'Product',
      price: effectivePrice,
      quantity: item.quantity,
      image: prodData['imageUrl'] || prodData['image'] || item.image || '',
    });
  }

  const appliedCoupon = await evaluateCoupon(rawCouponCode, subtotal);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const couponCode = appliedCoupon ? appliedCoupon.code : null;
  const deliveryFee = await getDeliveryFee();

  return {
    items: validatedItems,
    subtotal,
    discount,
    couponCode,
    deliveryFee,
    total: Math.max(0, subtotal - discount) + deliveryFee,
  };
}

// ───────────────────────── Paystack ─────────────────────────

function getPaystackSecret(): string {
  const secret = process.env['PAYSTACK_SECRET_KEY'];
  if (!secret) throw new OrderError('Payment service is not configured on the server', 500);
  return secret;
}

async function verifyPaystackTransaction(reference: string): Promise<{ amountKobo: number; currency: string }> {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${getPaystackSecret()}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.status || data?.data?.status !== 'success') {
    throw new OrderError(data?.data?.gateway_response || 'Payment verification failed', 402);
  }
  return { amountKobo: Number(data.data.amount), currency: String(data.data.currency || '') };
}

/** Verify the HMAC-SHA512 signature Paystack sends with every webhook. */
export function isValidPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha512', getPaystackSecret()).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Step 1 of a Paystack checkout: price the cart on the server and save it as a
 * pending checkout. The browser must use the returned reference and amount.
 * Saving the cart server-side is what allows the webhook to create the order
 * even if the customer closes the tab right after paying.
 */
export async function createPaystackCheckout(
  rawItems: unknown,
  rawCustomerInfo: unknown,
  authorizationHeader: string | null,
  rawCouponCode?: unknown
): Promise<{ reference: string; amountKobo: number; email: string; quote: OrderQuote }> {
  const items = validateItems(rawItems);
  const customerInfo = validateCustomerInfo(rawCustomerInfo);
  const owner = await resolveOwner(authorizationHeader, customerInfo.email);
  getPaystackSecret(); // fail fast if payments are not configured

  const quote = await buildQuote(items, rawCouponCode);
  const reference = `MOG_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

  await adminDb.collection('pendingCheckouts').doc(reference).set({
    ...owner,
    customerInfo,
    items: quote.items,
    subtotal: quote.subtotal,
    discount: quote.discount || 0,
    couponCode: quote.couponCode || null,
    deliveryFee: quote.deliveryFee,
    total: quote.total,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  });

  return { reference, amountKobo: Math.round(quote.total * 100), email: customerInfo.email, quote };
}

/**
 * Step 2 of a Paystack checkout. Safe to call any number of times for the same
 * reference (browser callback, webhook, retries): only the first call creates
 * the order, later calls return the existing order.
 *
 * `legacy` supports browsers still running the previous checkout code (e.g. a
 * cached PWA) that paid without a pending checkout session.
 */
export async function completePaystackCheckout(
  rawReference: unknown,
  legacy?: { rawItems: unknown; rawCustomerInfo: unknown; authorizationHeader: string | null; rawCouponCode?: unknown }
): Promise<PlacedOrder> {
  const reference = validateReference(rawReference);
  const lockRef = adminDb.collection('paymentReferences').doc(reference);

  // Fast path: already processed.
  const existing = await readLock(lockRef);
  if (existing) return existing;

  const pendingSnap = await adminDb.collection('pendingCheckouts').doc(reference).get();

  let quote: OrderQuote;
  let customerInfo: CustomerInfo;
  let owner: OrderOwner;

  if (pendingSnap.exists) {
    const pending = pendingSnap.data()!;
    quote = {
      items: pending['items'],
      subtotal: pending['subtotal'],
      discount: pending['discount'] || 0,
      couponCode: pending['couponCode'] || null,
      deliveryFee: pending['deliveryFee'],
      total: pending['total'],
    };
    customerInfo = pending['customerInfo'];
    owner = { userId: pending['userId'], userEmail: pending['userEmail'], isGuest: pending['isGuest'] };
  } else if (legacy) {
    // Check if this reference was already used by an order created before reference locking existed.
    const previous = await adminDb.collection('orders').where('paymentReference', '==', reference).limit(1).get();
    const prevDoc = previous.docs[0];
    if (prevDoc) {
      const d = prevDoc.data();
      return { orderId: prevDoc.id, accessToken: d['accessToken'] || '', total: d['total'], created: false };
    }

    const items = validateItems(legacy.rawItems);
    customerInfo = validateCustomerInfo(legacy.rawCustomerInfo);
    owner = await resolveOwner(legacy.authorizationHeader, customerInfo.email);
    quote = await buildQuote(items, legacy.rawCouponCode);
  } else {
    throw new OrderError('Checkout session not found for this payment reference', 404);
  }

  const payment = await verifyPaystackTransaction(reference);
  if (payment.currency && payment.currency !== 'NGN') {
    throw new OrderError('Unsupported payment currency', 402);
  }
  const expectedKobo = Math.round(quote.total * 100);
  if (payment.amountKobo < expectedKobo) {
    console.error(`Amount mismatch for ${reference}: expected ${expectedKobo} kobo, received ${payment.amountKobo} kobo`);
    throw new OrderError('Paid amount does not match order grand total', 402);
  }

  return finalizeOrder({
    quote,
    customerInfo,
    owner,
    paymentMethod: 'paystack',
    paymentReference: reference,
    lockRef,
    pendingRef: pendingSnap.exists ? pendingSnap.ref : null,
  });
}

// ───────────────────────── Cash on delivery ─────────────────────────

export async function placeCashOnDeliveryOrder(
  rawItems: unknown,
  rawCustomerInfo: unknown,
  authorizationHeader: string | null,
  rawCouponCode?: unknown
): Promise<PlacedOrder> {
  const items = validateItems(rawItems);
  const customerInfo = validateCustomerInfo(rawCustomerInfo);
  const owner = await resolveOwner(authorizationHeader, customerInfo.email);
  const quote = await buildQuote(items, rawCouponCode);

  return finalizeOrder({
    quote,
    customerInfo,
    owner,
    paymentMethod: 'payment-on-delivery',
    paymentReference: null,
    lockRef: null,
    pendingRef: null,
  });
}

// ───────────────────────── Shared transaction ─────────────────────────

async function readLock(lockRef: DocumentReference): Promise<PlacedOrder | null> {
  const snap = await lockRef.get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  return { orderId: data['orderId'], accessToken: data['accessToken'], total: data['total'], created: false };
}

async function finalizeOrder(args: {
  quote: OrderQuote;
  customerInfo: CustomerInfo;
  owner: OrderOwner;
  paymentMethod: 'paystack' | 'payment-on-delivery';
  paymentReference: string | null;
  lockRef: DocumentReference | null;
  pendingRef: DocumentReference | null;
}): Promise<PlacedOrder> {
  const { quote, customerInfo, owner, paymentMethod, paymentReference, lockRef, pendingRef } = args;
  const isPaid = paymentMethod === 'paystack';
  const orderRef = adminDb.collection('orders').doc();
  const accessToken = crypto.randomBytes(24).toString('hex');

  const result = await adminDb.runTransaction(async (tx) => {
    // ── Reads (Firestore requires all reads before writes) ──
    if (lockRef) {
      const lockSnap = await tx.get(lockRef);
      if (lockSnap.exists) {
        const d = lockSnap.data()!;
        return { orderId: d['orderId'], accessToken: d['accessToken'], total: d['total'], created: false } as PlacedOrder;
      }
      // Orders created before reference locking existed
      const previous = await tx.get(adminDb.collection('orders').where('paymentReference', '==', paymentReference).limit(1));
      const prevDoc = previous.docs[0];
      if (prevDoc) {
        const d = prevDoc.data();
        return { orderId: prevDoc.id, accessToken: d['accessToken'] || '', total: d['total'], created: false } as PlacedOrder;
      }
    }

    const productSnaps = await Promise.all(
      quote.items.map((item) => tx.get(adminDb.collection('products').doc(item.id)))
    );

    // ── Writes ──
    let stockShortfall = false;
    quote.items.forEach((item, i) => {
      const snap = productSnaps[i];
      if (!snap || !snap.exists) return;
      const stock = snap.data()!['stock'];
      if (typeof stock !== 'number') return;
      if (stock < item.quantity) {
        if (!isPaid) throw new OrderError(`Insufficient stock for ${item.name}`, 409);
        // Customer has already paid: never drop the order, flag it for the admin instead.
        stockShortfall = true;
      }
      tx.update(snap.ref, { stock: Math.max(0, stock - item.quantity) });
    });

    tx.set(orderRef, {
      userId: owner.userId,
      userEmail: owner.userEmail,
      isGuest: owner.isGuest,
      customerInfo,
      items: quote.items,
      subtotal: quote.subtotal,
      discount: quote.discount || 0,
      couponCode: quote.couponCode || null,
      deliveryFee: quote.deliveryFee,
      total: quote.total,
      paymentMethod,
      paymentReference,
      status: isPaid ? 'paid' : 'pending',
      accessToken,
      ...(stockShortfall ? { stockShortfall: true } : {}),
      createdAt: FieldValue.serverTimestamp(),
    });

    if (lockRef) {
      tx.set(lockRef, {
        orderId: orderRef.id,
        accessToken,
        total: quote.total,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    if (pendingRef) {
      tx.update(pendingRef, { status: 'completed', orderId: orderRef.id, completedAt: FieldValue.serverTimestamp() });
    }

    return { orderId: orderRef.id, accessToken, total: quote.total, created: true } as PlacedOrder;
  });

  if (result.created) {
    result.notification = {
      userEmail: owner.userEmail,
      details: {
        id: result.orderId,
        customerName: customerInfo.fullName,
        customerEmail: customerInfo.email,
        phone: customerInfo.phone,
        deliveryAddress: `${customerInfo.address}, ${customerInfo.city}`,
        items: quote.items,
        subtotal: quote.subtotal,
        deliveryFee: quote.deliveryFee,
        total: quote.total,
        paymentMethod,
        paymentReference,
        customerInfo,
        userEmail: owner.userEmail,
        isGuest: owner.isGuest,
      },
    };
  }
  return result;
}

// ───────────────────────── Reading & Cancelling orders ─────────────────────────

function tokensMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/**
 * Returns a customer-safe view of an order if the caller is allowed to see it:
 * the holder of the order's accessToken, the signed-in owner, or an admin.
 * Returns null otherwise (callers should respond 404 to avoid leaking existence).
 */
export async function getOrderForViewer(
  orderId: string,
  accessToken: string | null,
  viewer: { uid: string | null; isAdmin: boolean }
) {
  if (!orderId || orderId.includes('/')) return null;
  const snap = await adminDb.collection('orders').doc(orderId).get();
  if (!snap.exists) return null;
  const d = snap.data()!;

  const allowed =
    viewer.isAdmin ||
    (viewer.uid !== null && d['userId'] === viewer.uid) ||
    (!!accessToken && typeof d['accessToken'] === 'string' && d['accessToken'].length > 0 && tokensMatch(accessToken, d['accessToken']));
  if (!allowed) return null;

  const createdAt = d['createdAt']?.toDate?.() as Date | undefined;
  return {
    id: snap.id,
    status: d['status'],
    paymentMethod: d['paymentMethod'],
    customerInfo: d['customerInfo'],
    items: d['items'],
    subtotal: d['subtotal'],
    discount: d['discount'] || 0,
    couponCode: d['couponCode'] || null,
    deliveryFee: d['deliveryFee'],
    total: d['total'],
    createdAt: createdAt ? createdAt.toISOString() : null,
  };
}

/**
 * Cancels a pending order and atomically restores product stock in Firestore.
 * Customers may only cancel orders while status === 'pending'.
 */
export async function cancelPendingOrder(
  orderId: string,
  accessToken: string | null,
  viewer: { uid: string | null; isAdmin: boolean }
): Promise<{ id: string; status: 'cancelled' }> {
  if (!orderId || orderId.includes('/')) {
    throw new OrderError('Order not found', 404);
  }
  const orderRef = adminDb.collection('orders').doc(orderId);

  await adminDb.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw new OrderError('Order not found', 404);
    }
    const d = orderSnap.data()!;
    const allowed =
      viewer.isAdmin ||
      (viewer.uid !== null && d['userId'] === viewer.uid) ||
      (!!accessToken && typeof d['accessToken'] === 'string' && d['accessToken'].length > 0 && tokensMatch(accessToken, d['accessToken']));
    if (!allowed) {
      throw new OrderError('Order not found', 404);
    }

    const currentStatus = (d['status'] as string) || 'pending';
    if (currentStatus === 'cancelled') {
      return;
    }
    if (currentStatus !== 'pending' && !viewer.isAdmin) {
      throw new OrderError('Only pending orders can be cancelled', 409);
    }

    const items: { id?: string; quantity?: number }[] = Array.isArray(d['items']) ? d['items'] : [];
    const productSnaps = await Promise.all(
      items.map((item) => (item.id ? tx.get(adminDb.collection('products').doc(item.id)) : Promise.resolve(null)))
    );

    items.forEach((item, idx) => {
      const snap = productSnaps[idx];
      if (!snap || !snap.exists) return;
      const stock = snap.data()!['stock'];
      const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 0;
      if (typeof stock === 'number' && qty > 0) {
        tx.update(snap.ref, { stock: stock + qty });
      }
    });

    tx.update(orderRef, {
      status: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
    });
  });

  return { id: orderId, status: 'cancelled' };
}
