import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');
    const productId = searchParams.get('product_id');
    const variantId = searchParams.get('variant_id');
    const status = searchParams.get('status'); // 'in_stock', 'low_stock', 'out_of_stock'
    const includeVariants = searchParams.get('include_variants') !== 'false';
    const sizeOnly = searchParams.get('size_only') === 'true'; // Get only size variants

    console.log('🔍 Fetching inventory stock data...', { vendorId, productId, variantId, status, includeVariants, sizeOnly });

    // If requesting specific variant stock
    if (variantId) {
      const { data: variant, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
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
          products (
            name,
            brand,
            price,
            low_stock_threshold,
            vendor_id
          )
        `)
        .eq('id', variantId)
        .single();

      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      const getStockStatus = (stock: number, threshold: number) => {
        if (stock === 0) return 'out_of_stock';
        if (stock <= threshold) return 'low_stock';
        return 'in_stock';
      };

      const availableStock = variant.computed_available_stock ?? (variant.stock_quantity - (variant.reserved_quantity || 0));
      const stockStatus = getStockStatus(availableStock, variant.products.low_stock_threshold || 5);

      return NextResponse.json({
        success: true,
        variant: {
          id: variant.id,
          product_id: variant.product_id,
          name: variant.name,
          value: variant.value,
          size: variant.size,
          eu_size: variant.eu_size,
          us_size: variant.us_size,
          uk_size: variant.uk_size,
          sku: variant.sku,
          stock_quantity: variant.stock_quantity,
          reserved_quantity: variant.reserved_quantity || 0,
          available_stock: availableStock,
          price: variant.products.price + (variant.price_adjustment || 0),
          status: stockStatus,
          is_active: variant.is_active,
          product_name: variant.products.name,
          brand: variant.products.brand
        }
      });
    }

    // Build query for products with stock information
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
        is_active,
        total_stock,
        available_stock,
        reserved_stock,
        ${includeVariants ? `product_variants (
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
        ),` : ''}
        product_images (
          image_url,
          is_primary
        )
      `);

    // Apply filters
    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }
    if (productId) {
      query = query.eq('id', productId);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('❌ Error fetching products:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Transform products into inventory items
    const inventoryItems: any[] = [];

    products?.forEach(product => {
      // Calculate stock status
      const getStockStatus = (stock: number, threshold: number) => {
        if (stock === 0) return 'out_of_stock';
        if (stock <= threshold) return 'low_stock';
        return 'in_stock';
      };

      // Add main product summary
      const mainStockStatus = getStockStatus(product.available_stock || 0, product.low_stock_threshold || 5);

      const mainItem = {
        id: product.id,
        product_id: product.id,
        product_name: product.name,
        brand: product.brand,
        sku: product.sku,
        current_stock: product.total_stock || 0,
        reserved_stock: product.reserved_stock || 0,
        available_stock: product.available_stock || 0,
        low_stock_threshold: product.low_stock_threshold || 5,
        price: product.price,
        status: mainStockStatus,
        is_variant: false,
        image_url: product.product_images?.find(img => img.is_primary)?.image_url || null,
        vendor_id: product.vendor_id
      };

      inventoryItems.push(mainItem);

      // Add variants if requested
      if (includeVariants && product.product_variants) {
        product.product_variants.forEach(variant => {
          // Filter for size variants only if requested
          if (sizeOnly && variant.variant_type !== 'size') {
            return;
          }

          const availableStock = variant.computed_available_stock ?? (variant.stock_quantity - (variant.reserved_quantity || 0));
          const variantStockStatus = getStockStatus(availableStock, product.low_stock_threshold || 5);

          const sizeDisplay = variant.eu_size ? `EU ${variant.eu_size}` :
                             variant.us_size ? `US ${variant.us_size}` :
                             variant.size || variant.value;

          inventoryItems.push({
            id: variant.id,
            product_id: product.id,
            variant_id: variant.id,
            product_name: `${product.name} - ${sizeDisplay}`,
            brand: product.brand,
            sku: variant.sku || `${product.sku}-${variant.value}`,
            current_stock: variant.stock_quantity || 0,
            reserved_stock: variant.reserved_quantity || 0,
            available_stock: availableStock,
            low_stock_threshold: product.low_stock_threshold || 5,
            price: product.price + (variant.price_adjustment || 0),
            status: variantStockStatus,
            is_variant: true,
            variant_name: variant.name,
            variant_value: variant.value,
            size: variant.size,
            eu_size: variant.eu_size,
            us_size: variant.us_size,
            uk_size: variant.uk_size,
            size_display: sizeDisplay,
            is_active: variant.is_active,
            image_url: product.product_images?.find(img => img.is_primary)?.image_url || null,
            vendor_id: product.vendor_id
          });
        });
      }
    });

    // Apply status filter if provided
    let filteredItems = inventoryItems;
    if (status && status !== 'all') {
      filteredItems = inventoryItems.filter(item => item.status === status);
    }

    // Calculate summary statistics
    const stats = {
      total: inventoryItems.length,
      products: inventoryItems.filter(item => !item.is_variant).length,
      variants: inventoryItems.filter(item => item.is_variant).length,
      in_stock: inventoryItems.filter(item => item.status === 'in_stock').length,
      low_stock: inventoryItems.filter(item => item.status === 'low_stock').length,
      out_of_stock: inventoryItems.filter(item => item.status === 'out_of_stock').length,
      total_value: inventoryItems.reduce((sum, item) => sum + (item.current_stock * (item.price || 0)), 0),
      total_units: inventoryItems.reduce((sum, item) => sum + item.current_stock, 0),
      available_units: inventoryItems.reduce((sum, item) => sum + item.available_stock, 0),
      reserved_units: inventoryItems.reduce((sum, item) => sum + item.reserved_stock, 0)
    };

    console.log('✅ Successfully fetched inventory data:', {
      totalItems: filteredItems.length,
      stats
    });

    return NextResponse.json({
      success: true,
      items: filteredItems,
      stats,
      count: filteredItems.length
    });

  } catch (error) {
    console.error('💥 Critical error in inventory stock API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { product_id, variant_id, new_stock, notes } = body;

    console.log('🔄 Updating stock:', { product_id, variant_id, new_stock, notes });

    if (!product_id || new_stock === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: product_id and new_stock'
      }, { status: 400 });
    }

    // Get current stock for movement tracking
    let currentStock = 0;
    if (variant_id) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('stock_quantity')
        .eq('id', variant_id)
        .single();
      currentStock = variant?.stock_quantity || 0;
    } else {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', product_id)
        .single();
      currentStock = product?.stock_quantity || 0;
    }

    // Update the stock
    let updateError = null;
    if (variant_id) {
      const { error } = await supabase
        .from('product_variants')
        .update({ stock_quantity: new_stock })
        .eq('id', variant_id);
      updateError = error;
    } else {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: new_stock })
        .eq('id', product_id);
      updateError = error;
    }

    if (updateError) {
      console.error('❌ Error updating stock:', updateError);
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 });
    }

    console.log('✅ Stock updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Stock updated successfully',
      previous_stock: currentStock,
      new_stock,
      change: new_stock - currentStock
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