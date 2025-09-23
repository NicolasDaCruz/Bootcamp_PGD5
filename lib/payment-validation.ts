/**
 * Payment Metadata Flow Validation
 * Ensures cart items persist through the entire payment flow
 */

import { stripe } from './stripe';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
}

/**
 * Validates that cart items are properly stored in payment intent metadata
 */
export async function validatePaymentMetadata(
  paymentIntentId: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    console.log('🔍 [Validation] Starting payment metadata validation:', {
      timestamp: new Date().toISOString(),
      paymentIntentId
    });

    // Retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      errors.push('Payment intent not found');
      return { isValid: false, errors, warnings };
    }

    const metadata = paymentIntent.metadata || {};

    // Check for cart items
    if (!metadata.cartItems) {
      errors.push('No cartItems field in metadata');
    } else if (metadata.cartItems === 'null' || metadata.cartItems === '') {
      errors.push('cartItems field is empty or null');
    } else {
      // Try to parse cart items
      try {
        const cartItems = JSON.parse(metadata.cartItems);

        if (!Array.isArray(cartItems)) {
          errors.push('cartItems is not an array');
        } else if (cartItems.length === 0) {
          errors.push('cartItems array is empty');
        } else {
          // Validate each cart item
          cartItems.forEach((item: any, index: number) => {
            if (!item.id && !item.productId) {
              warnings.push(`Cart item ${index} missing product ID`);
            }
            if (!item.quantity || item.quantity <= 0) {
              errors.push(`Cart item ${index} has invalid quantity`);
            }
            if (!item.price || item.price <= 0) {
              warnings.push(`Cart item ${index} has invalid price`);
            }
            if (!item.name) {
              warnings.push(`Cart item ${index} missing name`);
            }
          });

          console.log('✅ [Validation] Cart items validated:', {
            count: cartItems.length,
            items: cartItems.map((item: any) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price
            }))
          });
        }
      } catch (parseError) {
        errors.push(`Failed to parse cartItems: ${parseError}`);
      }
    }

    // Check for other required metadata
    if (!metadata.cartId) {
      warnings.push('Missing cartId in metadata');
    }

    if (!metadata.reservationIds) {
      warnings.push('Missing reservationIds in metadata');
    } else {
      try {
        const reservationIds = JSON.parse(metadata.reservationIds);
        if (!Array.isArray(reservationIds)) {
          warnings.push('reservationIds is not an array');
        }
      } catch {
        warnings.push('Failed to parse reservationIds');
      }
    }

    // Check for shipping and billing addresses
    if (!metadata.shippingAddress) {
      warnings.push('Missing shippingAddress in metadata');
    } else {
      try {
        const shippingAddress = JSON.parse(metadata.shippingAddress);
        if (!shippingAddress.line1 || !shippingAddress.city || !shippingAddress.postal_code) {
          warnings.push('Incomplete shipping address');
        }
      } catch {
        warnings.push('Failed to parse shippingAddress');
      }
    }

    // Check payment breakdown
    if (!metadata.subtotal || !metadata.shipping_cost || !metadata.tax_amount) {
      warnings.push('Missing payment breakdown in metadata');
    }

    const isValid = errors.length === 0;

    console.log(`${isValid ? '✅' : '❌'} [Validation] Payment metadata validation complete:`, {
      timestamp: new Date().toISOString(),
      paymentIntentId,
      isValid,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors,
      warnings
    });

    return {
      isValid,
      errors,
      warnings,
      metadata
    };

  } catch (error) {
    console.error('❌ [Validation] Error during validation:', error);
    errors.push(`Validation error: ${error}`);
    return { isValid: false, errors, warnings };
  }
}

/**
 * Ensures metadata is properly set during payment intent creation
 */
export function validateMetadataBeforeCreation(
  items: any[],
  metadata: Record<string, any>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 [Validation] Validating metadata before creation:', {
    timestamp: new Date().toISOString(),
    itemCount: items?.length || 0,
    metadataKeys: Object.keys(metadata || {})
  });

  // Validate items
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('No items provided for payment');
    return { isValid: false, errors, warnings };
  }

  // Validate each item
  items.forEach((item, index) => {
    if (!item.id && !item.productId) {
      errors.push(`Item ${index} missing product ID`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index} has invalid quantity`);
    }
    if (!item.price || item.price < 0) {
      errors.push(`Item ${index} has invalid price`);
    }
    if (!item.name) {
      warnings.push(`Item ${index} missing name`);
    }
  });

  // Validate metadata
  if (!metadata) {
    errors.push('No metadata provided');
  } else {
    if (!metadata.cartId) {
      errors.push('Missing cartId in metadata');
    }
    if (!metadata.reservationIds && !Array.isArray(metadata.reservationIds)) {
      warnings.push('Missing or invalid reservationIds in metadata');
    }
  }

  const isValid = errors.length === 0;

  console.log(`${isValid ? '✅' : '❌'} [Validation] Pre-creation validation complete:`, {
    timestamp: new Date().toISOString(),
    isValid,
    errorCount: errors.length,
    warningCount: warnings.length
  });

  return { isValid, errors, warnings, metadata };
}

/**
 * Recovers missing metadata from various sources
 */
export async function recoverMissingMetadata(
  paymentIntentId: string,
  fallbackItems?: any[]
): Promise<Record<string, any> | null> {
  console.log('🔄 [Validation] Attempting to recover missing metadata:', {
    timestamp: new Date().toISOString(),
    paymentIntentId,
    hasFallbackItems: !!fallbackItems
  });

  try {
    // Try to get metadata from payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata && paymentIntent.metadata.cartItems) {
      console.log('✅ [Validation] Metadata found in payment intent');
      return paymentIntent.metadata;
    }

    // If fallback items provided, create new metadata
    if (fallbackItems && fallbackItems.length > 0) {
      const recoveredMetadata = {
        cartItems: JSON.stringify(fallbackItems),
        cartId: `recovered_${Date.now()}`,
        reservationIds: JSON.stringify([]),
        recovered: 'true',
        recoveredAt: new Date().toISOString()
      };

      console.log('✅ [Validation] Metadata recovered from fallback items');

      // Try to update the payment intent with recovered metadata
      try {
        await stripe.paymentIntents.update(paymentIntentId, {
          metadata: recoveredMetadata
        });
        console.log('✅ [Validation] Updated payment intent with recovered metadata');
      } catch (updateError) {
        console.warn('⚠️ [Validation] Could not update payment intent:', updateError);
      }

      return recoveredMetadata;
    }

    console.error('❌ [Validation] Could not recover metadata');
    return null;

  } catch (error) {
    console.error('❌ [Validation] Error recovering metadata:', error);
    return null;
  }
}

/**
 * Logs the complete metadata flow for debugging
 */
export function logMetadataFlow(
  stage: string,
  data: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    stage,
    ...data
  };

  console.log(`📊 [Metadata Flow] ${stage}:`, logEntry);

  // In production, you might want to send this to a logging service
  // Example: sendToLoggingService(logEntry);
}