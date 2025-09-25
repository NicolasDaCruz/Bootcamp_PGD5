import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('order');

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Tracking order:', orderNumber);

    // Import Supabase admin client (fallback to anon for debugging)
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch order by order number
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    // Debug the query more thoroughly
    if (orderError) {
      console.log('❌ Database error:', JSON.stringify(orderError, null, 2));
      return NextResponse.json(
        { error: 'Database query failed', details: orderError.message },
        { status: 500 }
      );
    }

    if (!order) {
      console.log('❌ No order returned for:', orderNumber);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('✅ Order found:', order.id);

    // Fetch order items with product details
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        products:product_id (
          name,
          brand,
          original_image_urls
        )
      `)
      .eq('order_id', order.id);

    if (itemsError) {
      console.error('❌ Error fetching order items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch order items' },
        { status: 500 }
      );
    }

    // Transform order items to include product info
    const transformedItems = orderItems.map(item => ({
      id: item.id,
      product_name: item.product_name || item.products?.name || 'Unknown Product',
      brand: item.products?.brand || 'Unknown Brand',
      variant_name: item.variant_name,
      variant_value: item.variant_value,
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.total_price),
      original_image_urls: item.products?.original_image_urls || []
    }));

    // Generate tracking events (you can expand this to include actual tracking data)
    const tracking = generateTrackingEvents(order);

    console.log('📦 Order details retrieved:', {
      orderNumber: order.order_number,
      status: order.status,
      itemCount: transformedItems.length
    });

    return NextResponse.json({
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        total: parseFloat(order.total),
        currency: order.currency,
        customer_email: order.customer_email,
        shipping_full_name: order.shipping_full_name,
        shipping_address: order.shipping_address,
        shipping_city: order.shipping_city,
        shipping_country: order.shipping_country,
        shipping_postal_code: order.shipping_postal_code,
        shipping_status: order.shipping_status,
        tracking_number: order.tracking_number,
        estimated_delivery_date: order.estimated_delivery_date,
        payment_status: order.payment_status
      },
      items: transformedItems,
      tracking: tracking
    });

  } catch (error) {
    console.error('💥 Error tracking order:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateTrackingEvents(order: any) {
  const events = [];

  // Order confirmed
  events.push({
    id: '1',
    status: 'confirmed',
    description: 'Order confirmed and payment processed',
    timestamp: order.created_at,
    location: 'Online Store'
  });

  // Add events based on order status
  const now = new Date();
  const orderDate = new Date(order.created_at);

  if (['processing', 'shipped', 'delivered'].includes(order.status)) {
    events.push({
      id: '2',
      status: 'processing',
      description: 'Order is being prepared for shipment',
      timestamp: new Date(orderDate.getTime() + 3600000).toISOString(), // 1 hour after order
      location: 'Fulfillment Center'
    });
  }

  if (['shipped', 'delivered'].includes(order.status)) {
    events.push({
      id: '3',
      status: 'shipped',
      description: 'Package shipped and in transit',
      timestamp: new Date(orderDate.getTime() + 86400000).toISOString(), // 1 day after order
      location: 'Distribution Center'
    });

    // Add in-transit update
    events.push({
      id: '4',
      status: 'in_transit',
      description: 'Package is on the way to your address',
      timestamp: new Date(orderDate.getTime() + 172800000).toISOString(), // 2 days after order
      location: 'Local Facility'
    });
  }

  if (order.status === 'delivered') {
    events.push({
      id: '5',
      status: 'delivered',
      description: 'Package delivered successfully',
      timestamp: order.updated_at,
      location: order.shipping_address
    });
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}