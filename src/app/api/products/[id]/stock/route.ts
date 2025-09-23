import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Get stock information for a specific product and its variants (sizes)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { id: productId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const sizeOnly = searchParams.get('size_only') !== 'false'; // Default to true for size variants only

    console.log('🔍 Fetching stock for product:', productId);

    // Get product with its variants
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        brand,
        price,
        low_stock_threshold,
        vendor_id,
        is_active,
        product_variants!inner (
          id,
          name,
          value,
          size,
          eu_size,
          us_size,
          uk_size,
          stock_quantity,
          reserved_quantity,
          computed_available_stock,
          sku,
          price_adjustment,
          is_active,
          variant_type
        )
      `)
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ Error fetching product stock:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    // Calculate stock status helper
    const getStockStatus = (availableStock: number, threshold: number) => {
      if (availableStock === 0) return 'out_of_stock';
      if (availableStock <= threshold) return 'low_stock';
      return 'in_stock';
    };

    // Process variants (filter for sizes if requested)
    let variants = product.product_variants || [];
    if (sizeOnly) {
      variants = variants.filter(v => v.variant_type === 'size' || v.eu_size || v.us_size || v.size);
    }

    const stockVariants = variants
      .filter(variant => variant.is_active)
      .map(variant => {
        const availableStock = variant.computed_available_stock ??
                              Math.max(0, variant.stock_quantity - (variant.reserved_quantity || 0));
        const stockStatus = getStockStatus(availableStock, product.low_stock_threshold || 5);

        // Determine size display format
        const sizeDisplay = variant.eu_size ? `EU ${variant.eu_size}` :
                           variant.us_size ? `US ${variant.us_size}` :
                           variant.size || variant.value;

        return {
          id: variant.id,
          name: variant.name,
          value: variant.value,
          size: variant.size,
          eu_size: variant.eu_size,
          us_size: variant.us_size,
          uk_size: variant.uk_size,
          size_display: sizeDisplay,
          sku: variant.sku,
          stock_quantity: variant.stock_quantity,
          reserved_quantity: variant.reserved_quantity || 0,
          available_stock: availableStock,
          price: product.price + (variant.price_adjustment || 0),
          price_adjustment: variant.price_adjustment || 0,
          status: stockStatus,
          is_active: variant.is_active,
          low_stock_threshold: product.low_stock_threshold || 5
        };
      })
      .sort((a, b) => {
        // Sort by EU size if available, otherwise by name/value
        if (a.eu_size && b.eu_size) {
          return Number(a.eu_size) - Number(b.eu_size);
        }
        if (a.us_size && b.us_size) {
          return Number(a.us_size) - Number(b.us_size);
        }
        return (a.value || a.name).localeCompare(b.value || b.name);
      });

    // Calculate summary statistics
    const totalStock = stockVariants.reduce((sum, v) => sum + v.stock_quantity, 0);
    const totalAvailable = stockVariants.reduce((sum, v) => sum + v.available_stock, 0);
    const totalReserved = stockVariants.reduce((sum, v) => sum + v.reserved_quantity, 0);

    const inStockCount = stockVariants.filter(v => v.status === 'in_stock').length;
    const lowStockCount = stockVariants.filter(v => v.status === 'low_stock').length;
    const outOfStockCount = stockVariants.filter(v => v.status === 'out_of_stock').length;

    const stockSummary = {
      product_id: product.id,
      product_name: product.name,
      brand: product.brand,
      base_price: product.price,
      low_stock_threshold: product.low_stock_threshold || 5,
      vendor_id: product.vendor_id,
      total_variants: stockVariants.length,
      total_stock: totalStock,
      total_available: totalAvailable,
      total_reserved: totalReserved,
      in_stock_variants: inStockCount,
      low_stock_variants: lowStockCount,
      out_of_stock_variants: outOfStockCount,
      overall_status: totalAvailable > 0 ?
        (totalAvailable <= (product.low_stock_threshold || 5) ? 'low_stock' : 'in_stock') :
        'out_of_stock',
      variants: stockVariants
    };

    console.log('✅ Successfully fetched product stock:', {
      productId,
      variantCount: stockVariants.length,
      totalAvailable,
      overallStatus: stockSummary.overall_status
    });

    return NextResponse.json({
      success: true,
      data: stockSummary
    });

  } catch (error) {
    console.error('💥 Critical error in product stock API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Update stock for a specific variant
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { id: productId } = resolvedParams;
    const body = await request.json();
    const { variant_id, new_stock, reason = 'manual_adjustment' } = body;

    if (!variant_id || new_stock === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: variant_id and new_stock'
      }, { status: 400 });
    }

    console.log('🔄 Updating variant stock:', { productId, variant_id, new_stock, reason });

    // Verify the variant belongs to this product
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .select('id, product_id, stock_quantity')
      .eq('id', variant_id)
      .eq('product_id', productId)
      .single();

    if (variantError || !variant) {
      return NextResponse.json({
        success: false,
        error: 'Variant not found for this product'
      }, { status: 404 });
    }

    const previousStock = variant.stock_quantity;
    const quantityChange = new_stock - previousStock;

    // Use the RPC function to update stock
    const { error: updateError } = await supabase.rpc('update_variant_stock', {
      variant_id,
      quantity_change: quantityChange
    });

    if (updateError) {
      console.error('❌ Error updating variant stock:', updateError);
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 });
    }

    // Get updated stock information
    const { data: updatedVariant, error: fetchError } = await supabase
      .from('product_variants')
      .select(`
        id,
        stock_quantity,
        reserved_quantity,
        computed_available_stock,
        products (
          name,
          brand,
          low_stock_threshold
        )
      `)
      .eq('id', variant_id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching updated variant:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch updated stock information'
      }, { status: 500 });
    }

    const availableStock = updatedVariant.computed_available_stock ??
                          (updatedVariant.stock_quantity - (updatedVariant.reserved_quantity || 0));

    const getStockStatus = (stock: number, threshold: number) => {
      if (stock === 0) return 'out_of_stock';
      if (stock <= threshold) return 'low_stock';
      return 'in_stock';
    };

    const newStatus = getStockStatus(availableStock, updatedVariant.products.low_stock_threshold || 5);

    console.log('✅ Stock updated successfully:', {
      variantId: variant_id,
      previousStock,
      newStock: updatedVariant.stock_quantity,
      change: quantityChange,
      newStatus
    });

    return NextResponse.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        variant_id,
        previous_stock: previousStock,
        new_stock: updatedVariant.stock_quantity,
        available_stock: availableStock,
        reserved_stock: updatedVariant.reserved_quantity || 0,
        change: quantityChange,
        status: newStatus
      }
    });

  } catch (error) {
    console.error('💥 Critical error in stock update:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}