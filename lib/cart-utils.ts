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
      console.error('Error loading cart from database:', error);
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

// Create stock reservation
export async function createStockReservation(cartItem: CartItem, expirationMinutes: number = 15): Promise<string | null> {
  const userId = await getCurrentUserId();
  const sessionId = userId ? undefined : generateSessionId();

  try {
    // First, get the product variant and check stock
    let variantId: string | null = cartItem.variantId;
    let availableStock: number = 0;

    if (variantId) {
      // Find specific variant and check stock
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('id, stock_quantity, reserved_quantity, computed_available_stock')
        .eq('id', variantId)
        .eq('is_active', true)
        .single();

      if (variantError || !variant) {
        console.error('No variant found:', variantError);
        return null;
      }

      // Calculate available stock (stock_quantity - reserved_quantity)
      availableStock = variant.computed_available_stock ||
                      (variant.stock_quantity - (variant.reserved_quantity || 0));

      // Check if we have enough available stock
      if (availableStock < cartItem.quantity) {
        console.warn(`Insufficient stock: need ${cartItem.quantity}, available ${availableStock}`);
        return null;
      }
    } else {
      // Find any variant with enough stock for this product
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('id, stock_quantity, reserved_quantity, computed_available_stock')
        .eq('product_id', cartItem.productId)
        .eq('is_active', true)
        .gte('stock_quantity', cartItem.quantity)
        .order('stock_quantity', { ascending: false })
        .limit(1)
        .single();

      if (variantError || !variant) {
        console.error('No variant with sufficient stock found:', variantError);
        return null;
      }

      variantId = variant.id;
      availableStock = variant.computed_available_stock ||
                      (variant.stock_quantity - (variant.reserved_quantity || 0));
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

    // Instead of using complex reservation system, we'll update the reserved quantity directly
    // This is simpler and avoids the missing table/function issues

    // First, get the current reserved quantity
    const { data: currentVariant, error: fetchError } = await supabase
      .from('product_variants')
      .select('reserved_quantity')
      .eq('id', variantId)
      .single();

    if (fetchError) {
      console.error('Error fetching current variant:', fetchError);
      return null;
    }

    const currentReserved = currentVariant?.reserved_quantity || 0;
    const newReservedQuantity = currentReserved + cartItem.quantity;

    // Update the reserved quantity on the variant
    const { data: updatedVariant, error: updateError } = await supabase
      .from('product_variants')
      .update({
        reserved_quantity: newReservedQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', variantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating reserved stock:', updateError);
      return null;
    }

    // Try to use the reserve_stock function if it exists
    try {
      const { data: reservationId, error: rpcError } = await supabase
        .rpc('reserve_stock', {
          p_product_id: cartItem.productId,
          p_quantity: cartItem.quantity,
          p_reservation_type: 'cart',  // Changed from p_reference_type
          p_reference_id: null,
          p_user_id: userId || null,
          p_variant_id: variantId,
          p_expires_minutes: expirationMinutes
        });

      if (!rpcError && reservationId) {
        console.log(`Stock reservation created via RPC: ${reservationId} for ${cartItem.quantity} units`);
        return reservationId;
      }

      // If RPC fails, try direct insertion
      if (rpcError) {
        console.warn('RPC reserve_stock failed, trying direct insertion:', rpcError);
      }
    } catch (rpcErr) {
      console.warn('RPC not available, using direct insertion');
    }

    // Fallback: Create a simple reservation record directly
    try {
      const { data: reservation, error: reservationError } = await supabase
        .from('stock_reservations')
        .insert({
          product_id: cartItem.productId,
          variant_id: variantId,
          quantity: cartItem.quantity,
          user_id: userId || null,
          session_id: sessionId || null,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          reservation_type: 'cart',  // Changed from reference_type
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!reservationError && reservation) {
        console.log(`Stock reservation created directly: ${reservation.id} for ${cartItem.quantity} units`);
        return reservation.id;
      }

      if (reservationError) {
        console.warn('Could not create reservation record:', reservationError);
      }
    } catch (err) {
      console.warn('Stock reservations table may not exist');
    }

    // Ultimate fallback: Just return the variant ID as reservation ID
    // The stock is already reserved by updating reserved_quantity above
    console.log(`Stock reserved (using variant ID): ${variantId} for ${cartItem.quantity} units`);
    return variantId || 'temp-' + Date.now();

  } catch (error) {
    console.error('Error in createStockReservation:', error);
    return null;
  }
}

// Release stock reservation
export async function releaseStockReservation(reservationId: string): Promise<void> {
  try {
    // First try to find and cancel the reservation
    const { data: reservation, error: fetchError } = await supabase
      .from('stock_reservations')
      .select('variant_id, quantity')
      .eq('id', reservationId)
      .eq('status', 'active')
      .single();

    if (reservation) {
      // Update the reservation status
      const { error: updateError } = await supabase
        .from('stock_reservations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId);

      if (updateError) {
        console.error('Error updating reservation status:', updateError);
      }

      // Release the reserved quantity from the variant
      if (reservation.variant_id && reservation.quantity) {
        const { data: currentVariant } = await supabase
          .from('product_variants')
          .select('reserved_quantity')
          .eq('id', reservation.variant_id)
          .single();

        if (currentVariant) {
          const newReservedQuantity = Math.max(0, (currentVariant.reserved_quantity || 0) - reservation.quantity);

          await supabase
            .from('product_variants')
            .update({
              reserved_quantity: newReservedQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', reservation.variant_id);
        }
      }

      console.log(`Stock reservation released: ${reservationId}`);
    } else if (reservationId.length === 36) {
      // If reservationId looks like a variant ID (UUID format), try to release directly
      // This handles the fallback case where we used variant ID as reservation ID
      console.log('Attempting to release stock using variant ID fallback');

      // Note: We can't easily determine how much to release without the original quantity
      // This is a limitation of the fallback approach
    }
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
      console.error('Error cleaning up expired reservations:', error);
    } else {
      console.log(`Expired reservations cleaned up: ${data || 0} reservations expired`);
    }
  } catch (error) {
    console.error('Error in cleanupExpiredReservations:', error);
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