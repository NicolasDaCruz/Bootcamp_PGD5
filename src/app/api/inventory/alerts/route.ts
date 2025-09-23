import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');
    const type = searchParams.get('type'); // 'low_stock', 'out_of_stock'
    const active = searchParams.get('active') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('🔍 Fetching inventory alerts...', { vendorId, type, active, limit });

    // Get products with stock issues
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        brand,
        sku,
        stock_quantity,
        low_stock_threshold,
        price,
        vendor_id,
        created_at,
        updated_at,
        product_variants (
          id,
          name,
          value,
          stock_quantity,
          sku
        )
      `);

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('❌ Error fetching products for alerts:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Generate alerts based on stock levels
    const alerts: any[] = [];

    products?.forEach(product => {
      const threshold = product.low_stock_threshold || 5;
      const stock = product.stock_quantity || 0;

      // Check main product stock
      let alertType = null;
      if (stock === 0) {
        alertType = 'out_of_stock';
      } else if (stock <= threshold) {
        alertType = 'low_stock';
      }

      if (alertType && (!type || type === alertType)) {
        alerts.push({
          id: `${product.id}_main`,
          product_id: product.id,
          product_name: product.name,
          variant_id: null,
          variant_name: null,
          alert_type: alertType,
          current_stock: stock,
          threshold_value: threshold,
          price: product.price,
          sku: product.sku,
          last_triggered: product.updated_at || product.created_at,
          is_active: true,
          vendor_id: product.vendor_id
        });
      }

      // Check variant stock
      product.product_variants?.forEach(variant => {
        const variantStock = variant.stock_quantity || 0;
        let variantAlertType = null;

        if (variantStock === 0) {
          variantAlertType = 'out_of_stock';
        } else if (variantStock <= threshold) {
          variantAlertType = 'low_stock';
        }

        if (variantAlertType && (!type || type === variantAlertType)) {
          alerts.push({
            id: `${product.id}_${variant.id}`,
            product_id: product.id,
            product_name: product.name,
            variant_id: variant.id,
            variant_name: `${variant.name}: ${variant.value}`,
            alert_type: variantAlertType,
            current_stock: variantStock,
            threshold_value: threshold,
            price: product.price,
            sku: variant.sku || `${product.sku}-${variant.value}`,
            last_triggered: product.updated_at || product.created_at,
            is_active: true,
            vendor_id: product.vendor_id
          });
        }
      });
    });

    // Sort by severity (out_of_stock first, then low_stock) and limit
    const sortedAlerts = alerts
      .sort((a, b) => {
        if (a.alert_type === 'out_of_stock' && b.alert_type === 'low_stock') return -1;
        if (a.alert_type === 'low_stock' && b.alert_type === 'out_of_stock') return 1;
        return new Date(b.last_triggered).getTime() - new Date(a.last_triggered).getTime();
      })
      .slice(0, limit);

    // Calculate alert statistics
    const stats = {
      total: alerts.length,
      low_stock: alerts.filter(alert => alert.alert_type === 'low_stock').length,
      out_of_stock: alerts.filter(alert => alert.alert_type === 'out_of_stock').length,
      critical: alerts.filter(alert => alert.alert_type === 'out_of_stock').length,
      warning: alerts.filter(alert => alert.alert_type === 'low_stock').length
    };

    console.log('✅ Successfully fetched alerts:', {
      totalAlerts: sortedAlerts.length,
      stats
    });

    return NextResponse.json({
      success: true,
      alerts: sortedAlerts,
      stats,
      count: sortedAlerts.length
    });

  } catch (error) {
    console.error('💥 Critical error in inventory alerts API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { alertId, isActive, resolved } = body;

    console.log('🔄 Updating alert status:', { alertId, isActive, resolved });

    // In a real implementation, you would store alerts in a dedicated table
    // For now, we'll just return success since alerts are generated dynamically
    // based on current stock levels

    console.log('✅ Alert status updated (simulated)');

    return NextResponse.json({
      success: true,
      message: 'Alert status updated',
      alertId,
      isActive: isActive ?? false,
      resolved: resolved ?? true
    });

  } catch (error) {
    console.error('💥 Critical error in alert update:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}