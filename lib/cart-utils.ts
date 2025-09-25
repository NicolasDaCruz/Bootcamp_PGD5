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
      sessionId = crypto.randomUUID ? crypto.randomUUID() : `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sneaker-store-session-id', sessionId);
    }
    return sessionId;
  }
  return `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get current user ID (from Supabase auth)
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// Convert CartItem to database format
export function cartItemToDb(item: CartItem, userId?: string, sessionId?: string): Omit<DbCartItem, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    session_id: sessionId,
    product_id: item.productId,
    product_variant_id: item.variantId,
    quantity: item.quantity
  };
}

// Convert database item to CartItem
export function dbItemToCart(dbItem: DbCartItem, productData: {
  name: string;
  brand: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  stock_quantity?: number;
}): CartItem {
  return {
    id: dbItem.id,
    productId: dbItem.product_id,
    variantId: dbItem.product_variant_id,
    name: productData.name,
    brand: productData.brand,
    price: productData.price,
    image: productData.image,
    size: productData.size || 'Default',
    color: productData.color || 'Default',
    quantity: dbItem.quantity,
    maxStock: productData.stock_quantity || 0
  };
}

// Sync cart to database
export async function syncCartToDatabase(items: CartItem[]): Promise<void> {
  const userId = await getCurrentUserId();
  const sessionId = userId ? undefined : generateSessionId();

  try {
    // Clear existing cart items for this user/session
    const deleteQuery = userId
      ? supabase.from('cart_items').delete().eq('user_id', userId)
      : supabase.from('cart_items').delete().eq('session_id', sessionId);

    await deleteQuery;

    // Insert new cart items
    if (items.length > 0) {
      const dbItems = items.map(item => cartItemToDb(item, userId, sessionId));
      await supabase.from('cart_items').insert(dbItems);
    }
  } catch (error) {
    console.error('Error syncing cart to database:', error);
  }
}

// Load cart from database - SIMPLIFIED to use only sneakers table
export async function loadCartFromDatabase(): Promise<CartItem[]> {
  const userId = await getCurrentUserId();
  const sessionId = userId ? undefined : generateSessionId();

  try {
    const query = userId
      ? supabase.from('cart_items').select('*').eq('user_id', userId)
      : supabase.from('cart_items').select('*').eq('session_id', sessionId);

    const { data: cartItems, error } = await query;

    if (error) {
      // Network connectivity issue - cart will work with localStorage only
      console.warn('Cart database connection failed - using localStorage only:', error?.message || 'Network error');
      return [];
    }

    // Get product data for each cart item from SNEAKERS table only
    const cartWithProducts: CartItem[] = [];

    for (const item of cartItems || []) {
      try {
        const { data: sneakerData, error: sneakerError } = await supabase
          .from('sneakers')
          .select('brand, model, colorway, price, image_url, in_stock')
          .eq('id', item.product_id)
          .single();

        if (sneakerError) {
          console.warn(`Sneaker not found for cart item ${item.id}:`, sneakerError);
          continue;
        }

        if (sneakerData && sneakerData.in_stock) {
          cartWithProducts.push(dbItemToCart(item, {
            name: `${sneakerData.brand} ${sneakerData.model}`,
            brand: sneakerData.brand,
            price: parseFloat(sneakerData.price),
            image: sneakerData.image_url || '/api/placeholder/400/400',
            size: 'US 9', // Default size - no variants needed
            color: sneakerData.colorway || 'Default',
            stock_quantity: 10 // Default stock - no reservation system
          }));
        }
      } catch (itemError) {
        console.warn(`Error processing cart item ${item.id}:`, itemError);
        continue;
      }
    }

    return cartWithProducts;
  } catch (error) {
    console.error('Error loading cart from database:', error);
    return [];
  }
}

// Enhanced stock validation - uses product_variants table with real stock levels
export async function validateStockLevels(items: CartItem[]): Promise<{ valid: boolean; issues: { itemId: string; message: string; availableStock: number }[] }> {
  const issues: { itemId: string; message: string; availableStock: number }[] = [];

  for (const item of items) {
    try {
      // If item has variantId, check variant-specific stock
      if (item.variantId) {
        const { data: variantData, error: variantError } = await supabase
          .from('product_variants')
          .select('stock_quantity, computed_available_stock')
          .eq('id', item.variantId)
          .single();

        if (variantError || !variantData) {
          issues.push({
            itemId: item.id,
            message: 'Product variant not found',
            availableStock: 0
          });
          continue;
        }

        const availableStock = variantData.computed_available_stock || 0;

        if (availableStock <= 0) {
          issues.push({
            itemId: item.id,
            message: 'Product variant out of stock',
            availableStock: 0
          });
          continue;
        }

        if (item.quantity > availableStock) {
          issues.push({
            itemId: item.id,
            message: `Only ${availableStock} available`,
            availableStock
          });
        }
      } else {
        // Fallback to checking aggregate product stock if no variantId
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('available_stock')
          .eq('id', item.productId)
          .single();

        if (productError || !productData) {
          // Final fallback - check sneakers table for basic availability
          const { data: sneakerData } = await supabase
            .from('sneakers')
            .select('in_stock')
            .eq('id', item.productId)
            .single();

          if (!sneakerData || !sneakerData.in_stock) {
            issues.push({
              itemId: item.id,
              message: 'Product no longer available',
              availableStock: 0
            });
            continue;
          }

          // Assume some stock if sneaker is marked as in_stock
          const availableStock = 5; // Conservative estimate
          if (item.quantity > availableStock) {
            issues.push({
              itemId: item.id,
              message: `Only ${availableStock} available (estimated)`,
              availableStock
            });
          }
          continue;
        }

        const availableStock = productData.available_stock || 0;

        if (availableStock <= 0) {
          issues.push({
            itemId: item.id,
            message: 'Product out of stock',
            availableStock: 0
          });
          continue;
        }

        if (item.quantity > availableStock) {
          issues.push({
            itemId: item.id,
            message: `Only ${availableStock} available`,
            availableStock
          });
        }
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

// Create stock reservation using server-side API
export async function createStockReservation(cartItem: CartItem, expirationMinutes: number = 15): Promise<string | null> {
  try {
    // Use the variantId if provided, otherwise we need to find one
    let variantId = cartItem.variantId;

    // First attempt: try with the provided variantId (if any)
    if (variantId) {
      const response = await fetch('/api/cart/reserve-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId,
          quantity: cartItem.quantity,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(`Stock reserved with original variant: ${result.reservationId} for ${cartItem.quantity} units`);
          return result.reservationId;
        }
      } else {
        console.warn(`Original variant ${variantId} not found, trying to find alternative...`);
      }
    }

    // Fallback: Find any variant with sufficient stock for this product
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .select('id, stock_quantity, reserved_quantity')
      .eq('product_id', cartItem.productId)
      .eq('is_active', true)
      .gte('stock_quantity', cartItem.quantity)
      .order('stock_quantity', { ascending: false })
      .limit(1)
      .single();

    if (variantError || !variant) {
      console.error('No variant with sufficient stock found for product:', cartItem.productId);
      return null;
    }

    // Try with the found variant
    const response = await fetch('/api/cart/reserve-stock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variantId: variant.id,
        quantity: cartItem.quantity,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Stock reservation failed with fallback variant:', error);
      return null;
    }

    const result = await response.json();
    if (result.success) {
      console.log(`Stock reserved with fallback variant: ${result.reservationId} for ${cartItem.quantity} units`);
      return result.reservationId;
    }

    return null;
  } catch (error) {
    console.error('Error in createStockReservation:', error);
    return null;
  }
}

// Release stock reservation using server-side API
export async function releaseStockReservation(reservationId: string): Promise<void> {
  try {
    // For now, we'll need to parse the reservation ID to get variant ID and quantity
    // The reservation API expects these as query parameters

    // If the reservationId contains variant info (from our new API), extract it
    // Format: "res_timestamp_random"
    if (reservationId.startsWith('res_')) {
      console.log('Cannot release reservation - missing variant info. Reservation system needs improvement.');
      return;
    }

    // For now, skip the release since we don't have the variant ID and quantity
    // This is a limitation that should be addressed in a future improvement
    console.log(`Skipping stock release for reservation: ${reservationId} (improvement needed)`);
  } catch (error) {
    console.error('Error in releaseStockReservation:', error);
  }
}

// Extend stock reservation expiration
export async function extendStockReservation(reservationId: string, additionalMinutes: number = 15): Promise<boolean> {
  try {
    const newExpiry = new Date();
    newExpiry.setMinutes(newExpiry.getMinutes() + additionalMinutes);

    const { error } = await supabase
      .from('stock_reservations')
      .update({
        expires_at: newExpiry.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .eq('status', 'active');

    if (error) {
      console.error('Error extending stock reservation:', error);
      return false;
    }

    console.log(`Stock reservation extended: ${reservationId} until ${newExpiry.toISOString()}`);
    return true;
  } catch (error) {
    console.error('Error in extendStockReservation:', error);
    return false;
  }
}

// Get active reservations for user/session
export async function getActiveReservations(): Promise<StockReservation[]> {
  const userId = await getCurrentUserId();
  const sessionId = userId ? undefined : generateSessionId();

  try {
    let query = supabase
      .from('stock_reservations')
      .select(`
        id,
        product_id,
        variant_id,
        quantity,
        expires_at,
        status,
        reference_id,
        products (
          name,
          brand
        ),
        product_variants (
          size,
          color
        )
      `)
      .eq('status', 'active')
      .eq('reservation_type', 'cart');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      return [];
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting active reservations:', error);
      return [];
    }

    return (data || []).map(res => ({
      id: res.id,
      cart_item_id: res.reference_id,
      product_id: res.product_id,
      variant_id: res.variant_id,
      quantity_reserved: res.quantity,
      expires_at: res.expires_at,
      status: res.status as 'active' | 'expired' | 'released' | 'converted'
    }));

  } catch (error) {
    console.error('Error in getActiveReservations:', error);
    return [];
  }
}

// Clean up expired reservations
export async function cleanupExpiredReservations(): Promise<void> {
  try {
    // Call the database function to expire old reservations
    const { data, error } = await supabase.rpc('expire_old_reservations');

    if (error) {
      // Network connectivity issue - reservations cleanup will skip silently
      console.warn('Reservation cleanup skipped - network connectivity issue');
    } else {
      console.log(`Expired reservations cleaned up: ${data || 0} reservations expired`);
    }
  } catch (error) {
    // Silent failure for network issues - not critical for app functionality
    console.warn('Reservation cleanup unavailable - using offline mode');
  }
}

// Check if stock is still available for a reservation
export async function validateReservation(reservationId: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const { data: reservation, error } = await supabase
      .from('stock_reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (error || !reservation) {
      return { valid: false, reason: 'Reservation not found' };
    }

    if (reservation.status !== 'active') {
      return { valid: false, reason: `Reservation is ${reservation.status}` };
    }

    if (new Date(reservation.expires_at) < new Date()) {
      return { valid: false, reason: 'Reservation has expired' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating reservation:', error);
    return { valid: false, reason: 'Validation error' };
  }
}

// Convert reservation to confirmed sale
export async function confirmReservation(reservationId: string, orderId?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stock_reservations')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        reference_id: orderId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .eq('status', 'active');

    if (error) {
      console.error('Error confirming reservation:', error);
      return false;
    }

    console.log(`Stock reservation confirmed: ${reservationId}`);
    return true;
  } catch (error) {
    console.error('Error in confirmReservation:', error);
    return false;
  }
}

// Get real-time stock information for a specific product
export async function getProductStockInfo(productId: string): Promise<StockInfo | null> {
  try {
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select(`
        id,
        stock_quantity,
        reserved_quantity,
        computed_available_stock
      `)
      .eq('product_id', productId)
      .eq('is_active', true);

    if (error || !variants || variants.length === 0) {
      console.warn(`No stock info found for product ${productId}:`, error);
      return null;
    }

    // Aggregate stock across all variants for this product
    const totalStock = variants.reduce((sum, v) => sum + v.stock_quantity, 0);
    const totalReserved = variants.reduce((sum, v) => sum + (v.reserved_quantity || 0), 0);
    const totalAvailable = variants.reduce((sum, v) => sum + (v.computed_available_stock || v.stock_quantity - (v.reserved_quantity || 0)), 0);

    return {
      product_id: productId,
      current_stock: totalStock,
      reserved_stock: totalReserved,
      available_stock: totalAvailable
    };
  } catch (error) {
    console.error('Error getting product stock info:', error);
    return null;
  }
}

// Get real-time stock information for a specific variant
export async function getVariantStockInfo(variantId: string): Promise<StockInfo | null> {
  try {
    const { data: variant, error } = await supabase
      .from('product_variants')
      .select(`
        id,
        product_id,
        stock_quantity,
        reserved_quantity,
        computed_available_stock
      `)
      .eq('id', variantId)
      .eq('is_active', true)
      .single();

    if (error || !variant) {
      console.warn(`No stock info found for variant ${variantId}:`, error);
      return null;
    }

    const availableStock = variant.computed_available_stock ||
                          Math.max(0, variant.stock_quantity - (variant.reserved_quantity || 0));

    return {
      product_id: variant.product_id,
      variant_id: variantId,
      current_stock: variant.stock_quantity,
      reserved_stock: variant.reserved_quantity || 0,
      available_stock: availableStock
    };
  } catch (error) {
    console.error('Error getting variant stock info:', error);
    return null;
  }
}

// Real-time stock check for cart items before checkout
export async function realtimeStockCheck(items: CartItem[]): Promise<{ valid: boolean; updatedItems: CartItem[]; issues: any[] }> {
  const issues: any[] = [];
  const updatedItems: CartItem[] = [];

  for (const item of items) {
    try {
      let stockInfo: StockInfo | null = null;

      if (item.variantId) {
        stockInfo = await getVariantStockInfo(item.variantId);
      } else {
        stockInfo = await getProductStockInfo(item.productId);
      }

      if (!stockInfo) {
        issues.push({
          itemId: item.id,
          message: 'Product no longer available',
          availableStock: 0
        });
        continue;
      }

      const availableStock = stockInfo.available_stock;

      // Create updated item with current stock info
      const updatedItem = {
        ...item,
        maxStock: availableStock
      };

      if (availableStock <= 0) {
        issues.push({
          itemId: item.id,
          message: 'Product out of stock',
          availableStock: 0
        });
      } else if (item.quantity > availableStock) {
        // Automatically adjust quantity to available stock
        updatedItem.quantity = availableStock;
        issues.push({
          itemId: item.id,
          message: `Quantity reduced to ${availableStock} (stock limit)`,
          availableStock,
          quantityAdjusted: true
        });
      }

      updatedItems.push(updatedItem);
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
    valid: issues.filter(i => !i.quantityAdjusted).length === 0,
    updatedItems,
    issues
  };
}