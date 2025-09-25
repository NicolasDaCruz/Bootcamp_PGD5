import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentIntent, formatAmountForStripe, calculateTax } from '../../../../../lib/stripe';
import { validateStockLevels } from '../../../../../lib/cart-utils-fixed';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      paymentIntentId,
      items,
      shipping,
      currency = 'usd',
      metadata
    } = body;

    console.log('🔄 Update Payment Intent API received:', {
      timestamp: new Date().toISOString(),
      paymentIntentId,
      itemCount: items?.length || 0,
      items: items?.map((item: any) => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
      metadata,
      shipping: shipping?.address ? 'address provided' : 'no address',
      hasShippingInBody: !!shipping,
      shippingDetails: shipping
    });

    // Validate required fields
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    // Validate stock availability (skip if stock table doesn't exist)
    try {
      const stockValidation = await validateStockLevels(items);
      if (!stockValidation.valid) {
        console.warn('Stock validation issues:', stockValidation.issues);
        // For development: allow checkout to continue with stock warnings
        // In production: you might want to return an error here
      }
    } catch (error) {
      console.warn('Stock validation not available:', error);
      // Continue without stock validation for development
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Calculate shipping
    const shippingCost = subtotal >= 50 ? 0 : 9.99;

    // Calculate tax (simplified for better performance in development)
    let taxAmount = 0;
    if (shipping && process.env.NODE_ENV === 'production') {
      // Only use Stripe Tax API in production
      const taxResult = await calculateTax({
        amount: formatAmountForStripe(subtotal + shippingCost, currency),
        currency,
        shipping: {
          address: shipping.address
        }
      });

      if (taxResult) {
        taxAmount = taxResult.amount_tax / 100; // Convert from cents
      } else {
        // Manual tax calculation (8% default)
        taxAmount = (subtotal + shippingCost) * 0.08;
      }
    } else {
      // Simplified tax calculation for development (8% default)
      taxAmount = (subtotal + shippingCost) * 0.08;
      console.log('📊 Using simplified tax calculation:', { rate: '8%', amount: taxAmount });
    }

    // Calculate total
    const total = subtotal + shippingCost + taxAmount;

    // Prepare minimal cart items for metadata (to stay under 500 char limit)
    const minimalCartItems = items.map((item: any) => ({
      id: item.id,
      vid: item.variantId || item.variant_id,  // variant ID shortened to 'vid'
      q: item.quantity,  // quantity shortened to 'q'
      p: item.price,     // price shortened to 'p'
      s: item.size       // size shortened to 's'
    }));

    // Prepare complete metadata for update (preserving cart items)
    const updateMetadata = {
      // Preserve original metadata
      userId: metadata?.userId,
      sessionId: metadata?.sessionId,
      cartId: metadata?.cartId,
      reservationIds: JSON.stringify(Array.isArray(metadata?.reservationIds) ? metadata.reservationIds : []),
      // Re-store cart items and payment breakdown (critical for order creation)
      cartItems: JSON.stringify(minimalCartItems),
      shippingAddress: shipping?.address ? JSON.stringify(shipping.address) : null,
      billingAddress: metadata?.billingAddress || (shipping?.address ? JSON.stringify(shipping.address) : null),
      subtotal: subtotal.toString(),
      shipping_cost: shippingCost.toString(),
      tax_amount: taxAmount.toString(),
      customer_id: metadata?.userId || null,
      payment_method: metadata?.paymentMethod || 'card',
      customer_email: metadata?.customer_email || null
    };

    console.log('🔄 Updating Stripe payment intent with metadata:', {
      timestamp: new Date().toISOString(),
      paymentIntentId,
      hasCartItems: !!updateMetadata.cartItems,
      cartItemsLength: updateMetadata.cartItems?.length || 0,
      cartItemsPreview: updateMetadata.cartItems ? updateMetadata.cartItems.substring(0, 200) + '...' : 'N/A',
      metadataKeys: Object.keys(updateMetadata),
      fullMetadata: updateMetadata
    });

    // Update payment intent with complete metadata (preserving cart items)
    const paymentIntent = await updatePaymentIntent(paymentIntentId, {
      amount: formatAmountForStripe(total, currency),
      shipping,
      metadata: updateMetadata
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
      breakdown: {
        subtotal,
        shipping: shippingCost,
        tax: taxAmount,
        total
      }
    });

  } catch (error) {
    console.error('Error updating payment intent:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update payment intent' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';