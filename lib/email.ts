import { Resend } from 'resend';
import { Order, OrderItem } from './order-utils';

// Initialize Resend only if API key is available
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Email templates
const TEMPLATES = {
  ORDER_CONFIRMATION: 'order-confirmation',
  PAYMENT_CONFIRMATION: 'payment-confirmation',
  ORDER_STATUS_UPDATE: 'order-status-update',
  SHIPPING_UPDATE: 'shipping-update',
  DELIVERY_CONFIRMATION: 'delivery-confirmation',
  PAYMENT_FAILED: 'payment-failed',
  ORDER_CANCELLED: 'order-cancelled'
};

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@sneakerstore.com';
const COMPANY_NAME = 'Sneaker Store';
const SUPPORT_EMAIL = 'support@sneakerstore.com';

export interface EmailData {
  order: Order;
  items: OrderItem[];
  total: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  customerEmail?: string;
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(emailData: EmailData): Promise<boolean> {
  try {
    if (!emailData.customerEmail) {
      console.warn('No customer email provided for order confirmation');
      return false;
    }

    if (!resend) {
      console.warn('Email service not configured - skipping order confirmation email');
      return false;
    }

    const emailHtml = generateOrderConfirmationHtml(emailData);
    const emailText = generateOrderConfirmationText(emailData);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailData.customerEmail,
      subject: `Order Confirmation - ${emailData.order.id}`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Error sending order confirmation email:', error);
      return false;
    }

    console.log('Order confirmation email sent successfully:', data?.id);
    return true;

  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
}

// Send payment confirmation email
export async function sendPaymentConfirmationEmail(emailData: EmailData): Promise<boolean> {
  try {
    if (!emailData.customerEmail) {
      console.warn('No customer email provided for payment confirmation');
      return false;
    }

    const emailHtml = generatePaymentConfirmationHtml(emailData);
    const emailText = generatePaymentConfirmationText(emailData);

    if (!resend) {
      console.warn('Email service not configured - skipping email');
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailData.customerEmail,
      subject: `Payment Confirmed - Order ${emailData.order.id}`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Error sending payment confirmation email:', error);
      return false;
    }

    console.log('Payment confirmation email sent successfully:', data?.id);
    return true;

  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    return false;
  }
}

// Send shipping update email
export async function sendShippingUpdateEmail(
  emailData: EmailData,
  trackingNumber?: string
): Promise<boolean> {
  try {
    if (!emailData.customerEmail) {
      console.warn('No customer email provided for shipping update');
      return false;
    }

    const emailHtml = generateShippingUpdateHtml(emailData, trackingNumber);
    const emailText = generateShippingUpdateText(emailData, trackingNumber);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailData.customerEmail,
      subject: `Your Order Has Shipped - ${emailData.order.id}`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Error sending shipping update email:', error);
      return false;
    }

    console.log('Shipping update email sent successfully:', data?.id);
    return true;

  } catch (error) {
    console.error('Error sending shipping update email:', error);
    return false;
  }
}

// Send delivery confirmation email
export async function sendDeliveryConfirmationEmail(emailData: EmailData): Promise<boolean> {
  try {
    if (!emailData.customerEmail) {
      console.warn('No customer email provided for delivery confirmation');
      return false;
    }

    const emailHtml = generateDeliveryConfirmationHtml(emailData);
    const emailText = generateDeliveryConfirmationText(emailData);

    if (!resend) {
      console.warn('Email service not configured - skipping email');
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailData.customerEmail,
      subject: `Order Delivered - ${emailData.order.id}`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Error sending delivery confirmation email:', error);
      return false;
    }

    console.log('Delivery confirmation email sent successfully:', data?.id);
    return true;

  } catch (error) {
    console.error('Error sending delivery confirmation email:', error);
    return false;
  }
}

// Send order status update email
export async function sendOrderStatusUpdateEmail(
  emailData: EmailData,
  oldStatus: string,
  newStatus: string
): Promise<boolean> {
  try {
    if (!emailData.customerEmail) {
      console.warn('No customer email provided for order status update');
      return false;
    }

    if (!resend) {
      console.warn('Email service not configured - skipping order status update email');
      return false;
    }

    const emailHtml = generateOrderStatusUpdateHtml(emailData, oldStatus, newStatus);
    const emailText = generateOrderStatusUpdateText(emailData, oldStatus, newStatus);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailData.customerEmail,
      subject: `Order Status Update - ${emailData.order.id}`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Error sending order status update email:', error);
      return false;
    }

    console.log('Order status update email sent successfully:', data?.id);
    return true;

  } catch (error) {
    console.error('Error sending order status update email:', error);
    return false;
  }
}

// Send payment failed email
export async function sendPaymentFailedEmail(emailData: EmailData): Promise<boolean> {
  try {
    if (!emailData.customerEmail) {
      console.warn('No customer email provided for payment failed notification');
      return false;
    }

    const emailHtml = generatePaymentFailedHtml(emailData);
    const emailText = generatePaymentFailedText(emailData);

    if (!resend) {
      console.warn('Email service not configured - skipping email');
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailData.customerEmail,
      subject: `Payment Issue - Order ${emailData.order.id}`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Error sending payment failed email:', error);
      return false;
    }

    console.log('Payment failed email sent successfully:', data?.id);
    return true;

  } catch (error) {
    console.error('Error sending payment failed email:', error);
    return false;
  }
}

// HTML Email Templates
function generateOrderConfirmationHtml(emailData: EmailData): string {
  const { order, items, total } = emailData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .order-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item { border-bottom: 1px solid #eee; padding: 15px 0; }
        .item:last-child { border-bottom: none; }
        .total { font-weight: bold; font-size: 18px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${COMPANY_NAME}</h1>
          <h2>Order Confirmation</h2>
        </div>

        <p>Thank you for your order! Here are the details:</p>

        <div class="order-details">
          <h3>Order Information</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>

        <div class="order-details">
          <h3>Items Ordered</h3>
          ${items.map(item => `
            <div class="item">
              <strong>${item.product_name}</strong> by ${item.product_brand}<br>
              ${item.size ? `Size: ${item.size} ` : ''}${item.color ? `Color: ${item.color}` : ''}<br>
              Quantity: ${item.quantity} × $${(item.unit_price / 100).toFixed(2)} = $${(item.total_price / 100).toFixed(2)}
            </div>
          `).join('')}
        </div>

        <div class="order-details">
          <h3>Order Summary</h3>
          <p>Subtotal: $${(total.subtotal / 100).toFixed(2)}</p>
          <p>Shipping: $${(total.shipping / 100).toFixed(2)}</p>
          <p>Tax: $${(total.tax / 100).toFixed(2)}</p>
          <p class="total">Total: $${(total.total / 100).toFixed(2)}</p>
        </div>

        ${order.shipping_address ? `
          <div class="order-details">
            <h3>Shipping Address</h3>
            <p>
              ${order.shipping_address.name}<br>
              ${order.shipping_address.line1}<br>
              ${order.shipping_address.line2 ? order.shipping_address.line2 + '<br>' : ''}
              ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}<br>
              ${order.shipping_address.country}
            </p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Questions? Contact us at ${SUPPORT_EMAIL}</p>
          <p>Thank you for shopping with ${COMPANY_NAME}!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePaymentConfirmationHtml(emailData: EmailData): string {
  const { order, total } = emailData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .payment-details { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${COMPANY_NAME}</h1>
          <h2>Payment Confirmed</h2>
        </div>

        <p>Great news! Your payment has been successfully processed.</p>

        <div class="payment-details">
          <h3>Payment Details</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Amount Paid:</strong> $${(total.total / 100).toFixed(2)}</p>
          <p><strong>Payment Date:</strong> ${new Date(order.updated_at).toLocaleDateString()}</p>
        </div>

        <p>Your order is now being processed and will be shipped soon. You'll receive another email with tracking information once your order ships.</p>

        <div class="footer">
          <p>Questions? Contact us at ${SUPPORT_EMAIL}</p>
          <p>Thank you for shopping with ${COMPANY_NAME}!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateShippingUpdateHtml(emailData: EmailData, trackingNumber?: string): string {
  const { order } = emailData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Shipping Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .shipping-details { background: #e8f0ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .tracking { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${COMPANY_NAME}</h1>
          <h2>Your Order Has Shipped!</h2>
        </div>

        <p>Good news! Your order is on its way.</p>

        <div class="shipping-details">
          <h3>Shipping Details</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Shipping Status:</strong> ${order.shipping_status}</p>
          ${order.estimated_delivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimated_delivery).toLocaleDateString()}</p>` : ''}
        </div>

        ${trackingNumber ? `
          <div class="tracking">
            <h3>Track Your Package</h3>
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p>You can track your package using the tracking number above with your shipping carrier.</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Questions? Contact us at ${SUPPORT_EMAIL}</p>
          <p>Thank you for shopping with ${COMPANY_NAME}!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateDeliveryConfirmationHtml(emailData: EmailData): string {
  const { order } = emailData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Delivered</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .delivery-details { background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${COMPANY_NAME}</h1>
          <h2>Order Delivered!</h2>
        </div>

        <p>Excellent! Your order has been successfully delivered.</p>

        <div class="delivery-details">
          <h3>Delivery Confirmation</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Delivered On:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p>We hope you love your new items! If you have any issues with your order, please don't hesitate to contact us.</p>

        <div class="footer">
          <p>Questions? Contact us at ${SUPPORT_EMAIL}</p>
          <p>Thank you for shopping with ${COMPANY_NAME}!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateOrderStatusUpdateHtml(emailData: EmailData, oldStatus: string, newStatus: string): string {
  const { order } = emailData;

  // Define status colors and descriptions
  const statusConfig: Record<string, { color: string; description: string }> = {
    'pending': { color: '#ffc107', description: 'Your order is being prepared' },
    'processing': { color: '#007bff', description: 'Your order is being processed' },
    'completed': { color: '#28a745', description: 'Your order has been completed' },
    'shipped': { color: '#17a2b8', description: 'Your order has shipped' },
    'delivered': { color: '#28a745', description: 'Your order has been delivered' },
    'cancelled': { color: '#dc3545', description: 'Your order has been cancelled' },
    'refunded': { color: '#6c757d', description: 'Your order has been refunded' }
  };

  const newStatusConfig = statusConfig[newStatus] || { color: '#6c757d', description: 'Status updated' };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Status Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .status-update { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${newStatusConfig.color}; }
        .status-badge { display: inline-block; padding: 5px 12px; border-radius: 20px; color: white; background-color: ${newStatusConfig.color}; font-weight: bold; text-transform: uppercase; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${COMPANY_NAME}</h1>
          <h2>Order Status Update</h2>
        </div>

        <p>Your order status has been updated!</p>

        <div class="status-update">
          <h3>Order Status Change</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Previous Status:</strong> ${oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1)}</p>
          <p><strong>New Status:</strong> <span class="status-badge">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</span></p>
          <p><strong>Updated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p style="margin-top: 15px; font-style: italic;">${newStatusConfig.description}</p>
        </div>

        ${newStatus === 'shipped' && order.tracking_number ? `
          <div style="background: #e8f0ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4>Tracking Information</h4>
            <p><strong>Tracking Number:</strong> ${order.tracking_number}</p>
            ${order.estimated_delivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimated_delivery).toLocaleDateString()}</p>` : ''}
          </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for shopping with ${COMPANY_NAME}!</p>
          <p>Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateOrderStatusUpdateText(emailData: EmailData, oldStatus: string, newStatus: string): string {
  const { order } = emailData;

  return `
${COMPANY_NAME} - Order Status Update

Your order status has been updated!

Order Details:
Order ID: ${order.id}
Previous Status: ${oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1)}
New Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
Updated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

${newStatus === 'shipped' && order.tracking_number ? `
Tracking Information:
Tracking Number: ${order.tracking_number}
${order.estimated_delivery ? `Estimated Delivery: ${new Date(order.estimated_delivery).toLocaleDateString()}` : ''}
` : ''}

Thank you for shopping with ${COMPANY_NAME}!

Questions? Contact us at ${SUPPORT_EMAIL}
  `;
}

function generatePaymentFailedHtml(emailData: EmailData): string {
  const { order } = emailData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Issue</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .alert { background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${COMPANY_NAME}</h1>
          <h2>Payment Issue</h2>
        </div>

        <div class="alert">
          <h3>Payment Could Not Be Processed</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p>Unfortunately, we were unable to process your payment for this order.</p>
        </div>

        <p>This could happen for several reasons:</p>
        <ul>
          <li>Insufficient funds</li>
          <li>Incorrect payment information</li>
          <li>Bank security measures</li>
          <li>Network connectivity issues</li>
        </ul>

        <p>Please try placing your order again, or contact us for assistance.</p>

        <div class="footer">
          <p>Questions? Contact us at ${SUPPORT_EMAIL}</p>
          <p>Thank you for shopping with ${COMPANY_NAME}!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Text Email Templates
function generateOrderConfirmationText(emailData: EmailData): string {
  const { order, items, total } = emailData;

  return `
${COMPANY_NAME} - Order Confirmation

Thank you for your order!

Order Information:
Order ID: ${order.id}
Order Date: ${new Date(order.created_at).toLocaleDateString()}
Status: ${order.status}

Items Ordered:
${items.map(item =>
  `${item.product_name} by ${item.product_brand}
${item.size ? `Size: ${item.size} ` : ''}${item.color ? `Color: ${item.color}` : ''}
Quantity: ${item.quantity} × $${(item.unit_price / 100).toFixed(2)} = $${(item.total_price / 100).toFixed(2)}`
).join('\n\n')}

Order Summary:
Subtotal: $${(total.subtotal / 100).toFixed(2)}
Shipping: $${(total.shipping / 100).toFixed(2)}
Tax: $${(total.tax / 100).toFixed(2)}
Total: $${(total.total / 100).toFixed(2)}

${order.shipping_address ? `
Shipping Address:
${order.shipping_address.name}
${order.shipping_address.line1}
${order.shipping_address.line2 ? order.shipping_address.line2 : ''}
${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}
${order.shipping_address.country}
` : ''}

Questions? Contact us at ${SUPPORT_EMAIL}
Thank you for shopping with ${COMPANY_NAME}!
  `;
}

function generatePaymentConfirmationText(emailData: EmailData): string {
  const { order, total } = emailData;

  return `
${COMPANY_NAME} - Payment Confirmed

Great news! Your payment has been successfully processed.

Payment Details:
Order ID: ${order.id}
Amount Paid: $${(total.total / 100).toFixed(2)}
Payment Date: ${new Date(order.updated_at).toLocaleDateString()}

Your order is now being processed and will be shipped soon. You'll receive another email with tracking information once your order ships.

Questions? Contact us at ${SUPPORT_EMAIL}
Thank you for shopping with ${COMPANY_NAME}!
  `;
}

function generateShippingUpdateText(emailData: EmailData, trackingNumber?: string): string {
  const { order } = emailData;

  return `
${COMPANY_NAME} - Your Order Has Shipped!

Good news! Your order is on its way.

Shipping Details:
Order ID: ${order.id}
Shipping Status: ${order.shipping_status}
${order.estimated_delivery ? `Estimated Delivery: ${new Date(order.estimated_delivery).toLocaleDateString()}` : ''}

${trackingNumber ? `
Track Your Package:
Tracking Number: ${trackingNumber}
You can track your package using the tracking number above with your shipping carrier.
` : ''}

Questions? Contact us at ${SUPPORT_EMAIL}
Thank you for shopping with ${COMPANY_NAME}!
  `;
}

function generateDeliveryConfirmationText(emailData: EmailData): string {
  const { order } = emailData;

  return `
${COMPANY_NAME} - Order Delivered!

Excellent! Your order has been successfully delivered.

Delivery Confirmation:
Order ID: ${order.id}
Delivered On: ${new Date().toLocaleDateString()}

We hope you love your new items! If you have any issues with your order, please don't hesitate to contact us.

Questions? Contact us at ${SUPPORT_EMAIL}
Thank you for shopping with ${COMPANY_NAME}!
  `;
}

function generatePaymentFailedText(emailData: EmailData): string {
  const { order } = emailData;

  return `
${COMPANY_NAME} - Payment Issue

Unfortunately, we were unable to process your payment for order ${order.id}.

This could happen for several reasons:
- Insufficient funds
- Incorrect payment information
- Bank security measures
- Network connectivity issues

Please try placing your order again, or contact us for assistance.

Questions? Contact us at ${SUPPORT_EMAIL}
Thank you for shopping with ${COMPANY_NAME}!
  `;
}

// Utility function to get customer email from order
export async function getCustomerEmailFromOrder(order: Order): Promise<string | null> {
  try {
    // If we have a user_id, get email from user profile
    if (order.user_id) {
      const { supabase } = await import('@/lib/supabase');
      const { data: profile, error } = await supabase
        .from('users')
        .select('email')
        .eq('id', order.user_id)
        .single();

      if (!error && profile?.email) {
        return profile.email;
      }
    }

    // For guest orders, we might need to get email from Stripe payment intent
    // This would require calling Stripe API to get customer details
    // For now, return null if no user email found
    return null;

  } catch (error) {
    console.error('Error getting customer email:', error);
    return null;
  }
}

