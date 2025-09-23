import { supabase } from '@/lib/supabase';
import { CartItem } from '@/contexts/CartContext';

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  shipping_status?: string;
  subtotal: number;
  tax_amount?: number;
  shipping_amount?: number;
  discount_amount?: number;
  total: number;
  currency: string;
  customer_email: string;
  customer_phone?: string;
  billing_full_name: string;
  billing_address: string;
  billing_city: string;
  billing_country: string;
  billing_postal_code: string;
  shipping_full_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_country: string;
  shipping_postal_code: string;
  order_notes?: string;
  tracking_number?: string;
  payment_status?: string;
  payment_method?: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  carrier_name?: string;
  shipping_method?: string;
  email_notifications?: any;
  status_history?: any;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_variant_id?: string;
  product_name: string;
  product_sku?: string;
  variant_name?: string;
  variant_value?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

// Create order with new schema (used by payment processing)
export async function createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order | null> {
  try {
    console.log('📝 [order-utils] createOrder called with status:', orderData.status);
    console.log('📝 [order-utils] Full orderData:', JSON.stringify(orderData, null, 2));

    // Use direct API approach as a workaround for SDK issues
    const { insertOrder } = await import('./supabase-direct');

    console.log('🔐 [order-utils] Using direct API approach');

    // Create order record using the actual database schema
    const { data: order, error: orderError } = await insertOrder({
      order_number: orderData.order_number,
      customer_id: orderData.customer_id,
      status: orderData.status,
      shipping_status: orderData.shipping_status,
      subtotal: orderData.subtotal,
      tax_amount: orderData.tax_amount,
      shipping_amount: orderData.shipping_amount,
      discount_amount: orderData.discount_amount,
      total: orderData.total,
      currency: orderData.currency,
      customer_email: orderData.customer_email,
      customer_phone: orderData.customer_phone,
      billing_full_name: orderData.billing_full_name,
      billing_address: orderData.billing_address,
      billing_city: orderData.billing_city,
      billing_country: orderData.billing_country,
      billing_postal_code: orderData.billing_postal_code,
      shipping_full_name: orderData.shipping_full_name,
      shipping_address: orderData.shipping_address,
      shipping_city: orderData.shipping_city,
      shipping_country: orderData.shipping_country,
      shipping_postal_code: orderData.shipping_postal_code,
      order_notes: orderData.order_notes,
      tracking_number: orderData.tracking_number,
      payment_status: orderData.payment_status,
      payment_method: orderData.payment_method,
      confirmed_at: orderData.confirmed_at,
      shipped_at: orderData.shipped_at,
      delivered_at: orderData.delivered_at,
      cancelled_at: orderData.cancelled_at,
      estimated_delivery_date: orderData.estimated_delivery_date,
      actual_delivery_date: orderData.actual_delivery_date,
      carrier_name: orderData.carrier_name,
      shipping_method: orderData.shipping_method
    });

    if (orderError) {
      console.error('❌ [order-utils] Error creating order:', {
        message: orderError.message,
        code: orderError.code,
        details: orderError.details,
        hint: orderError.hint,
        fullError: orderError
      });
      return null;
    }

    return order;

  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
}

// Legacy function for creating orders from cart items (if still needed)
export async function createOrderFromCart(params: {
  paymentIntentId: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  totalAmount: number;
  currency: string;
  shippingAddress?: any;
}): Promise<Order | null> {
  try {
    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        payment_intent_id: params.paymentIntentId,
        user_id: params.userId,
        session_id: params.sessionId,
        status: 'pending',
        shipping_status: 'pending',
        total_amount: params.totalAmount,
        currency: params.currency,
        shipping_address: params.shippingAddress
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ [order-utils] Error creating order:', {
        message: orderError.message,
        code: orderError.code,
        details: orderError.details,
        hint: orderError.hint,
        fullError: orderError
      });
      return null;
    }

    // Create order items
    const orderItems = params.items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      product_name: item.name,
      product_brand: item.brand,
      product_image: item.image,
      size: item.size,
      color: item.color
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Consider rolling back the order creation
      return null;
    }

    return order;

  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<boolean> {
  try {
    // First, get the current order to check old status and get customer info
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !currentOrder) {
      console.error('Error fetching current order:', fetchError);
      return false;
    }

    const oldStatus = currentOrder.status;

    // Don't send email if status hasn't actually changed
    if (oldStatus === status) {
      return true;
    }

    // Update the order status
    const { error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      return false;
    }

    // Send email notification asynchronously (don't block on email failure)
    try {
      await sendOrderStatusNotification(currentOrder, oldStatus, status);
    } catch (emailError) {
      console.error('Failed to send order status email notification:', emailError);
      // Don't fail the status update if email fails
    }

    return true;

  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
}

// Get order by payment intent ID
export async function getOrderByPaymentIntent(
  paymentIntentId: string
): Promise<Order | null> {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return order;

  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

// Get order with items
export async function getOrderWithItems(orderId: string): Promise<{
  order: Order;
  items: OrderItem[];
} | null> {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return null;
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return null;
    }

    return { order, items };

  } catch (error) {
    console.error('Error fetching order with items:', error);
    return null;
  }
}

// Get user orders
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    // First try to get orders by customer_id
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user orders by customer_id:', error);
      return [];
    }

    // If we found orders, return them
    if (orders && orders.length > 0) {
      console.log(`Found ${orders.length} orders for customer_id: ${userId}`);
      return orders;
    }

    // Fallback: try to get user's email and fetch orders by email
    console.log('No orders found by customer_id, trying email fallback...');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.warn('Could not fetch user email for fallback order search:', userError);
      return [];
    }

    const { data: emailOrders, error: emailError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', userData.email)
      .order('created_at', { ascending: false });

    if (emailError) {
      console.error('Error fetching user orders by email:', emailError);
      return [];
    }

    if (emailOrders && emailOrders.length > 0) {
      console.log(`Found ${emailOrders.length} orders for email: ${userData.email}`);
    }

    return emailOrders || [];

  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}

// Cancel order
export async function cancelOrder(orderId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error canceling order:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Error canceling order:', error);
    return false;
  }
}

// Mark order as completed
export async function completeOrder(paymentIntentId: string): Promise<boolean> {
  try {
    // Update order status to completed
    const updated = await updateOrderStatus(paymentIntentId, 'completed');

    if (!updated) return false;

    // Get the order to update stock
    const order = await getOrderByPaymentIntent(paymentIntentId);
    if (!order) return false;

    // Get order items to update stock
    const orderWithItems = await getOrderWithItems(order.id);
    if (!orderWithItems) return false;

    // Update stock levels by reducing inventory
    for (const item of orderWithItems.items) {
      if (item.product_id) {
        await updateProductStock(item.product_id, item.product_variant_id, -item.quantity);
      }
    }

    return true;

  } catch (error) {
    console.error('Error completing order:', error);
    return false;
  }
}

// Update product stock after successful payment
export async function updateProductStock(
  productId: string,
  variantId: string | undefined,
  quantityChange: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔄 Updating stock: Product ${productId}, Variant ${variantId}, Change ${quantityChange}`);

    // Update variant stock if variant exists
    if (variantId) {
      const { error } = await supabase.rpc('update_variant_stock', {
        variant_id: variantId,
        quantity_change: quantityChange
      });

      if (error) {
        console.error('❌ Database error updating variant stock:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully updated variant ${variantId} stock by ${quantityChange}`);
    } else {
      console.warn(`⚠️ No variant ID provided for product ${productId} - stock update skipped`);
      return { success: false, error: 'No variant ID provided' };
    }

    // Check if stock movement was logged successfully
    try {
      const { data: recentMovement, error: movementError } = await supabase
        .from('stock_movements')
        .select('id, quantity, reason, created_at')
        .eq('product_id', productId)
        .eq('variant_id', variantId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (movementError) {
        console.warn('⚠️ Could not verify stock movement logging:', movementError);
      } else if (recentMovement && recentMovement.length > 0) {
        console.log(`📝 Stock movement logged: ${recentMovement[0].reason} - ${recentMovement[0].quantity} units`);
      }
    } catch (auditError) {
      console.warn('⚠️ Could not check stock movement audit trail:', auditError);
    }

    return { success: true };

  } catch (error) {
    console.error('💥 Unexpected error updating product stock:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Generate order confirmation data for emails
export async function getOrderConfirmationData(orderId: string): Promise<{
  order: Order;
  items: OrderItem[];
  total: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
} | null> {
  try {
    const orderData = await getOrderWithItems(orderId);
    if (!orderData) return null;

    const { order, items } = orderData;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const shipping = subtotal >= 50 ? 0 : 9.99;
    const total = Number(order.total);
    const tax = total - subtotal - shipping;

    return {
      order,
      items,
      total: {
        subtotal,
        shipping,
        tax,
        total
      }
    };

  } catch (error) {
    console.error('Error getting order confirmation data:', error);
    return null;
  }
}

// Update shipping status
export async function updateShippingStatus(
  orderId: string,
  shippingStatus: Order['shipping_status'],
  trackingNumber?: string,
  estimatedDelivery?: string
): Promise<boolean> {
  try {
    // First, get the current order to check old status and get customer info
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !currentOrder) {
      console.error('Error fetching current order:', fetchError);
      return false;
    }

    const oldShippingStatus = currentOrder.shipping_status;

    const updateData: any = {
      shipping_status: shippingStatus,
      updated_at: new Date().toISOString()
    };

    if (trackingNumber) updateData.tracking_number = trackingNumber;
    if (estimatedDelivery) updateData.estimated_delivery = estimatedDelivery;

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error('Error updating shipping status:', error);
      return false;
    }

    // Send email notification for certain shipping status changes
    if (oldShippingStatus !== shippingStatus) {
      try {
        await sendShippingStatusNotification(
          { ...currentOrder, ...updateData },
          oldShippingStatus || 'pending',
          shippingStatus || 'pending',
          trackingNumber
        );
      } catch (emailError) {
        console.error('Failed to send shipping status email notification:', emailError);
        // Don't fail the status update if email fails
      }
    }

    return true;

  } catch (error) {
    console.error('Error updating shipping status:', error);
    return false;
  }
}

// Get orders with shipping status filter
export async function getOrdersByShippingStatus(
  shippingStatus: Order['shipping_status']
): Promise<Order[]> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('shipping_status', shippingStatus)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders by shipping status:', error);
      return [];
    }

    return orders || [];

  } catch (error) {
    console.error('Error fetching orders by shipping status:', error);
    return [];
  }
}

// Get all orders for admin dashboard
export async function getAllOrders(
  limit: number = 50,
  offset: number = 0,
  statusFilter?: Order['status'],
  shippingStatusFilter?: Order['shipping_status']
): Promise<Order[]> {
  try {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    if (shippingStatusFilter) {
      query = query.eq('shipping_status', shippingStatusFilter);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching all orders:', error);
      return [];
    }

    return orders || [];

  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
}

// Search orders by order ID or customer email
export async function searchOrders(searchTerm: string): Promise<Order[]> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .or(`id.ilike.%${searchTerm}%,payment_intent_id.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error searching orders:', error);
      return [];
    }

    return orders || [];

  } catch (error) {
    console.error('Error searching orders:', error);
    return [];
  }
}

// Check if order exists and belongs to user
export async function verifyOrderAccess(
  orderId: string,
  userId?: string,
  sessionId?: string
): Promise<boolean> {
  try {
    let query = supabase.from('orders').select('id').eq('id', orderId);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      return false; // No identification provided
    }

    const { data, error } = await query.single();

    if (error) {
      return false;
    }

    return !!data;

  } catch (error) {
    console.error('Error verifying order access:', error);
    return false;
  }
}

// Helper function to send order status notification
async function sendOrderStatusNotification(
  order: any,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  try {
    // Get order confirmation data (includes items and totals)
    const orderConfirmationData = await getOrderConfirmationData(order.id);
    if (!orderConfirmationData) {
      console.warn('Could not get order confirmation data for email notification');
      return;
    }

    // Get customer email
    let customerEmail: string | null = null;

    // Try to get email from customer_id if present
    if (order.customer_id) {
      try {
        const { data: customer } = await supabase
          .from('users')
          .select('email')
          .eq('id', order.customer_id)
          .single();

        customerEmail = customer?.email || null;
      } catch (error) {
        console.warn('Could not fetch customer email from users table:', error);
      }
    }

    // If no email from customer_id, try to get from billing_address
    if (!customerEmail && order.billing_address?.email) {
      customerEmail = order.billing_address.email;
    }

    // If still no email, try shipping_address
    if (!customerEmail && order.shipping_address?.email) {
      customerEmail = order.shipping_address.email;
    }

    if (!customerEmail) {
      console.warn('No customer email found for order status notification:', order.id);
      return;
    }

    // Import email function
    const { sendOrderStatusUpdateEmail } = await import('./email');

    // Prepare email data
    const emailData = {
      ...orderConfirmationData,
      customerEmail
    };

    // Send the status update email
    const emailSent = await sendOrderStatusUpdateEmail(emailData, oldStatus, newStatus);

    if (emailSent) {
      console.log(`Order status update email sent successfully for order ${order.id}`);
    } else {
      console.warn(`Failed to send order status update email for order ${order.id}`);
    }

  } catch (error) {
    console.error('Error sending order status notification:', error);
    throw error;
  }
}

// Helper function to send shipping status notification
async function sendShippingStatusNotification(
  order: any,
  oldShippingStatus: string,
  newShippingStatus: string,
  trackingNumber?: string
): Promise<void> {
  try {
    // Get order confirmation data (includes items and totals)
    const orderConfirmationData = await getOrderConfirmationData(order.id);
    if (!orderConfirmationData) {
      console.warn('Could not get order confirmation data for shipping email notification');
      return;
    }

    // Get customer email (same logic as order status notification)
    let customerEmail: string | null = null;

    if (order.customer_id) {
      try {
        const { data: customer } = await supabase
          .from('users')
          .select('email')
          .eq('id', order.customer_id)
          .single();

        customerEmail = customer?.email || null;
      } catch (error) {
        console.warn('Could not fetch customer email from users table:', error);
      }
    }

    if (!customerEmail && order.billing_address?.email) {
      customerEmail = order.billing_address.email;
    }

    if (!customerEmail && order.shipping_address?.email) {
      customerEmail = order.shipping_address.email;
    }

    if (!customerEmail) {
      console.warn('No customer email found for shipping status notification:', order.id);
      return;
    }

    // Import appropriate email function based on shipping status
    const emailModule = await import('./email');

    // Prepare email data
    const emailData = {
      ...orderConfirmationData,
      customerEmail
    };

    let emailSent = false;

    // Send different emails based on shipping status
    if (newShippingStatus === 'shipped') {
      emailSent = await emailModule.sendShippingUpdateEmail(emailData, trackingNumber);
    } else if (newShippingStatus === 'delivered') {
      emailSent = await emailModule.sendDeliveryConfirmationEmail(emailData);
    } else {
      // For other shipping status changes, send a general order status update
      emailSent = await emailModule.sendOrderStatusUpdateEmail(emailData, oldShippingStatus, newShippingStatus);
    }

    if (emailSent) {
      console.log(`Shipping status update email sent successfully for order ${order.id}`);
    } else {
      console.warn(`Failed to send shipping status update email for order ${order.id}`);
    }

  } catch (error) {
    console.error('Error sending shipping status notification:', error);
    throw error;
  }
}

// Direct stock update as fallback when RPC function is not available
export async function updateStockDirectly(
  productId: string,
  variantId: string,
  quantityChange: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current stock
    const { data: currentVariant, error: selectError } = await supabase
      .from('product_variants')
      .select('stock_quantity, product_id')
      .eq('id', variantId)
      .single();

    if (selectError || !currentVariant) {
      return { success: false, error: 'Variant not found' };
    }

    const currentStock = currentVariant.stock_quantity;
    const newStock = currentStock + quantityChange;

    // Prevent negative stock
    if (newStock < 0) {
      return {
        success: false,
        error: `Insufficient stock: current ${currentStock}, requested change ${quantityChange}`
      };
    }

    // Update the stock
    const { error: updateError } = await supabase
      .from('product_variants')
      .update({
        stock_quantity: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', variantId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log stock movement if table exists
    try {
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          variant_id: variantId,
          movement_type: quantityChange > 0 ? 'adjustment' : 'sale',
          quantity: quantityChange,
          quantity_before: currentStock,
          quantity_after: newStock,
          reason: quantityChange > 0 ? 'stock_increase' : 'order_fulfillment',
          reference_type: 'system',
          status: 'completed',
          notes: 'Direct stock update via order processing'
        });

      if (movementError) {
        console.warn('⚠️ Could not log stock movement:', movementError.message);
        // Don't fail the stock update for logging issues
      } else {
        console.log('📝 Stock movement logged successfully');
      }
    } catch (loggingError) {
      console.warn('⚠️ Stock movement logging failed:', loggingError);
    }

    console.log(`✅ Successfully updated variant ${variantId} stock: ${currentStock} → ${newStock}`);
    return { success: true };

  } catch (error) {
    console.error('💥 Direct stock update failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
