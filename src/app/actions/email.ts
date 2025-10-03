// src/app/actions/email.ts
'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type OrderEmailData = {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string | null;
  subtotal: number;
  discount: number;
  total: number;
  discountTierName?: string | null;
  purchasedItems: Array<{
    title: string;
    price: number;
    product_type: string;
    validity_duration: number;
    validity_type: string;
  }>;
};

/**
 * Send order confirmation email with purchase details
 */
export async function sendOrderConfirmationEmail(orderData: OrderEmailData) {
  try {
    const formatPrice = (amount: number) => 
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const itemsHtml = orderData.purchasedItems
      .map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${item.title}</strong><br/>
            <span style="color: #6b7280; font-size: 14px;">
              ${item.product_type === 'bundle' ? 'Bundle' : 'Course'} - 
              ${item.validity_duration} ${item.validity_type} access
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${formatPrice(item.price)}
          </td>
        </tr>
      `)
      .join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Thank you for your purchase</p>
          </div>

          <!-- Body -->
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            
            <p style="font-size: 16px; margin-bottom: 24px;">
              Hi ${orderData.customerName || 'there'},
            </p>

            <p style="font-size: 16px; margin-bottom: 24px;">
              Your order has been confirmed and your courses are being prepared for access.
            </p>

            <!-- Order Details -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #111827;">Order Details</h2>
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
                <strong>Order Number:</strong> ${orderData.orderNumber}
              </p>
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
                <strong>Order ID:</strong> ${orderData.orderId}
              </p>
            </div>

            <!-- Items Table -->
            <h2 style="font-size: 18px; margin: 24px 0 12px 0; color: #111827;">Your Purchase</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-size: 14px; color: #6b7280;">Item</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; font-size: 14px; color: #6b7280;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Pricing Summary -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280;">Subtotal:</span>
                <span style="font-weight: 500;">${formatPrice(orderData.subtotal)}</span>
              </div>
              ${orderData.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #059669;">
                  <span>Discount ${orderData.discountTierName ? `(${orderData.discountTierName})` : ''}:</span>
                  <span style="font-weight: 500;">-${formatPrice(orderData.discount)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #e5e7eb; font-size: 18px;">
                <span style="font-weight: 600;">Total Paid:</span>
                <span style="font-weight: 700; color: #f59e0b;">${formatPrice(orderData.total)}</span>
              </div>
            </div>

            <!-- Next Steps -->
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 24px;">
              <h3 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px;">What's Next?</h3>
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                You'll receive another email shortly once your course access is ready. 
                This usually takes just a few moments.
              </p>
            </div>

            <!-- Support -->
            <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
              Need help? Contact us at <a href="mailto:support@immigreat.ai" style="color: #f59e0b;">support@immigreat.ai</a>
            </p>

          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 24px; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Immigreat.ai - Your Immigration Journey Partner</p>
          </div>

        </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: 'Immigreat Orders <orders@email.greencardiy.com>',
      to: orderData.customerEmail,
      subject: `Order Confirmed - ${orderData.orderNumber}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send order confirmation email:', error);
      return { success: false, error };
    }

    console.log('Order confirmation email sent to:', orderData.customerEmail);
    return { success: true };
    
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error };
  }
}

/**
 * Send enrollment complete email
 */
export async function sendEnrollmentCompleteEmail(
  email: string,
  name: string | null,
  itemCount: number
) {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Your Courses Are Ready!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Start learning today</p>
          </div>

          <!-- Body -->
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            
            <p style="font-size: 16px; margin-bottom: 24px;">
              Hi ${name || 'there'},
            </p>

            <p style="font-size: 16px; margin-bottom: 24px;">
              Great news! Your enrollment is complete and all ${itemCount} ${itemCount === 1 ? 'course is' : 'courses are'} now ready for you to access.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://courses.greencardiy.com/my-enrollments" 
                 style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Access Your Courses
              </a>
            </div>

            <!-- Info Box -->
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 24px;">
              <h3 style="margin: 0 0 8px 0; color: #065f46; font-size: 16px;">Getting Started</h3>
              <ul style="margin: 8px 0; padding-left: 20px; color: #065f46;">
                <li style="margin-bottom: 8px;">Log in to your account at courses.greencardiy.com</li>
                <li style="margin-bottom: 8px;">Navigate to "My Enrollments"</li>
                <li style="margin-bottom: 8px;">Start learning at your own pace</li>
              </ul>
            </div>

            <p style="font-size: 16px; margin-bottom: 24px;">
              Your courses are self-paced, so you can learn whenever and wherever suits you best.
            </p>

            <!-- Support -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 32px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px;">Need Help?</h3>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Our support team is here for you at 
                <a href="mailto:support@immigreat.ai" style="color: #f59e0b;">support@immigreat.ai</a>
              </p>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Thank you for choosing Immigreat to guide your immigration journey. We're excited to support you every step of the way!
            </p>

          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 24px; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Immigreat.ai - Your Immigration Journey Partner</p>
            <p style="margin: 8px 0 0 0;">
              <a href="https://immigreat.ai" style="color: #9ca3af; text-decoration: none;">Visit Website</a>
            </p>
          </div>

        </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: 'Immigreat Courses <courses@email.greencardiy.com>',
      to: email,
      subject: '🎉 Your Courses Are Ready to Access!',
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send enrollment complete email:', error);
      return { success: false, error };
    }

    console.log('Enrollment complete email sent to:', email);
    return { success: true };
    
  } catch (error) {
    console.error('Error sending enrollment complete email:', error);
    return { success: false, error };
  }
}