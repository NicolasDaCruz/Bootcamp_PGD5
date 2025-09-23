import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  console.log('📦 [API] GET /api/products/[id]/sizes called:', {
    timestamp: new Date().toISOString(),
    productId
  });

  try {
    // Using the already imported supabase client

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Fetch all variants for this product with their stock information
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select(`
        id,
        eu_size,
        us_size,
        sku,
        stock_quantity,
        computed_available_stock,
        price_adjustment,
        is_active,
        created_at,
        updated_at
      `)
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('eu_size', { ascending: true });

    if (variantsError) {
      console.error('❌ [API] Error fetching product variants:', variantsError);
      return NextResponse.json(
        { error: 'Failed to fetch product sizes' },
        { status: 500 }
      );
    }

    if (!variants || variants.length === 0) {
      console.log('⚠️ [API] No variants found for product:', productId);
      return NextResponse.json({
        productId,
        sizes: [],
        message: 'No size variants found for this product'
      });
    }

    // Transform variants into size information with availability
    const sizes = variants
      .filter(variant => variant.eu_size != null) // Filter out variants without sizes
      .map(variant => ({
        id: variant.id,
        size: variant.eu_size, // Use eu_size as the main size
        euSize: variant.eu_size,
        usSize: variant.us_size,
        sku: variant.sku,
        price: variant.price_adjustment || 0,
        stockQuantity: variant.stock_quantity,
        availableStock: variant.computed_available_stock || variant.stock_quantity,
        isAvailable: (variant.computed_available_stock || variant.stock_quantity) > 0,
        isLowStock: (variant.computed_available_stock || variant.stock_quantity) <= 5 &&
                     (variant.computed_available_stock || variant.stock_quantity) > 0,
        isOutOfStock: (variant.computed_available_stock || variant.stock_quantity) <= 0
      }));

    // Get product details for additional context
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, brand')
      .eq('id', productId)
      .single();

    if (productError) {
      console.warn('⚠️ [API] Could not fetch product details:', productError);
    }

    const response = {
      productId,
      productName: product?.name || null,
      productBrand: product?.brand || null,
      sizes,
      totalVariants: sizes.length,
      availableVariants: sizes.filter(s => s.isAvailable).length,
      outOfStockVariants: sizes.filter(s => s.isOutOfStock).length,
      lowStockVariants: sizes.filter(s => s.isLowStock).length
    };

    console.log('✅ [API] Successfully fetched product sizes:', {
      timestamp: new Date().toISOString(),
      productId,
      totalSizes: sizes.length,
      availableSizes: response.availableVariants
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [API] Unexpected error in GET /api/products/[id]/sizes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Add POST endpoint for updating size-specific stock
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  console.log('📝 [API] POST /api/products/[id]/sizes called:', {
    timestamp: new Date().toISOString(),
    productId
  });

  try {
    // Using the already imported supabase client
    const body = await request.json();
    const { size, stockQuantity, variantId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!variantId && !size) {
      return NextResponse.json(
        { error: 'Either variant ID or size is required' },
        { status: 400 }
      );
    }

    if (stockQuantity === undefined || stockQuantity < 0) {
      return NextResponse.json(
        { error: 'Valid stock quantity is required' },
        { status: 400 }
      );
    }

    // Update stock for specific variant
    let updateQuery;
    if (variantId) {
      updateQuery = supabase
        .from('product_variants')
        .update({
          stock_quantity: stockQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId)
        .eq('product_id', productId);
    } else {
      updateQuery = supabase
        .from('product_variants')
        .update({
          stock_quantity: stockQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', productId)
        .eq('eu_size', size);
    }

    const { data: updatedVariant, error: updateError } = await updateQuery
      .select()
      .single();

    if (updateError) {
      console.error('❌ [API] Error updating variant stock:', updateError);
      return NextResponse.json(
        { error: 'Failed to update stock quantity' },
        { status: 500 }
      );
    }

    console.log('✅ [API] Successfully updated variant stock:', {
      timestamp: new Date().toISOString(),
      productId,
      variantId: updatedVariant.id,
      euSize: updatedVariant.eu_size,
      usSize: updatedVariant.us_size,
      newStock: stockQuantity
    });

    return NextResponse.json({
      success: true,
      variant: {
        id: updatedVariant.id,
        euSize: updatedVariant.eu_size,
        usSize: updatedVariant.us_size,
        stockQuantity: updatedVariant.stock_quantity,
        availableStock: updatedVariant.computed_available_stock || updatedVariant.stock_quantity
      }
    });

  } catch (error) {
    console.error('❌ [API] Unexpected error in POST /api/products/[id]/sizes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';