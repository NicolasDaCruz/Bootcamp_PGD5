import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

/**
 * GET /api/products/[id]/variants
 * Fetch all variants for a product with detailed stock information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  console.log('📦 [API] GET /api/products/[id]/variants called:', {
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

    // Fetch all variants with stock levels
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        stock_levels (
          id,
          quantity,
          reserved_quantity,
          last_updated,
          warehouse_location
        )
      `)
      .eq('product_id', productId)
      .order('size', { ascending: true });

    if (error) {
      console.error('❌ [API] Error fetching variants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product variants' },
        { status: 500 }
      );
    }

    console.log('✅ [API] Successfully fetched variants:', {
      timestamp: new Date().toISOString(),
      productId,
      variantCount: variants?.length || 0
    });

    return NextResponse.json({
      productId,
      variants: variants || [],
      totalVariants: variants?.length || 0
    });

  } catch (error) {
    console.error('❌ [API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/variants
 * Create or update a product variant with size-specific information
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  console.log('📝 [API] POST /api/products/[id]/variants called:', {
    timestamp: new Date().toISOString(),
    productId
  });

  try {
    // Using the already imported supabase client
    const body = await request.json();

    const {
      size,
      sku,
      price,
      stockQuantity,
      operation = 'upsert' // 'create', 'update', 'upsert', 'delete'
    } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!size) {
      return NextResponse.json(
        { error: 'Size is required' },
        { status: 400 }
      );
    }

    // Handle different operations
    switch (operation) {
      case 'create': {
        // Check if variant already exists
        const { data: existing } = await supabase
          .from('product_variants')
          .select('id')
          .eq('product_id', productId)
          .eq('size', size)
          .single();

        if (existing) {
          return NextResponse.json(
            { error: 'Variant with this size already exists' },
            { status: 409 }
          );
        }

        // Create new variant
        const { data: newVariant, error: createError } = await supabase
          .from('product_variants')
          .insert({
            product_id: productId,
            size,
            sku: sku || `${productId}-${size}`,
            price: price || 0,
            stock_quantity: stockQuantity || 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ [API] Error creating variant:', createError);
          return NextResponse.json(
            { error: 'Failed to create variant' },
            { status: 500 }
          );
        }

        // Create corresponding stock_levels entry
        await supabase
          .from('stock_levels')
          .insert({
            product_variant_id: newVariant.id,
            quantity: stockQuantity || 0,
            reserved_quantity: 0,
            last_updated: new Date().toISOString()
          });

        console.log('✅ [API] Variant created:', newVariant);
        return NextResponse.json({
          success: true,
          variant: newVariant,
          operation: 'created'
        });
      }

      case 'update': {
        // Update existing variant
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (sku !== undefined) updateData.sku = sku;
        if (price !== undefined) updateData.price = price;
        if (stockQuantity !== undefined) updateData.stock_quantity = stockQuantity;

        const { data: updatedVariant, error: updateError } = await supabase
          .from('product_variants')
          .update(updateData)
          .eq('product_id', productId)
          .eq('size', size)
          .select()
          .single();

        if (updateError) {
          console.error('❌ [API] Error updating variant:', updateError);
          return NextResponse.json(
            { error: 'Failed to update variant' },
            { status: 500 }
          );
        }

        // Update stock_levels if stock quantity changed
        if (stockQuantity !== undefined && updatedVariant) {
          await supabase
            .from('stock_levels')
            .update({
              quantity: stockQuantity,
              last_updated: new Date().toISOString()
            })
            .eq('product_variant_id', updatedVariant.id);
        }

        console.log('✅ [API] Variant updated:', updatedVariant);
        return NextResponse.json({
          success: true,
          variant: updatedVariant,
          operation: 'updated'
        });
      }

      case 'upsert': {
        // Upsert variant (create if not exists, update if exists)
        const { data: upsertedVariant, error: upsertError } = await supabase
          .from('product_variants')
          .upsert({
            product_id: productId,
            size,
            sku: sku || `${productId}-${size}`,
            price: price || 0,
            stock_quantity: stockQuantity || 0,
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'product_id,size'
          })
          .select()
          .single();

        if (upsertError) {
          console.error('❌ [API] Error upserting variant:', upsertError);
          return NextResponse.json(
            { error: 'Failed to upsert variant' },
            { status: 500 }
          );
        }

        // Upsert stock_levels
        if (upsertedVariant) {
          await supabase
            .from('stock_levels')
            .upsert({
              product_variant_id: upsertedVariant.id,
              quantity: stockQuantity || 0,
              reserved_quantity: 0,
              last_updated: new Date().toISOString()
            }, {
              onConflict: 'product_variant_id'
            });
        }

        console.log('✅ [API] Variant upserted:', upsertedVariant);
        return NextResponse.json({
          success: true,
          variant: upsertedVariant,
          operation: 'upserted'
        });
      }

      case 'delete': {
        // Soft delete by setting is_active to false
        const { data: deletedVariant, error: deleteError } = await supabase
          .from('product_variants')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', productId)
          .eq('size', size)
          .select()
          .single();

        if (deleteError) {
          console.error('❌ [API] Error deleting variant:', deleteError);
          return NextResponse.json(
            { error: 'Failed to delete variant' },
            { status: 500 }
          );
        }

        console.log('✅ [API] Variant deleted:', deletedVariant);
        return NextResponse.json({
          success: true,
          variant: deletedVariant,
          operation: 'deleted'
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid operation: ${operation}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ [API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products/[id]/variants
 * Bulk update variants (e.g., adjust stock for multiple sizes)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  console.log('🔄 [API] PATCH /api/products/[id]/variants called:', {
    timestamp: new Date().toISOString(),
    productId
  });

  try {
    // Using the already imported supabase client
    const body = await request.json();
    const { variants, operation = 'updateStock' } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!variants || !Array.isArray(variants)) {
      return NextResponse.json(
        { error: 'Variants array is required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const variant of variants) {
      if (operation === 'updateStock') {
        const { size, adjustment } = variant;

        if (!size || adjustment === undefined) {
          results.push({ size, error: 'Size and adjustment required' });
          continue;
        }

        // Get current variant
        const { data: currentVariant } = await supabase
          .from('product_variants')
          .select('id, stock_quantity')
          .eq('product_id', productId)
          .eq('size', size)
          .single();

        if (!currentVariant) {
          results.push({ size, error: 'Variant not found' });
          continue;
        }

        const newQuantity = Math.max(0, currentVariant.stock_quantity + adjustment);

        // Update stock quantity
        const { data: updated, error } = await supabase
          .from('product_variants')
          .update({
            stock_quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentVariant.id)
          .select()
          .single();

        if (error) {
          results.push({ size, error: 'Failed to update' });
        } else {
          results.push({
            size,
            success: true,
            previousStock: currentVariant.stock_quantity,
            newStock: newQuantity,
            adjustment
          });
        }
      }
    }

    const hasErrors = results.some(r => r.error);

    console.log(`${hasErrors ? '⚠️' : '✅'} [API] Bulk update completed:`, {
      timestamp: new Date().toISOString(),
      productId,
      totalVariants: variants.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => r.error).length
    });

    return NextResponse.json({
      success: !hasErrors,
      results,
      summary: {
        total: variants.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => r.error).length
      }
    });

  } catch (error) {
    console.error('❌ [API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';