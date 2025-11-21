 import nodemailer from 'nodemailer';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { orderDetails, userEmail } = await request.json();

    // Check if email credentials are configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('Email credentials not configured. Skipping email notification.');
      return Response.json({ 
        success: true, 
        message: 'Order processed (email notification skipped - credentials not configured)' 
      });
    }

    // Create transporter with timeout settings
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Using service is more reliable than manual host/port
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      // Add timeout settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter connection
    try {
      await transporter.verify();
      console.log('✅ Email server connection verified');
    } catch (verifyError) {
      console.error('❌ Email server verification failed:', verifyError);
      // Continue anyway, but log the error
    }

    // Format items list for email
    const itemsList = orderDetails.items
      .map((item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${item.name}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            ₦${item.price.toLocaleString()}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            ₦${(item.price * item.quantity).toLocaleString()}
          </td>
        </tr>
      `)
      .join('');

    // Send to customer
    try {
      await transporter.sendMail({
        from: `"Your Nike Store" <${process.env.GMAIL_USER}>`,
        to: userEmail,
        subject: '✅ Order Confirmation - Thank You!',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #111; margin-bottom: 10px;">Thank You for Your Order! 🎉</h1>
              <p style="color: #666; margin-bottom: 30px;">We're excited to process your order.</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #111; margin-top: 0; font-size: 18px;">Order Details</h2>
                <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderDetails.id}</p>
                <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${orderDetails.paymentMethod === 'payment-on-delivery' ? 'Cash on Delivery' : 'Paystack'}</p>
                ${orderDetails.paymentReference ? `<p style="margin: 5px 0;"><strong>Payment Reference:</strong> ${orderDetails.paymentReference}</p>` : ''}
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
                  <span>₦${(orderDetails.total - 2000).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Delivery Fee:</span>
                  <span>₦2,000</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #ddd; font-size: 20px; font-weight: bold;">
                  <span>Total:</span>
                  <span style="color: #10b981;">₦${orderDetails.total.toLocaleString()}</span>
                </div>
              </div>

              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #3b82f6;">
                <h3 style="color: #111; font-size: 16px; margin-top: 0;">Delivery Address</h3>
                <p style="margin: 5px 0;">${orderDetails.deliveryAddress}</p>
                <p style="margin: 5px 0;"><strong>Phone:</strong> ${orderDetails.phone}</p>
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
      console.log('✅ Customer email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send customer email:', emailError);
      // Don't throw - continue to try admin email
    }

    // Send to admin
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
        subject: '🔔 New Order Received - Action Required',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #111; margin-bottom: 10px;">🔔 New Order Alert!</h1>
              <p style="color: #666; margin-bottom: 30px;">You have received a new order that requires your attention.</p>
              
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h2 style="color: #111; margin-top: 0; font-size: 18px;">Order Information</h2>
                <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderDetails.id}</p>
                <p style="margin: 5px 0;"><strong>Total Amount:</strong> <span style="color: #10b981; font-size: 20px; font-weight: bold;">₦${orderDetails.total.toLocaleString()}</span></p>
                <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${orderDetails.paymentMethod === 'payment-on-delivery' ? '💵 Cash on Delivery' : '💳 Paystack'}</p>
                ${orderDetails.paymentReference ? `<p style="margin: 5px 0;"><strong>Payment Reference:</strong> ${orderDetails.paymentReference}</p>` : ''}
              </div>

              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #111; font-size: 16px; margin-top: 0;">Customer Details</h3>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${orderDetails.customerName}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${orderDetails.customerEmail}</p>
                <p style="margin: 5px 0;"><strong>Phone:</strong> ${orderDetails.phone}</p>
                <p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${orderDetails.deliveryAddress}</p>
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
                <h3 style="color: #111; font-size: 16px; margin-top: 0;">⚡ Action Required</h3>
                <p style="margin: 5px 0;">Please process this order and prepare it for delivery.</p>
                <p style="margin: 5px 0;">Contact the customer at <strong>${orderDetails.phone}</strong> to confirm delivery details.</p>
              </div>

              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">This is an automated notification from your store.</p>
              </div>
            </div>
          </div>
        `
      });
      console.log('✅ Admin email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send admin email:', emailError);
    }

    return Response.json({ success: true, message: 'Notifications sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({
      success: false,
      error: message
    }, { status: 500 });
  }
}