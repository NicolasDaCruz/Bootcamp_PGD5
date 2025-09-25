import { supabase } from '@/lib/supabase';
import { CartItem } from '@/contexts/CartContext';

export interface DbCartItem {
  id: string;
  user_id?: string;
  session_id?: string;
  product_id: string;
  product_variant_id?: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface StockReservation {
  id: string;
  cart_item_id?: string;
  product_id: string;
  variant_id?: string;
  quantity_reserved: number;
  expires_at: string;
  status: 'active' | 'expired' | 'released' | 'converted';
  location_id?: string;
}

export interface StockInfo {
  product_id: string;
  variant_id?: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
}

// Generate session ID for guest users
export function generateSessionId(): string {
  if (typeof window !== 'undefined') {
    let sessionId = localStorage.getItem('sneaker-store-session-id');
    if (!sessionId) {
      sessionId = crypto.randomUUID ? crypto.randomUUID() : `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('sneaker-store-session-id', sessionId);
    }
    return sessionId;
  }
  return `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Get current user ID (from Supabase auth)
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.warn('Could not get user ID:', error);
    return null;
  }
}

// Enhanced product variant finder - finds real variants from database
export async function findAvailableVariant(productId: string, preferredVariantId?: string): Promise<any> {
  try {
    // First try the preferred variant if provided
    if (preferredVariantId) {
      const { data: preferredVariant, error: preferredError } = await supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
          size,
          us_size,
          eu_size,
          uk_size,
          stock_quantity,
          reserved_quantity,
          computed_available_stock,
          is_active,
          name,
          value
        `)
        .eq('id', preferredVariantId)
        .eq('is_active', true)
        .single();

      if (preferredVariant && !preferredError) {
        return preferredVariant;
      }
    }

    // Find any available variant for the product
    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select(`
        id,
        product_id,
        size,
        us_size,
        eu_size,
        uk_size,
        stock_quantity,
        reserved_quantity,
        computed_available_stock,
        is_active,
        name,
        value
      `)
      .eq('product_id', productId)
      .eq('is_active', true)
      .gt('computed_available_stock', 0)
      .order('computed_available_stock', { ascending: false })
      .limit(5);

    if (variants && variants.length > 0 && !variantError) {
      return variants[0]; // Return the one with most stock
    }

    return null;
  } catch (error) {
    console.error('Error finding variant:', error);
    return null;
  }
}

// Enhanced stock reservation with robust error handling
export async function createStockReservation(cartItem: CartItem, expirationMinutes: number = 15): Promise<string | null> {
  try {
    console.log('🎯 Creating stock reservation for:', {
      productId: cartItem.productId,
      variantId: cartItem.variantId,
      quantity: cartItem.quantity
    });

    // Find a suitable variant (either the specified one or an alternative)
    const variant = await findAvailableVariant(cartItem.productId, cartItem.variantId);

    if (!variant) {
      console.warn('❌ No available variant found for product:', cartItem.productId);
      return null;
    }

    console.log('✅ Using variant:', {
      id: variant.id,
      stock: variant.computed_available_stock || variant.stock_quantity,
      size: variant.us_size || variant.size || 'N/A'
    });

    // Try the new robust API endpoint first
    let apiEndpoint = '/api/cart/reserve-stock-v2';
    let response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variantId: variant.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
      }),
    });

    // Fallback to original endpoint if new one fails
    if (!response.ok) {
      console.warn('⚠️ V2 endpoint failed, trying original...');
      apiEndpoint = '/api/cart/reserve-stock';
      response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId: variant.id,
          quantity: cartItem.quantity,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Stock reservation failed:', {
        status: response.status,
        error: errorText,
        endpoint: apiEndpoint
      });
      return null;
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ Stock reservation successful:', {
        reservationId: result.reservationId,
        variantId: result.variantId,
        simulated: result.simulated || false
      });
      return result.reservationId;
    } else {
      console.error('❌ Stock reservation failed:', result.error);
      return null;
    }

  } catch (error) {
    console.error('💥 Error in createStockReservation:', error);
    return null;
  }
}

// Enhanced cart item converter with fallback values
export function dbItemToCart(dbItem: DbCartItem, productData: {
  name: string;
  brand: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  stock_quantity?: number;
}, variantData?: any): CartItem {

  // Create size string from variant data
  let sizeString = 'Default';
  if (variantData) {
    if (variantData.us_size) {
      sizeString = `US ${variantData.us_size}`;
    } else if (variantData.eu_size) {
      sizeString = `EU ${variantData.eu_size}`;
    } else if (variantData.size) {
      sizeString = variantData.size.toString();
    }
  } else if (productData.size) {
    sizeString = productData.size;
  }

  // Create color string with fallback
  const colorString = productData.color || variantData?.value || 'Default';

  return {
    id: dbItem.id,
    productId: dbItem.product_id,
    variantId: dbItem.product_variant_id,
    name: productData.name,
    brand: productData.brand,
    price: productData.price,
    image: productData.image,
    size: sizeString,
    color: colorString,
    quantity: dbItem.quantity,
    maxStock: productData.stock_quantity || variantData?.computed_available_stock || 0
  };
}

// Enhanced stock validation with better error handling
export async function validateStockLevels(items: CartItem[]): Promise<{
  valid: boolean;
  issues: { itemId: string; message: string; availableStock: number }[]
}> {
  const issues: { itemId: string; message: string; availableStock: number }[] = [];

  for (const item of items) {
    try {
      let availableStock = 0;

      if (item.variantId) {
        // Check variant-specific stock
        const { data: variantData, error: variantError } = await supabase
          .from('product_variants')
          .select('stock_quantity, reserved_quantity, computed_available_stock')
          .eq('id', item.variantId)
          .eq('is_active', true)
          .single();

        if (variantData && !variantError) {
          availableStock = variantData.computed_available_stock ||
                          Math.max(0, (variantData.stock_quantity || 0) - (variantData.reserved_quantity || 0));
        } else {
          // Try to find alternative variant
          const alternativeVariant = await findAvailableVariant(item.productId);
          if (alternativeVariant) {
            availableStock = alternativeVariant.computed_available_stock || alternativeVariant.stock_quantity || 0;
          }
        }
      } else {
        // Find any variant for this product
        const variant = await findAvailableVariant(item.productId);
        if (variant) {
          availableStock = variant.computed_available_stock || variant.stock_quantity || 0;
        }
      }

      // Check stock levels
      if (availableStock <= 0) {
        issues.push({
          itemId: item.id,
          message: 'Product out of stock',
          availableStock: 0
        });
      } else if (item.quantity > availableStock) {
        issues.push({
          itemId: item.id,
          message: `Only ${availableStock} available`,
          availableStock
        });
      }

    } catch (error) {
      console.error(`Error checking stock for item ${item.id}:`, error);
      issues.push({
        itemId: item.id,
        message: 'Unable to verify stock',
        availableStock: 0
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

// Release stock reservation with error tolerance
export async function releaseStockReservation(reservationId: string, variantId?: string, quantity?: number): Promise<void> {
  try {
    // Skip if no reservation ID
    if (!reservationId) {
      console.log('⚠️ No reservation ID provided for release');
      return;
    }

    // Skip simulated reservations
    if (reservationId.startsWith('sim_')) {
      console.log('⚠️ Skipping release of simulated reservation:', reservationId);
      return;
    }

    // Try to release via API if we have the required info
    if (variantId && quantity) {
      const response = await fetch(`/api/cart/reserve-stock-v2?variantId=${variantId}&quantity=${quantity}&reservationId=${reservationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Stock reservation released:', reservationId);
      } else {
        console.warn('⚠️ Failed to release stock reservation:', reservationId);
      }
    } else {
      console.log('⚠️ Missing variant info for reservation release:', reservationId);
    }

  } catch (error) {
    console.warn('Error releasing stock reservation:', error);
    // Don't throw - this is not critical for user experience
  }
}

// Real-time stock check with graceful degradation
export async function realtimeStockCheck(items: CartItem[]): Promise<{
  valid: boolean;
  updatedItems: CartItem[];
  issues: any[]
}> {
  const issues: any[] = [];
  const updatedItems: CartItem[] = [];

  for (const item of items) {
    try {
      let stockInfo: StockInfo | null = null;
      let variant = null;

      // Try to get current stock info
      if (item.variantId) {
        variant = await findAvailableVariant(item.productId, item.variantId);
      } else {
        variant = await findAvailableVariant(item.productId);
      }

      if (variant) {
        const availableStock = variant.computed_available_stock ||
                              Math.max(0, (variant.stock_quantity || 0) - (variant.reserved_quantity || 0));

        stockInfo = {
          product_id: item.productId,
          variant_id: variant.id,
          current_stock: variant.stock_quantity || 0,
          reserved_stock: variant.reserved_quantity || 0,
          available_stock: availableStock
        };
      }

      // Create updated item
      const updatedItem = { ...item };

      if (!stockInfo || stockInfo.available_stock <= 0) {
        issues.push({
          itemId: item.id,
          message: 'Product no longer available',
          availableStock: 0
        });
        continue;
      }

      // Update max stock
      updatedItem.maxStock = stockInfo.available_stock;

      // Adjust quantity if necessary
      if (item.quantity > stockInfo.available_stock) {
        updatedItem.quantity = stockInfo.available_stock;
        issues.push({
          itemId: item.id,
          message: `Quantity reduced to ${stockInfo.available_stock} (stock limit)`,
          availableStock: stockInfo.available_stock,
          quantityAdjusted: true
        });
      }

      updatedItems.push(updatedItem);

    } catch (error) {
      console.error(`Error checking stock for item ${item.id}:`, error);
      issues.push({
        itemId: item.id,
        message: 'Unable to verify current stock',
        availableStock: item.maxStock || 0
      });
      updatedItems.push(item); // Keep original item
    }
  }

  return {
    valid: issues.filter(i => !i.quantityAdjusted).length === 0,
    updatedItems,
    issues
  };
}

// Helper function to get product with variant data
export async function getProductWithVariant(productId: string, variantId?: string): Promise<{
  product: any;
  variant: any;
} | null> {
  try {
    // Get product data
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) {
      // Fallback to sneakers table
      const { data: sneakerData, error: sneakerError } = await supabase
        .from('sneakers')
        .select('*')
        .eq('id', productId)
        .single();

      if (sneakerError || !sneakerData) {
        return null;
      }

      // Find a variant for this product
      const variant = await findAvailableVariant(productId, variantId);

      return {
        product: {
          id: sneakerData.id,
          name: `${sneakerData.brand} ${sneakerData.model}`,
          brand: sneakerData.brand,
          price: parseFloat(sneakerData.price),
          image_url: sneakerData.image_url
        },
        variant
      };
    }

    // Get variant data
    const variant = await findAvailableVariant(productId, variantId);

    return {
      product: productData,
      variant
    };

  } catch (error) {
    console.error('Error getting product with variant:', error);
    return null;
  }
}

// Re-export functions from original cart-utils for compatibility
export { syncCartToDatabase } from './cart-utils';
export { loadCartFromDatabase } from './cart-utils';
export { cartItemToDb } from './cart-utils';
export { extendStockReservation } from './cart-utils';
export { validateReservation } from './cart-utils';
export { confirmReservation } from './cart-utils';
export { getProductStockInfo } from './cart-utils';
export { getVariantStockInfo } from './cart-utils';
export { getActiveReservations } from './cart-utils';
export { cleanupExpiredReservations } from './cart-utils';