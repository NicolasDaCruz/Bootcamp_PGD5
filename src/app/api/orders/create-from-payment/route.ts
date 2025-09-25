import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '../../../../../lib/order-utils';
import { stripe } from '../../../../../lib/stripe';
import { sendOrderConfirmationEmail, EmailData } from '../../../../../lib/email';

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Creating order for payment intent:', paymentIntentId);

    // Get the payment intent from Stripe to extract metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed successfully' },
        { status: 400 }
      );
    }

    // Extract cart data from payment intent metadata
    const metadata = paymentIntent.metadata;

    console.log('🔍 Payment Intent Metadata Debug:', {
      timestamp: new Date().toISOString(),
      paymentIntentId,
      paymentIntentStatus: paymentIntent.status,
      metadataKeys: Object.keys(metadata),
      metadata: metadata,
      hasCartItems: !!metadata.cartItems,
      cartItemsType: typeof metadata.cartItems,
      cartItemsLength: metadata.cartItems ? metadata.cartItems.length : 0,
      cartItemsValue: metadata.cartItems,
      hasReservationIds: !!metadata.reservationIds,
      reservationIds: metadata.reservationIds
    });

    if (!metadata.cartItems || metadata.cartItems === 'null' || metadata.cartItems === '') {
      console.error('❌ No cart items found in payment intent metadata');
      console.error('❌ Available metadata keys:', Object.keys(metadata));
      console.error('❌ Full metadata object:', JSON.stringify(metadata, null, 2));
      console.error('❌ Cart items value:', metadata.cartItems);
      console.error('❌ Payment Intent ID:', paymentIntentId);

      // Try to retrieve the payment intent again to check if metadata was updated
      console.log('🔄 Attempting to re-fetch payment intent to check for updated metadata...');
      const refreshedPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge']
      });

      if (refreshedPaymentIntent.metadata.cartItems && refreshedPaymentIntent.metadata.cartItems !== 'null') {
        console.log('✅ Found cart items in refreshed payment intent metadata');
        metadata.cartItems = refreshedPaymentIntent.metadata.cartItems;
      } else {
        console.error('❌ Still no cart items found after refresh');
        return NextResponse.json(
          { error: 'No cart items found in payment intent. Please ensure items are in cart before checkout.' },
          { status: 400 }
        );
      }
    }

    let cartItems;
    let shippingAddress;
    let billingAddress;
    let reservationIds: string[] = [];

    try {
      console.log('🔧 Parsing cart items from metadata:', metadata.cartItems);
      const rawCartItems = JSON.parse(metadata.cartItems);

      // Check if this is the minimal format (keys: id, vid, q, p, s) or full format
      const isMinimalFormat = rawCartItems.length > 0 &&
        rawCartItems[0].hasOwnProperty('vid') &&
        rawCartItems[0].hasOwnProperty('q') &&
        rawCartItems[0].hasOwnProperty('p');

      if (isMinimalFormat) {
        // Convert minimal format back to full format for processing
        console.log('📦 Detected minimal cart format, converting to full format...');

        // Fetch product details for minimal items
        const productIds = [...new Set(rawCartItems.map((item: any) => {
          // Extract the actual product UUID if it's a concatenated ID
          let id = item.id;
          if (id && id.includes('-') && id.length > 36) {
            const parts = id.split('-');
            if (parts.length >= 5) {
              id = parts.slice(0, 5).join('-');
            }
          }
          return id;
        }))];

        // Use direct API approach
        const { queryProducts } = await import('../../../../../lib/supabase-direct');
        const { data: products } = await queryProducts(productIds);

        const productMap = new Map(products?.map(p => [p.id, p]) || []);

        cartItems = rawCartItems.map((item: any) => {
          // Extract the actual product UUID for lookup
          let productId = item.id;
          if (productId && productId.includes('-') && productId.length > 36) {
            const parts = productId.split('-');
            if (parts.length >= 5) {
              productId = parts.slice(0, 5).join('-');
            }
          }

          const product = productMap.get(productId);
          // Extract first image URL from original_image_urls jsonb field
          const imageUrl = product?.original_image_urls?.[0] || null;
          return {
            id: item.id,
            productId: productId, // Use the extracted UUID here
            variantId: item.vid,
            quantity: item.q,
            price: item.p,
            size: item.s,
            // Use fetched product data or defaults
            name: product?.name || 'Unknown Product',
            brand: product?.brand || 'Unknown Brand',
            sku: product?.sku || null,
            image: imageUrl,
            color: null
          };
        });
      } else {
        // Use the full format as-is
        cartItems = rawCartItems;
      }

      console.log('✅ Successfully parsed cart items:', {
        count: cartItems.length,
        format: isMinimalFormat ? 'minimal' : 'full',
        items: cartItems.map((item: any) => ({
          id: item.id || item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
          size: item.size
        }))
      });

      // Parse reservation IDs if present
      if (metadata.reservationIds && metadata.reservationIds !== 'null') {
        try {
          reservationIds = JSON.parse(metadata.reservationIds);
          console.log('✅ Successfully parsed reservation IDs:', reservationIds);
        } catch (error) {
          console.warn('⚠️ Failed to parse reservation IDs:', error);
          reservationIds = [];
        }
      }

      // Validate cart items structure
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        throw new Error('Cart items must be a non-empty array');
      }

      // Validate each cart item has required fields
      for (const item of cartItems) {
        if (!item.id && !item.productId) {
          throw new Error('Cart item missing product ID');
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error('Cart item missing or invalid quantity');
        }
        if (!item.price || item.price <= 0) {
          throw new Error('Cart item missing or invalid price');
        }
      }

      if (metadata.shippingAddress && metadata.shippingAddress !== 'null') {
        shippingAddress = JSON.parse(metadata.shippingAddress);
        console.log('✅ Successfully parsed shipping address');
      }

      if (metadata.billingAddress && metadata.billingAddress !== 'null') {
        billingAddress = JSON.parse(metadata.billingAddress);
        console.log('✅ Successfully parsed billing address');
      }
    } catch (error) {
      console.error('❌ Error parsing metadata:', error);
      console.error('❌ Cart items raw value:', metadata.cartItems);
      console.error('❌ Shipping address raw value:', metadata.shippingAddress);
      console.error('❌ Billing address raw value:', metadata.billingAddress);
      return NextResponse.json(
        { error: 'Invalid cart data in payment intent' },
        { status: 400 }
      );
    }

    // Create the order with correct amounts (database stores in dollars, not cents)
    const subtotalAmount = metadata.subtotal ? parseFloat(metadata.subtotal) : 0;
    const taxAmount = metadata.tax_amount ? parseFloat(metadata.tax_amount) : 0;
    const shippingAmount = metadata.shipping_cost ? parseFloat(metadata.shipping_cost) : 0;
    const totalAmount = paymentIntent.amount / 100; // Convert from cents to dollars

    // Generate order number first
    const orderNumber = `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Date.now()).slice(-6)}`;

    // Generate tracking number
    const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Handle stock reservations if present - confirm them before creating order
    if (reservationIds.length > 0) {
      console.log('🔒 Confirming stock reservations before creating order...');

      try {
        const { confirmReservation, validateReservation } = await import('../../../../../lib/cart-utils');

        const reservationResults = [];

        // First validate all reservations are still active
        for (const reservationId of reservationIds) {
          const validation = await validateReservation(reservationId);
          if (!validation.valid) {
            console.error(`❌ Reservation ${reservationId} is invalid:`, validation.reason);
            return NextResponse.json(
              {
                error: `Stock reservation has expired or is invalid. Please try your purchase again.`,
                details: validation.reason
              },
              { status: 409 }
            );
          }
          reservationResults.push({ reservationId, valid: true });
        }

        console.log('✅ All reservations validated successfully');

        // Now confirm all reservations with the order number
        for (const reservationId of reservationIds) {
          const confirmed = await confirmReservation(reservationId, orderNumber);
          if (!confirmed) {
            console.error(`❌ Failed to confirm reservation ${reservationId}`);
            // At this point, payment has succeeded but we can't confirm the reservation
            // This is a critical error that needs manual intervention
            console.error('🚨 CRITICAL: Payment succeeded but reservation confirmation failed - manual intervention required');
            // Continue with order creation but log this for investigation
          } else {
            console.log(`✅ Confirmed reservation ${reservationId} for order ${orderNumber}`);
          }
        }

        console.log('✅ Stock reservations confirmed successfully');

      } catch (reservationError) {
        console.error('💥 Error handling stock reservations:', reservationError);
        // At this point payment has succeeded, so we need to handle this gracefully
        // Log the error but continue with order creation
        console.error('🚨 CRITICAL: Payment succeeded but reservation handling failed - manual stock reconciliation required');
      }
    }

    // Extract customer email from various sources
    let customerEmail = 'guest@example.com'; // Default
    if (shippingAddress?.email) {
      customerEmail = shippingAddress.email;
    } else if (billingAddress?.email) {
      customerEmail = billingAddress.email;
    } else if (metadata.customer_email) {
      customerEmail = metadata.customer_email;
    }

    // Extract address information
    const shippingInfo = shippingAddress || billingAddress || {};
    const billingInfo = billingAddress || shippingAddress || {};

    const orderData = {
      order_number: orderNumber,
      customer_id: metadata.customer_id || null,
      status: 'confirmed',  // Changed from 'completed' to 'confirmed' - valid enum value
      subtotal: subtotalAmount,
      tax_amount: taxAmount,
      shipping_amount: shippingAmount,
      total: totalAmount,
      currency: 'usd',
      customer_email: customerEmail,
      billing_full_name: billingInfo.name || 'Guest Customer',
      billing_address: billingInfo.line1 || 'N/A',
      billing_city: billingInfo.city || 'N/A',
      billing_country: billingInfo.country || 'US',
      billing_postal_code: billingInfo.postal_code || '00000',
      shipping_full_name: shippingInfo.name || 'Guest Customer',
      shipping_address: shippingInfo.line1 || 'N/A',
      shipping_city: shippingInfo.city || 'N/A',
      shipping_country: shippingInfo.country || 'US',
      shipping_postal_code: shippingInfo.postal_code || '00000',
      payment_status: 'paid',
      payment_method: metadata.payment_method || 'card',
      payment_intent_id: paymentIntentId,  // Add payment intent ID for order retrieval
      shipping_status: 'pending',
      tracking_number: trackingNumber,  // Add tracking number
      order_notes: metadata.notes || null
    };

    console.log('📦 Order data prepared:', {
      paymentIntentId,
      itemCount: cartItems.length,
      totalAmount: paymentIntent.amount,
      customerId: metadata.customer_id || 'guest',
      orderStatus: orderData.status,  // Add explicit logging of the status
      fullOrderData: orderData  // Log complete order data
    });

    console.log('🔍 Calling createOrder with status:', orderData.status);
    const order = await createOrder(orderData);

    if (!order) {
      return NextResponse.json(
        { error: 'Failed to create order record' },
        { status: 500 }
      );
    }

    console.log('✅ Order created successfully:', order.id);

    // Create order items from cart data
    try {
      // Use direct API approach
      const { insertOrderItems } = await import('../../../../../lib/supabase-direct');

      const orderItems = cartItems.map((item: any) => {
        // Extract the actual product UUID from the concatenated ID
        // ID format: "productId-variantId-size-color-timestamp"
        const originalId = item.productId || item.id || item.i;
        let productId = originalId;
        let variantId = item.variantId || item.vid || item.v || null;

        // UUID regex pattern
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

        // If it's a concatenated ID, extract just the first UUID
        if (originalId && typeof originalId === 'string') {
          // Check if the ID contains multiple UUIDs concatenated
          const uuidMatch = originalId.match(uuidPattern);
          if (uuidMatch) {
            // Extract the first UUID (product ID)
            productId = uuidMatch[0];

            // Try to extract the second UUID (variant ID) if not already provided
            if (!variantId && originalId.length > 36) {
              const remainingString = originalId.substring(37); // Skip first UUID + hyphen
              const variantMatch = remainingString.match(uuidPattern);
              if (variantMatch) {
                variantId = variantMatch[0];
              }
            }
          }
        }

        // Ensure productId is a valid UUID format
        if (!uuidPattern.test(productId)) {
          console.error('❌ Invalid product ID format:', productId);
          // Try to extract from the original concatenated ID
          if (originalId && originalId.includes('-')) {
            const firstUuid = originalId.substring(0, 36);
            if (uuidPattern.test(firstUuid)) {
              productId = firstUuid;
            }
          }
        }

        console.log('📦 Creating order item:', {
          originalId: item.productId || item.id || item.i,
          extractedProductId: productId,
          extractedVariantId: variantId,
          name: item.name,
          quantity: item.quantity || item.q,
          price: item.price || item.p,
          size: item.size || item.s
        });

        return {
          order_id: order.id,
          product_id: productId,
          product_variant_id: variantId,
          quantity: item.quantity || item.q,
          unit_price: item.price || item.p,
          total_price: (item.price || item.p) * (item.quantity || item.q),
          product_name: item.name || 'Unknown Product',
          product_sku: item.sku || `SKU-${productId.substring(0, 8)}`,
          variant_name: item.size || item.s ? 'Size' : null,
          variant_value: item.size || item.s || null
        };
      });

      const { error: itemsError } = await insertOrderItems(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Order was created but items failed - this is a partial success
        // Could consider rolling back the order here
      } else {
        console.log('✅ Order items created successfully:', orderItems.length, 'items');

        // Handle stock updates based on whether we used reservations
        if (reservationIds.length > 0) {
          console.log('✅ Stock updates handled via reservation confirmation - no manual stock updates needed');

          // Create stock movements for audit trail
          try {
            const stockMovements = cartItems.map((item: any) => {
              // Extract product and variant IDs using same logic as order items
              const originalId = item.productId || item.id || item.i;
              let productId = originalId;
              let variantId = item.variantId || item.vid || item.v || null;
              const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

              if (originalId && typeof originalId === 'string') {
                const uuidMatch = originalId.match(uuidPattern);
                if (uuidMatch) {
                  productId = uuidMatch[0];
                  if (!variantId && originalId.length > 36) {
                    const remainingString = originalId.substring(37);
                    const variantMatch = remainingString.match(uuidPattern);
                    if (variantMatch) {
                      variantId = variantMatch[0];
                    }
                  }
                }
              }

              return {
                product_id: productId,
                variant_id: variantId,
                movement_type: 'sale',
                quantity: -(item.quantity || item.q),
                reason: 'order_fulfillment',
                reference_type: 'order',
                reference_id: order.id,
                reference_number: orderNumber,
                notes: `Order ${orderNumber} - reservation confirmed`
              };
            });

            const { error: movementError } = await supabaseAdmin
              .from('stock_movements')
              .insert(stockMovements);

            if (movementError) {
              console.error('❌ Failed to create stock movements for audit trail:', movementError);
            } else {
              console.log('✅ Stock movement records created for audit trail');
            }
          } catch (auditError) {
            console.error('❌ Error creating audit trail:', auditError);
          }

        } else {
          // Fallback to atomic stock updates for orders without reservations
          console.log('📊 No reservations found - performing atomic stock updates...');

          try {
            // Apply the new migration first if needed
            console.log('🔧 Ensuring stock management functions are available...');

            try {
              // Check if function exists
              const { data: functionExists } = await supabaseAdmin
                .rpc('update_variant_stock', { variant_id: '00000000-0000-0000-0000-000000000000', quantity_change: 0 })
                .then(() => ({ data: true }))
                .catch(() => ({ data: false }));

              if (!functionExists) {
                console.log('🔧 Creating missing stock management functions...');

                // Read and execute the migration
                const fs = await import('fs');
                const path = await import('path');
                const migrationPath = path.join(process.cwd(), 'supabase/migrations/006_add_update_variant_stock_function.sql');

                if (fs.existsSync(migrationPath)) {
                  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

                  // Split by statements and execute
                  const statements = migrationSQL
                    .split(';')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

                  for (const statement of statements) {
                    if (statement.toLowerCase().includes('create') || statement.toLowerCase().includes('grant')) {
                      try {
                        await supabaseAdmin.rpc('exec_sql', { sql: statement });
                      } catch (execError) {
                        console.warn('⚠️ Migration statement warning:', statement.substring(0, 100), execError);
                      }
                    }
                  }
                  console.log('✅ Stock management functions installed');
                } else {
                  console.warn('⚠️ Migration file not found, using fallback stock update');
                }
              }
            } catch (migrationError) {
              console.warn('⚠️ Migration check failed, proceeding with existing functions:', migrationError);
            }

            // Prepare order items for atomic stock processing
            const orderItemsForStock = cartItems.map(item => ({
              product_id: item.productId || item.id,
              variant_id: item.variantId,
              quantity: item.quantity,
              name: item.name
            }));

            console.log('🔄 Processing atomic stock changes for order:', order.id);

            // Use the new atomic stock processing function
            const { data: stockResult, error: stockError } = await supabaseAdmin
              .rpc('process_order_stock_changes', {
                order_id: order.id,
                order_items: orderItemsForStock
              });

            if (stockError) {
              console.error('❌ Atomic stock processing failed:', stockError);

              // Fallback to individual stock updates
              console.log('🔄 Falling back to individual stock updates...');

              const stockUpdateResults: Array<{ item: any; success: boolean; error?: string }> = [];

              for (const item of cartItems) {
                const productId = item.productId || item.id;
                console.log('📊 Updating stock for product:', productId, 'variant:', item.variantId, 'quantity:', -item.quantity);

                try {
                  // Try the new function first
                  const { data: updateResult, error: updateError } = await supabaseAdmin
                    .rpc('update_variant_stock', {
                      variant_id: item.variantId,
                      quantity_change: -item.quantity
                    });

                  if (updateError || !updateResult?.success) {
                    // Fallback to manual update
                    const { updateProductStock } = await import('../../../../../lib/order-utils');
                    const result = await updateProductStock(
                      productId,
                      item.variantId,
                      -item.quantity
                    );

                    stockUpdateResults.push({
                      item,
                      success: result.success,
                      error: result.error
                    });
                  } else {
                    stockUpdateResults.push({
                      item,
                      success: true,
                      error: undefined
                    });
                    console.log(`✅ Successfully updated stock for ${item.name}`);
                  }
                } catch (updateError) {
                  console.error(`❌ Failed to update stock for ${productId}:`, updateError);
                  stockUpdateResults.push({
                    item,
                    success: false,
                    error: updateError instanceof Error ? updateError.message : String(updateError)
                  });
                }
              }

              const successfulUpdates = stockUpdateResults.filter(r => r.success).length;
              const failedUpdates = stockUpdateResults.filter(r => !r.success).length;

              console.log(`✅ Stock update summary: ${successfulUpdates} successful, ${failedUpdates} failed out of ${cartItems.length} items`);

              if (failedUpdates > 0) {
                console.error('❌ Some stock updates failed:', stockUpdateResults.filter(r => !r.success));
                // In production, this should trigger alerts and manual review
              }
            } else if (stockResult?.success) {
              console.log('✅ Atomic stock processing completed successfully:', stockResult);
            } else {
              console.error('❌ Atomic stock processing returned failure:', stockResult);
            }
          } catch (stockError) {
            console.error('💥 Critical error updating stock levels:', stockError);
            // Don't fail the order if stock update fails since payment succeeded
            // This needs manual intervention to reconcile stock
          }
        }
      }
    } catch (itemsError) {
      console.error('Error processing order items:', itemsError);
      // Continue anyway as the order itself was created successfully
    }

    // Send order confirmation email
    try {
      console.log('📧 Sending order confirmation email...');

      // Prepare email data
      const emailData: EmailData = {
        order: order,
        items: cartItems.map((item: any) => ({
          id: `${order.id}-${item.productId || item.id}`,
          order_id: order.id,
          product_id: item.productId || item.id,
          product_variant_id: item.variantId || null,
          product_name: item.name || 'Product',
          product_brand: item.brand || 'Brand',
          variant_name: item.size ? 'Size' : null,
          variant_value: item.size || null,
          quantity: item.quantity,
          unit_price: Math.round(item.price * 100), // Convert to cents
          total_price: Math.round(item.price * item.quantity * 100), // Convert to cents
          size: item.size,
          color: item.color || 'Default',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })),
        total: {
          subtotal: Math.round(subtotalAmount * 100), // Convert to cents
          shipping: Math.round(shippingAmount * 100), // Convert to cents
          tax: Math.round(taxAmount * 100), // Convert to cents
          total: Math.round(totalAmount * 100) // Convert to cents
        },
        customerEmail: customerEmail
      };

      const emailSent = await sendOrderConfirmationEmail(emailData);
      if (emailSent) {
        console.log('✅ Order confirmation email sent successfully');
      } else {
        console.warn('⚠️ Order confirmation email failed to send');
      }
    } catch (emailError) {
      console.error('❌ Error sending order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number
    });

  } catch (error) {
    console.error('💥 Error creating order from payment:', error);

    return NextResponse.json(
      {
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}