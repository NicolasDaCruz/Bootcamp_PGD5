import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('location_id');
    const lowStockOnly = searchParams.get('low_stock') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Base query for live stock data with product information
    let query = supabase
      .from('stock_levels')
      .select(`
        id,
        product_id,
        variant_id,
        location_id,
        location_name,
        quantity_on_hand,
        quantity_reserved,
        quantity_available,
        quantity_incoming,
        reorder_point,
        reorder_quantity,
        maximum_stock,
        total_value,
        last_restock_date,
        last_sale_date,
        updated_at,
        products!inner(
          id,
          name,
          brand,
          model,
          sku,
          price,
          original_image_urls,
          category_id,
          is_active
        )
      `)
      .eq('is_active', true)
      .eq('is_tracked', true)
      .order('updated_at', { ascending: false })
      .limit(limit);

    // Filter by location if specified
    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    // Filter for low stock items only
    if (lowStockOnly) {
      query = query.lte('quantity_available', 'reorder_point');
    }

    const { data: stockData, error } = await query;

    if (error) {
      console.error('Error fetching live stock data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stock data' },
        { status: 500 }
      );
    }

    // Calculate real-time metrics
    const totalProducts = stockData?.length || 0;
    const lowStockItems = stockData?.filter(item =>
      item.quantity_available <= (item.reorder_point || 10)
    ).length || 0;
    const outOfStockItems = stockData?.filter(item =>
      item.quantity_available <= 0
    ).length || 0;
    const totalValue = stockData?.reduce((sum, item) =>
      sum + (item.total_value || 0), 0
    ) || 0;
    // Get active alerts count separately
    const { count: activeAlerts } = await supabase
      .from('stock_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // For now, get recent stock movements and reservations separately to avoid complex joins
    const { data: recentMovements } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: pendingReservations } = await supabase
      .from('stock_reservations')
      .select('*')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    const response = {
      metrics: {
        totalProducts,
        lowStockItems,
        outOfStockItems,
        totalValue,
        activeAlerts: activeAlerts || 0,
        lastUpdated: new Date().toISOString()
      },
      stockLevels: stockData,
      recentMovements: recentMovements || [],
      pendingReservations: pendingReservations || [],
      locationStats: {
        // Group by location for location-specific metrics
        byLocation: stockData?.reduce((acc: any, item) => {
          const location = item.location_name || 'main';
          if (!acc[location]) {
            acc[location] = {
              totalItems: 0,
              totalValue: 0,
              lowStockItems: 0,
              outOfStockItems: 0
            };
          }
          acc[location].totalItems += 1;
          acc[location].totalValue += item.total_value || 0;
          if (item.quantity_available <= (item.reorder_point || 10)) {
            acc[location].lowStockItems += 1;
          }
          if (item.quantity_available <= 0) {
            acc[location].outOfStockItems += 1;
          }
          return acc;
        }, {})
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in live dashboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Real-time stock update endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stock_level_id, quantity_change, movement_type, reason, performed_by } = body;

    if (!stock_level_id || !quantity_change || !movement_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current stock level
    const { data: currentStock, error: stockError } = await supabase
      .from('stock_levels')
      .select('*')
      .eq('id', stock_level_id)
      .single();

    if (stockError || !currentStock) {
      return NextResponse.json(
        { error: 'Stock level not found' },
        { status: 404 }
      );
    }

    const newQuantity = currentStock.quantity_on_hand + quantity_change;
    const newAvailable = Math.max(0, newQuantity - currentStock.quantity_reserved);

    // Start transaction
    const { data: updatedStock, error: updateError } = await supabase
      .from('stock_levels')
      .update({
        quantity_on_hand: newQuantity,
        quantity_available: newAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('id', stock_level_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update stock level' },
        { status: 500 }
      );
    }

    // Record the movement
    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        product_id: currentStock.product_id,
        variant_id: currentStock.variant_id,
        stock_level_id: stock_level_id,
        movement_type,
        quantity: Math.abs(quantity_change),
        quantity_before: currentStock.quantity_on_hand,
        quantity_after: newQuantity,
        performed_by,
        reason,
        movement_date: new Date().toISOString()
      });

    if (movementError) {
      console.error('Failed to record stock movement:', movementError);
    }

    // Check if we need to create alerts
    if (newAvailable <= (currentStock.reorder_point || 10)) {
      await supabase
        .from('stock_alerts')
        .upsert({
          product_id: currentStock.product_id,
          variant_id: currentStock.variant_id,
          stock_level_id: stock_level_id,
          alert_type: newAvailable <= 0 ? 'out_of_stock' : 'low_stock',
          threshold_value: currentStock.reorder_point || 10,
          current_value: newAvailable,
          status: 'active',
          priority: newAvailable <= 0 ? 'high' : 'medium'
        }, {
          onConflict: 'product_id,variant_id,alert_type',
          ignoreDuplicates: false
        });
    }

    return NextResponse.json({
      success: true,
      updatedStock,
      message: 'Stock level updated successfully'
    });

  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}