import 'server-only';
import { after } from 'next/server';
import nodemailer from 'nodemailer';

// Escape user-supplied strings to prevent HTML injection in email templates
function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface OrderNotificationDetails {
  id: string;
  customerName?: string;
  customerEmail?: string;
  userEmail?: string;
  phone?: string;
  deliveryAddress?: string;
  items: { name: string; quantity: number; price: number; image?: string }[];
  subtotal?: number;
  deliveryFee?: number;
  total: number;
  paymentMethod: string;
  paymentReference?: string | null;
  customerInfo?: { fullName?: string; email?: string; phone?: string; address?: string; city?: string; state?: string };
  isGuest?: boolean;
}

/**
 * Schedules order notifications to run in the background after the HTTP
 * response is sent. Falls back to fire-and-forget when called outside a
 * Next.js request context, and never throws so notification scheduling can
 * never cause a committed order to return 500.
 */
export function scheduleOrderNotifications(orderDetails: OrderNotificationDetails, userEmail: string): void {
  try {
    after(() => sendOrderNotifications(orderDetails, userEmail));
  } catch {
    void sendOrderNotifications(orderDetails, userEmail);
  }
}

/**
 * Sends order confirmation (customer), new-order alert (admin), and optional
 * WhatsApp/Telegram notifications. Server-only: must never be exposed as an
 * unauthenticated endpoint, otherwise it becomes an open email relay.
 * Never throws - notification failures must not affect order placement.
 */
export async function sendOrderNotifications(orderDetails: OrderNotificationDetails, userEmail: string): Promise<void> {
  try {
    // Check if email credentials are configured
    if (!process.env['GMAIL_USER'] || !process.env['GMAIL_APP_PASSWORD']) {
      console.warn('Email credentials not configured. Skipping email notification.');
      return;
    }

    // Create transporter with timeout settings
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Using service is more reliable than manual host/port
      auth: {
        user: process.env['GMAIL_USER'],
        pass: process.env['GMAIL_APP_PASSWORD']
      },
      // Add timeout settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    // Verify transporter connection
    try {
      await transporter.verify();
      console.log('✅ Email server connection verified');
    } catch (verifyError) {
      console.error('❌ Email server verification failed:', verifyError);
      // Continue anyway, but log the error
    }

    // Format items list for email (escape all user-supplied strings)
    if (!Array.isArray(orderDetails?.items) || orderDetails.items.length === 0) {
      console.warn('Skipping notification: order has no items');
      return;
    }
    if (typeof orderDetails?.total !== 'number' || orderDetails.total <= 0) {
      console.warn('Skipping notification: invalid order total');
      return;
    }

    const itemsList = orderDetails.items
      .map((item: { name: string; quantity: number; price: number; }) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${escapeHtml(item.name)}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
            ${escapeHtml(item.quantity)}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            ₦${Number(item.price).toLocaleString()}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            ₦${(Number(item.price) * Number(item.quantity)).toLocaleString()}
          </td>
        </tr>
      `)
      .join('');

    // Send to customer
    try {
      await transporter.sendMail({
        from: `"MogShop" <${process.env['GMAIL_USER']}>`,
        to: userEmail,
        subject: 'Order Confirmation - Thank You!',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #111; margin-bottom: 10px;">Thank You for Your Order!</h1>
              <p style="color: #666; margin-bottom: 30px;">We're excited to process your order.</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #111; margin-top: 0; font-size: 18px;">Order Details</h2>
                <p style="margin: 5px 0;"><strong>Order ID:</strong> #${escapeHtml(orderDetails.id)}</p>
                <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${orderDetails.paymentMethod === 'payment-on-delivery' ? 'Cash on Delivery' : 'Paystack'}</p>
                ${orderDetails.paymentReference ? `<p style="margin: 5px 0;"><strong>Payment Reference:</strong> ${escapeHtml(orderDetails.paymentReference)}</p>` : ''}
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #f59e0b;">Processing</span></p>
              </div>

              <h3 style="color: #111; font-size: 16px; margin-top: 30px;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                  <tr style="background: #f5f5f5;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>

              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Subtotal:</span>
                  <span>₦${(orderDetails.subtotal ?? (orderDetails.total - (orderDetails.deliveryFee ?? 2000))).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Delivery Fee:</span>
                  <span>₦${(orderDetails.deliveryFee ?? 2000).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #ddd; font-size: 20px; font-weight: bold;">
                  <span>Total:</span>
                  <span style="color: #10b981;">₦${orderDetails.total.toLocaleString()}</span>
                </div>
              </div>

              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #3b82f6;">
                <h3 style="color: #111; font-size: 16px; margin-top: 0;">Delivery Address</h3>
                <p style="margin: 5px 0;">${escapeHtml(orderDetails.deliveryAddress || orderDetails.customerInfo?.address)}</p>
                <p style="margin: 5px 0;"><strong>Phone:</strong> ${escapeHtml(orderDetails.phone || orderDetails.customerInfo?.phone)}</p>
              </div>

              <p style="margin-top: 30px; color: #666;">
                We'll notify you when your order ships! If you have any questions, please don't hesitate to contact us.
              </p>

              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">Thank you for shopping with us!</p>
              </div>
            </div>
          </div>
        `
      });
      console.log('Customer email sent successfully');
    } catch (emailError) {
      console.error('Failed to send customer email:', emailError);
      // Don't throw - continue to try admin email
    }

    // Send to admin
    try {
      await transporter.sendMail({
        from: process.env['GMAIL_USER'],
        to: process.env['ADMIN_EMAIL'] || process.env['GMAIL_USER'],
        subject: 'New Order Received - Action Required',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #111; margin-bottom: 10px;">New Order Alert!</h1>
              <p style="color: #666; margin-bottom: 30px;">You have received a new order that requires your attention.</p>
              
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h2 style="color: #111; margin-top: 0; font-size: 18px;">Order Information</h2>
                <p style="margin: 5px 0;"><strong>Order ID:</strong> #${escapeHtml(orderDetails.id)}</p>
                <p style="margin: 5px 0;"><strong>Total Amount:</strong> <span style="color: #10b981; font-size: 20px; font-weight: bold;">₦${orderDetails.total.toLocaleString()}</span></p>
                <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${orderDetails.paymentMethod === 'payment-on-delivery' ? 'Cash on Delivery' : 'Paystack'}</p>
                ${orderDetails.paymentReference ? `<p style="margin: 5px 0;"><strong>Payment Reference:</strong> ${escapeHtml(orderDetails.paymentReference)}</p>` : ''}
              </div>

              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #111; font-size: 16px; margin-top: 0;">Customer Details</h3>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${escapeHtml(orderDetails.customerName || orderDetails.customerInfo?.fullName)}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${escapeHtml(orderDetails.customerEmail || orderDetails.userEmail)}</p>
                <p style="margin: 5px 0;"><strong>Phone:</strong> ${escapeHtml(orderDetails.phone || orderDetails.customerInfo?.phone)}</p>
                <p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${escapeHtml(orderDetails.deliveryAddress || orderDetails.customerInfo?.address)}</p>
              </div>

              <h3 style="color: #111; font-size: 16px; margin-top: 30px;">Ordered Items</h3>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                  <tr style="background: #f5f5f5;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>

              <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #10b981;">
                <h3 style="color: #111; font-size: 16px; margin-top: 0;">Action Required</h3>
                <p style="margin: 5px 0;">Please process this order and prepare it for delivery.</p>
                <p style="margin: 5px 0;">Contact the customer at <strong>${escapeHtml(orderDetails.phone || orderDetails.customerInfo?.phone)}</strong> to confirm delivery details.</p>
              </div>

              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">This is an automated notification from your store.</p>
              </div>
            </div>
          </div>
        `
      });
      console.log('Admin email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send admin email:', emailError);
    }

    // ── WhatsApp notification via CallMeBot (admin only) ──
    const callMeBotPhone = process.env['CALLMEBOT_PHONE'];
    const callMeBotApiKey = process.env['CALLMEBOT_APIKEY'];

    if (callMeBotPhone && callMeBotApiKey) {
      try {
        const whatsappMessage = 
          `*New MogShop Order!*\n` +
          `Order ID: ${orderDetails.id}\n` +
          `Customer: ${orderDetails.customerName}\n` +
          `Phone: ${orderDetails.phone}\n` +
          `Total: ₦${Number(orderDetails.total).toLocaleString()}\n` +
          `Payment: ${orderDetails.paymentMethod === 'payment-on-delivery' ? 'Cash on Delivery' : 'Paystack'}\n` +
          `Address: ${orderDetails.deliveryAddress}`;

        const encodedMessage = encodeURIComponent(whatsappMessage);
        const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${callMeBotPhone}&text=${encodedMessage}&apikey=${callMeBotApiKey}`;

        const waResponse = await fetch(callMeBotUrl);
        if (waResponse.ok) {
          console.log('✅ WhatsApp notification sent successfully!');
        } else {
          console.warn('⚠️ WhatsApp notification failed:', await waResponse.text());
        }
      } catch (waError) {
        console.error('❌ WhatsApp notification error:', waError);
        // Don't throw — emails already sent, WhatsApp is bonus
      }
    } else {
      console.log('ℹ️ CallMeBot credentials not set. Skipping WhatsApp notification.');
    }

    // ── Telegram Notification (admin only) ──
    const tgBotToken = process.env['TELEGRAM_BOT_TOKEN'];
    const tgChatId = process.env['TELEGRAM_CHAT_ID'];

    if (tgBotToken && tgChatId) {
      try {
        const customerName = orderDetails.customerInfo?.fullName || orderDetails.customerName || 'Customer';
        const customerPhone = orderDetails.customerInfo?.phone || orderDetails.phone || 'N/A';
        const paymentMethod = orderDetails.paymentMethod === 'payment-on-delivery' ? 'Cash on Delivery' : 'Digital Payment';
        const totalAmount = Number(orderDetails.total).toLocaleString();
        
        const itemsListTg = orderDetails.items?.map((item: any) => `- ${item.quantity}x ${item.name} (₦${Number(item.price).toLocaleString()})`).join('\n') || 'No items listed';

        const text = `*New Order Received!*\n\n*Order ID:* \`${orderDetails.id}\`\n*Customer:* ${customerName}\n*Phone:* ${customerPhone}\n*Method:* ${paymentMethod}\n*Total:* ₦${totalAmount}\n\n*Items Ordered:*\n${itemsListTg}`;
        
        const firstItemImage = orderDetails.items?.[0]?.image;
        let tgEndpoint = 'sendMessage';
        let bodyPayload: any = {
          chat_id: tgChatId,
          parse_mode: 'Markdown'
        };

        if (firstItemImage && firstItemImage.startsWith('http')) {
          tgEndpoint = 'sendPhoto';
          bodyPayload.photo = firstItemImage;
          bodyPayload.caption = text;
        } else {
          bodyPayload.text = text;
        }
        
        const tgResponse = await fetch(`https://api.telegram.org/bot${tgBotToken}/${tgEndpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });
        
        if (tgResponse.ok) {
          console.log('✅ Telegram notification sent successfully!');
        } else {
          console.warn('⚠️ Telegram notification failed:', await tgResponse.text());
        }
      } catch (tgError) {
        console.error('❌ Telegram notification error:', tgError);
      }
    } else {
      console.log('ℹ️ Telegram credentials not set. Skipping Telegram notification.');
    }
  } catch (error) {
    console.error('Order notification error:', error);
  }
}
