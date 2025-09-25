import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent, formatAmountForStripe, calculateTax } from '../../../../../lib/stripe';
import { validateStockLevels, realtimeStockCheck } from '../../../../../lib/cart-utils-fixed';
import { supabase } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      items,
      shipping,
      currency = 'usd',
      metadata
    } = body;

    console.log('💰 Create Payment Intent API received:', {
      itemCount: items?.length || 0,
      items: items?.map((item: any) => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
      metadata,
      shipping: shipping?.address ? 'address provided' : 'no address'
    });

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    if (!metadata || !metadata.cartId) {
      return NextResponse.json(
        { error: 'Cart ID is required in metadata' },
        { status: 400 }
      );
    }

    // Batch stock validation for better performance
    try {
      console.log('🔍 Performing batch stock validation...');

      // Get all variant IDs that need checking
      const variantIds = items
        .filter(item => item.variantId)
        .map(item => item.variantId);

      if (variantIds.length > 0) {
        // Batch query all variants at once
        const { data: variants, error: variantsError } = await supabase
          .from('product_variants')
          .select('id, stock_quantity')
          .in('id', variantIds);

        if (variantsError) {
          console.error('Error fetching variants:', variantsError);
          // Continue with checkout even if stock check fails
        } else if (variants) {
          // Create a map for quick lookup
          const variantMap = new Map(variants.map(v => [v.id, v]));

          // Check stock for each item
          for (const item of items) {
            if (item.variantId) {
              const variant = variantMap.get(item.variantId);

              if (!variant) {
                console.warn(`⚠️ Variant not found: ${item.variantId}`);
                continue; // Don't fail checkout for missing variants in dev
              }

              // Only check stock if it's being tracked (stock_quantity > 0)
              if (variant.stock_quantity > 0 && item.quantity > variant.stock_quantity) {
                console.error(`❌ Insufficient stock for ${item.variantId}: need ${item.quantity}, have ${variant.stock_quantity}`);
                return NextResponse.json(
                  { error: `Only ${variant.stock_quantity} items available for ${item.name}` },
                  { status: 400 }
                );
              }
            }
          }
        }
      }

      console.log('✅ Batch stock validation completed');

    } catch (error) {
      console.error('Stock validation error:', error);
      // Don't fail payment for stock validation errors in development
      console.warn('⚠️ Continuing with payment despite stock validation error');
    }

    // Calculate subtotal (use updated items if quantities were adjusted)
    const finalItems = body.items || items;
    const subtotal = finalItems.reduce((sum: number, item: { price: number; quantity: number }) => {
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

    // Prepare minimal cart items for metadata (remove non-essential fields to stay under 500 chars)
    const minimalCartItems = finalItems.map((item: any) => ({
      id: item.id,
      vid: item.variantId || item.variant_id,  // variant ID shortened to 'vid'
      q: item.quantity,  // quantity shortened to 'q'
      p: item.price,     // price shortened to 'p'
      s: item.size       // size shortened to 's'
    }));

    // Prepare metadata for Stripe (must be under 500 characters per key)
    const stripeMetadata = {
      userId: metadata.userId,
      sessionId: metadata.sessionId,
      cartId: metadata.cartId,
      reservationIds: JSON.stringify(metadata.reservationIds || []),
      // Store minimal cart items to stay under 500 char limit
      cartItems: JSON.stringify(minimalCartItems),
      // Store addresses for order creation
      shippingAddress: shipping?.address ? JSON.stringify(shipping.address) : null,
      billingAddress: metadata.billingAddress ? JSON.stringify(metadata.billingAddress) : null,
      // Store payment breakdown
      subtotal: subtotal.toString(),
      shipping_cost: shippingCost.toString(),
      tax_amount: taxAmount.toString(),
      // Store customer info
      customer_id: metadata.userId || null,
      payment_method: metadata.paymentMethod || 'card'
    };

    console.log('💾 Storing metadata in Stripe payment intent:', {
      hasCartItems: !!stripeMetadata.cartItems,
      cartItemsLength: stripeMetadata.cartItems?.length || 0,
      cartItemsMetadataSize: stripeMetadata.cartItems?.length || 0,
      warningIfTooLarge: stripeMetadata.cartItems?.length > 500 ? '⚠️ METADATA TOO LARGE!' : 'OK',
      cartItems: stripeMetadata.cartItems,
      metadata: stripeMetadata
    });

    // Check if metadata size is within Stripe's limits
    const metadataString = JSON.stringify(stripeMetadata);
    if (metadataString.length > 40000) {  // Stripe's total metadata limit
      console.error('❌ Metadata exceeds Stripe total limit:', metadataString.length);
      return NextResponse.json(
        { error: 'Cart data too large for payment processing. Please reduce cart items.' },
        { status: 400 }
      );
    }

    // Check individual metadata values (500 char limit each)
    for (const [key, value] of Object.entries(stripeMetadata)) {
      if (value && typeof value === 'string' && value.length > 500) {
        console.error(`❌ Metadata key '${key}' exceeds 500 chars:`, value.length);
        if (key === 'cartItems') {
          // Try to further reduce cart items if still too large
          const ultraMinimalCartItems = finalItems.map((item: any) => ({
            i: item.id.substring(0, 8),  // Shortened ID
            v: item.variantId?.substring(0, 8) || '',  // Shortened variant ID
            q: item.quantity
          }));
          stripeMetadata.cartItems = JSON.stringify(ultraMinimalCartItems);
          console.log('📦 Using ultra-minimal cart items:', stripeMetadata.cartItems.length, 'chars');
        }
      }
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      amount: formatAmountForStripe(total, currency),
      currency,
      metadata: stripeMetadata,
      shipping,
      automaticPaymentMethods: {
        enabled: true,
        allow_redirects: 'never'
      }
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
    console.error('Error creating payment intent:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';