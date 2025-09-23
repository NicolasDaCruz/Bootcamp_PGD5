import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { orderId, email, status, orderNumber, customerName } = await request.json();

    // Verify admin status
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get status message
    const statusMessages: Record<string, string> = {
      pending: 'Your order has been received and is being processed.',
      processing: 'Your order is being prepared for shipment.',
      prepared: 'Your order has been prepared and is ready for shipping.',
      shipped: 'Great news! Your order has been shipped and is on its way to you.',
      delivered: 'Your order has been successfully delivered. Enjoy your purchase!',
      cancelled: 'Your order has been cancelled. If you have any questions, please contact us.'
    };

    const message = statusMessages[status] || 'Your order status has been updated.';

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Sneaker Store <noreply@sneakerstore.com>',
      to: email,
      subject: `Order #${orderNumber} - Status Update: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #000; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .status { display: inline-block; padding: 10px 20px; margin: 20px 0; font-weight: bold; border-radius: 5px; }
              .status.pending { background-color: #fbbf24; color: #78350f; }
              .status.processing { background-color: #60a5fa; color: #1e3a8a; }
              .status.prepared { background-color: #a78bfa; color: #4c1d95; }
              .status.shipped { background-color: #c084fc; color: #581c87; }
              .status.delivered { background-color: #4ade80; color: #14532d; }
              .status.cancelled { background-color: #f87171; color: #7f1d1d; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Order Status Update</h1>
              </div>
              <div class="content">
                <h2>Hello ${customerName},</h2>
                <p>We wanted to update you on the status of your order <strong>#${orderNumber}</strong>.</p>

                <div class="status ${status}">
                  Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
                </div>

                <p>${message}</p>

                ${status === 'shipped' ? `
                  <p><strong>Tracking Information:</strong></p>
                  <p>You can track your package using the tracking number that will be provided separately.</p>
                ` : ''}

                ${status === 'delivered' ? `
                  <p>We hope you love your new sneakers! If you have any issues or questions, please don't hesitate to contact our support team.</p>
                ` : ''}

                <p>If you have any questions about your order, please feel free to contact us.</p>

                <p>Thank you for shopping with us!</p>

                <p>Best regards,<br>The Sneaker Store Team</p>
              </div>
              <div class="footer">
                <p>&copy; 2024 Sneaker Store. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Email send error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Update order email notification status in database
    await supabase
      .from('orders')
      .update({
        email_notifications: {
          [status]: {
            sent: true,
            sent_at: new Date().toISOString(),
            email_id: data?.id
          }
        }
      })
      .eq('id', orderId);

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error) {
    console.error('Order email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}