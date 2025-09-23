import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Stripe configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_..._placeholder';
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_..._placeholder';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_..._placeholder';

// Server-side Stripe instance
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Types for our payment system
export interface PaymentMetadata {
  userId?: string;
  sessionId?: string;
  cartId: string;
  reservationIds: string[];
}

export interface CreatePaymentIntentRequest {
  amount: number; // in cents
  currency: string;
  metadata: PaymentMetadata | Record<string, string>; // Allow both types for flexibility
  shipping?: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  automaticPaymentMethods?: {
    enabled: boolean;
    allow_redirects?: 'always' | 'never';
  };
}

export interface OrderData {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentIntentId: string;
  metadata: PaymentMetadata;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  shipping?: {
    name: string;
    address: Stripe.Address;
  };
  createdAt: string;
  updatedAt: string;
}

// Create a payment intent
export async function createPaymentIntent(params: CreatePaymentIntentRequest): Promise<Stripe.PaymentIntent> {
  console.log('🌟 [Stripe] createPaymentIntent called with:', {
    timestamp: new Date().toISOString(),
    amount: params.amount,
    currency: params.currency,
    metadataKeys: Object.keys(params.metadata),
    hasShipping: !!params.shipping
  });

  try {
    // If metadata is already a complete Record<string, string>, use it directly
    // Otherwise, transform the PaymentMetadata structure
    let metadata: Record<string, string>;

    // Check if this looks like a complete metadata object (has cartItems or other custom fields)
    // vs a basic PaymentMetadata object (only has cartId, userId, sessionId, reservationIds)
    const metadataKeys = Object.keys(params.metadata);
    const isBasicPaymentMetadata = metadataKeys.length <= 4 &&
      metadataKeys.every(key => ['cartId', 'userId', 'sessionId', 'reservationIds'].includes(key)) &&
      'cartId' in params.metadata;

    if (isBasicPaymentMetadata) {
      // This is a PaymentMetadata object, transform it
      const paymentMetadata = params.metadata as PaymentMetadata;
      metadata = {
        userId: paymentMetadata.userId || '',
        sessionId: paymentMetadata.sessionId || '',
        cartId: paymentMetadata.cartId,
        reservationIds: JSON.stringify(paymentMetadata.reservationIds),
      };
    } else {
      // This is already a Record<string, string>, use it directly
      metadata = params.metadata as Record<string, string>;
    }

    const createParams: Stripe.PaymentIntentCreateParams = {
      amount: params.amount,
      currency: params.currency,
      metadata,
      automatic_payment_methods: params.automaticPaymentMethods || {
        enabled: true,
        allow_redirects: 'never', // Keep user on our site
      },
    };

    // Only add shipping if it's a valid object with required properties
    if (params.shipping && typeof params.shipping === 'object' && params.shipping.address) {
      createParams.shipping = params.shipping;
    }

    console.log('📤 [Stripe] Sending to Stripe API with metadata:', {
      timestamp: new Date().toISOString(),
      metadataKeys: Object.keys(metadata),
      hasCartItems: 'cartItems' in metadata,
      cartItemsLength: metadata.cartItems ? metadata.cartItems.length : 0,
      cartItemsPreview: metadata.cartItems ? metadata.cartItems.substring(0, 100) + '...' : 'N/A'
    });

    const paymentIntent = await stripe.paymentIntents.create(createParams);

    console.log('✅ [Stripe] Payment intent created:', {
      timestamp: new Date().toISOString(),
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      metadataKeys: Object.keys(paymentIntent.metadata || {}),
      hasCartItemsInResponse: 'cartItems' in (paymentIntent.metadata || {})
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

// Update payment intent
export async function updatePaymentIntent(
  paymentIntentId: string,
  params: Partial<CreatePaymentIntentRequest>
): Promise<Stripe.PaymentIntent> {
  console.log('🌟 [Stripe] updatePaymentIntent called with:', {
    timestamp: new Date().toISOString(),
    paymentIntentId,
    hasAmount: !!params.amount,
    hasMetadata: !!params.metadata,
    metadataKeys: params.metadata ? Object.keys(params.metadata) : [],
    hasShipping: !!params.shipping
  });

  try {
    const updateData: Stripe.PaymentIntentUpdateParams = {};

    if (params.amount) updateData.amount = params.amount;

    // Only add shipping if it's a valid object with required properties
    if (params.shipping && typeof params.shipping === 'object' && params.shipping.address) {
      updateData.shipping = params.shipping;
    }

    if (params.metadata) {
      // Handle metadata the same way as in createPaymentIntent
      const metadataKeys = Object.keys(params.metadata);
      const isBasicPaymentMetadata = metadataKeys.length <= 4 &&
        metadataKeys.every(key => ['cartId', 'userId', 'sessionId', 'reservationIds'].includes(key)) &&
        'cartId' in params.metadata;

      if (isBasicPaymentMetadata) {
        // This is a PaymentMetadata object, transform it
        const paymentMetadata = params.metadata as PaymentMetadata;
        updateData.metadata = {
          userId: paymentMetadata.userId || '',
          sessionId: paymentMetadata.sessionId || '',
          cartId: paymentMetadata.cartId,
          reservationIds: JSON.stringify(paymentMetadata.reservationIds),
        };
      } else {
        // This is already a Record<string, string>, use it directly
        updateData.metadata = params.metadata as Record<string, string>;
      }
    }

    console.log('📤 [Stripe] Updating payment intent with data:', {
      timestamp: new Date().toISOString(),
      paymentIntentId,
      hasMetadata: !!updateData.metadata,
      metadataKeys: updateData.metadata ? Object.keys(updateData.metadata) : [],
      hasCartItems: updateData.metadata && 'cartItems' in updateData.metadata,
      cartItemsLength: updateData.metadata && updateData.metadata.cartItems ? updateData.metadata.cartItems.length : 0,
      cartItemsPreview: updateData.metadata && updateData.metadata.cartItems ? updateData.metadata.cartItems.substring(0, 100) + '...' : 'N/A'
    });

    const paymentIntent = await stripe.paymentIntents.update(paymentIntentId, updateData);

    console.log('✅ [Stripe] Payment intent updated:', {
      timestamp: new Date().toISOString(),
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      metadataKeys: Object.keys(paymentIntent.metadata || {}),
      hasCartItemsInResponse: 'cartItems' in (paymentIntent.metadata || {}),
      cartItemsLength: paymentIntent.metadata?.cartItems ? paymentIntent.metadata.cartItems.length : 0
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error updating payment intent:', error);
    throw error;
  }
}

// Retrieve payment intent
export async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  console.log('🔍 [Stripe] Retrieving payment intent:', paymentIntentId);

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log('📦 [Stripe] Retrieved payment intent:', {
      timestamp: new Date().toISOString(),
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      metadataKeys: Object.keys(paymentIntent.metadata || {}),
      hasCartItems: 'cartItems' in (paymentIntent.metadata || {}),
      cartItemsLength: paymentIntent.metadata?.cartItems ? paymentIntent.metadata.cartItems.length : 0,
      cartItemsPreview: paymentIntent.metadata?.cartItems ? paymentIntent.metadata.cartItems.substring(0, 100) + '...' : 'N/A'
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
}

// Cancel payment intent
export async function cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error canceling payment intent:', error);
    throw error;
  }
}

// Create a customer
export async function createCustomer(params: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  try {
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });

    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

// Retrieve customer
export async function retrieveCustomer(customerId: string): Promise<Stripe.Customer> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer as Stripe.Customer;
  } catch (error) {
    console.error('Error retrieving customer:', error);
    throw error;
  }
}

// Calculate tax using Stripe Tax (for countries that support it)
export async function calculateTax(params: {
  amount: number;
  currency: string;
  shipping?: {
    address: {
      line1: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  customer_details?: {
    address: {
      line1: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}): Promise<{ amount_tax: number; tax_breakdown: Stripe.Tax.Calculation.TaxBreakdown[] } | null> {
  try {
    // Only calculate tax for supported countries
    const supportedCountries = ['US', 'CA', 'EU']; // Add more as needed
    const customerCountry = params.customer_details?.address?.country || params.shipping?.address?.country;

    if (!customerCountry || !supportedCountries.includes(customerCountry)) {
      return null; // Use manual tax calculation for unsupported countries
    }

    const calculation = await stripe.tax.calculations.create({
      currency: params.currency,
      line_items: [
        {
          amount: params.amount,
          reference: 'order-total',
        },
      ],
      customer_details: params.customer_details || {
        address: params.shipping!.address,
        address_source: 'shipping',
      },
      shipping_cost: {
        amount: 0, // We'll add shipping separately
      },
    });

    return {
      amount_tax: calculation.amount_tax,
      tax_breakdown: calculation.tax_breakdown,
    };
  } catch (error) {
    console.error('Error calculating tax:', error);
    return null; // Fall back to manual calculation
  }
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

// Handle webhook events
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    throw error;
  }
}

// Webhook event handlers
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log('Payment succeeded:', paymentIntent.id);

  try {
    const metadata = paymentIntent.metadata;
    const reservationIds = metadata.reservationIds ? JSON.parse(metadata.reservationIds) : [];

    // Convert stock reservations to committed stock
    for (const reservationId of reservationIds) {
      await convertReservationToStock(reservationId);
    }

    // Create order record
    await createOrderFromPaymentIntent(paymentIntent);

    // Send confirmation email
    await sendOrderConfirmationEmail(paymentIntent);

    console.log(`Order created successfully for payment intent: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error processing successful payment:', error);
    // Consider implementing retry logic or dead letter queue
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log('Payment failed:', paymentIntent.id);

  try {
    const metadata = paymentIntent.metadata;
    const reservationIds = metadata.reservationIds ? JSON.parse(metadata.reservationIds) : [];

    // Release stock reservations
    for (const reservationId of reservationIds) {
      await releaseStockReservation(reservationId);
    }

    // Update order status to failed
    await updateOrderStatus(paymentIntent.id, 'failed');

    // Send payment failed notification
    await sendPaymentFailedEmail(paymentIntent);

    console.log(`Payment failed processed for: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error processing failed payment:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log('Payment canceled:', paymentIntent.id);

  try {
    const metadata = paymentIntent.metadata;
    const reservationIds = metadata.reservationIds ? JSON.parse(metadata.reservationIds) : [];

    // Release stock reservations
    for (const reservationId of reservationIds) {
      await releaseStockReservation(reservationId);
    }

    // Update order status to canceled
    await updateOrderStatus(paymentIntent.id, 'failed');

    console.log(`Payment cancellation processed for: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error processing canceled payment:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  console.log('Invoice payment succeeded:', invoice.id);
  // Handle subscription or invoice payments if needed
}

async function handleChargeDispute(dispute: Stripe.Dispute): Promise<void> {
  console.log('Charge dispute created:', dispute.id);
  // Handle disputes - notify admins, gather evidence, etc.
}

// Helper functions that integrate with our database
async function convertReservationToStock(reservationId: string): Promise<void> {
  const { releaseStockReservation } = await import('./cart-utils');
  await releaseStockReservation(reservationId);
}

async function releaseStockReservation(reservationId: string): Promise<void> {
  const { releaseStockReservation } = await import('./cart-utils');
  await releaseStockReservation(reservationId);
}

async function createOrderFromPaymentIntent(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    const { getOrderByPaymentIntent } = await import('./order-utils');

    // Check if order already exists (created by frontend)
    const existingOrder = await getOrderByPaymentIntent(paymentIntent.id);

    if (existingOrder) {
      console.log('Order already exists for payment intent:', paymentIntent.id);
      // Order already exists, just ensure it's marked as completed
      const { updateOrderStatus } = await import('./order-utils');
      await updateOrderStatus(paymentIntent.id, 'completed');
      return;
    }

    // Create order via API call (same logic as frontend)
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/orders/create-from-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId: paymentIntent.id,
      }),
    });

    if (response.ok) {
      console.log('Order created successfully via webhook for payment intent:', paymentIntent.id);
    } else {
      console.error('Failed to create order via webhook:', await response.text());
    }
  } catch (error) {
    console.error('Error creating order from payment intent:', error);
  }
}

async function updateOrderStatus(paymentIntentId: string, status: string): Promise<void> {
  try {
    const { updateOrderStatus: updateStatus } = await import('./order-utils');
    await updateStatus(paymentIntentId, status as 'pending' | 'processing' | 'completed' | 'failed' | 'refunded');
    console.log(`Updated order status for ${paymentIntentId} to ${status}`);
  } catch (error) {
    console.error('Error updating order status:', error);
  }
}

async function sendOrderConfirmationEmail(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    const { getOrderByPaymentIntent, getOrderConfirmationData } = await import('./order-utils');
    const { sendOrderConfirmationEmail: sendEmail, sendPaymentConfirmationEmail, getCustomerEmailFromOrder } = await import('./email');

    // Get order data
    const order = await getOrderByPaymentIntent(paymentIntent.id);
    if (!order) {
      console.error('Order not found for payment intent:', paymentIntent.id);
      return;
    }

    const confirmationData = await getOrderConfirmationData(order.id);
    if (!confirmationData) {
      console.error('Could not get order confirmation data for:', order.id);
      return;
    }

    // Get customer email
    let customerEmail = await getCustomerEmailFromOrder(order);

    // If no email from user profile, try to get from Stripe payment intent
    if (!customerEmail && paymentIntent.receipt_email) {
      customerEmail = paymentIntent.receipt_email;
    }

    if (!customerEmail) {
      console.warn('No customer email found for order:', order.id);
      return;
    }

    const emailData = {
      ...confirmationData,
      customerEmail
    };

    // Send both order confirmation and payment confirmation emails
    await sendEmail(emailData);
    await sendPaymentConfirmationEmail(emailData);

    console.log('Order and payment confirmation emails sent successfully for:', order.id);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
}

async function sendPaymentFailedEmail(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    const { getOrderByPaymentIntent, getOrderConfirmationData } = await import('./order-utils');
    const { sendPaymentFailedEmail: sendEmail, getCustomerEmailFromOrder } = await import('./email');

    // Get order data
    const order = await getOrderByPaymentIntent(paymentIntent.id);
    if (!order) {
      console.error('Order not found for payment intent:', paymentIntent.id);
      return;
    }

    const confirmationData = await getOrderConfirmationData(order.id);
    if (!confirmationData) {
      console.error('Could not get order confirmation data for:', order.id);
      return;
    }

    // Get customer email
    let customerEmail = await getCustomerEmailFromOrder(order);

    // If no email from user profile, try to get from Stripe payment intent
    if (!customerEmail && paymentIntent.receipt_email) {
      customerEmail = paymentIntent.receipt_email;
    }

    if (!customerEmail) {
      console.warn('No customer email found for failed payment:', order.id);
      return;
    }

    const emailData = {
      ...confirmationData,
      customerEmail
    };

    await sendEmail(emailData);
    console.log('Payment failed email sent successfully for:', order.id);
  } catch (error) {
    console.error('Error sending payment failed email:', error);
  }
}

// Utility functions
export function formatAmountForStripe(amount: number, currency: string): number {
  // Convert to smallest currency unit (cents for USD, etc.)
  const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];

  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
}

export function formatAmountFromStripe(amount: number, currency: string): number {
  // Convert from smallest currency unit to display amount
  const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];

  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return amount;
  }

  return amount / 100;
}

export default stripe;