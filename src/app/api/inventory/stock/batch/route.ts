import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PATCH(request: Request) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { product_id, updates, notes } = body;

    console.log('🔄 Processing batch stock update:', { product_id, updates: updates.length, notes });

    // Validate input
    if (!product_id || !updates || !Array.isArray(updates)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: product_id and updates array'
      }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Check vendor permissions
    const { data: profile } = await supabaseClient
      .from('users')
      .select('role, vendor_id')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role?.toLowerCase();
    const isVendor = userRole === 'vendor' || userRole === 'vendeur';
    const isAdmin = userRole === 'admin';

    if (!isVendor && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Vendor or admin privileges required'
      }, { status: 403 });
    }

    // Get product to check vendor ownership
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('vendor_id, name')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    // Check if user can manage this product
    const vendorId = profile?.vendor_id || user.id;
    if (!isAdmin && product.vendor_id !== vendorId) {
      return NextResponse.json({
        success: false,
        error: 'You do not have permission to manage this product'
      }, { status: 403 });
    }

    // Process updates
    const results = [];
    const errors = [];
    const movements = [];

    for (const update of updates) {
      const { variant_id, new_stock, previous_stock } = update;

      try {
        // Use our RPC function to update variant stock (handles aggregation and audit trail)
        const quantityChange = new_stock - (previous_stock || 0);
        const { error: updateError } = await supabaseClient.rpc('update_variant_stock', {
          variant_id,
          quantity_change: quantityChange
        });

        if (updateError) {
          errors.push({
            variant_id,
            error: updateError.message
          });
          continue;
        }

        // Record stock movement for audit trail
        const movement = {
          product_id,
          variant_id,
          user_id: user.id,
          movement_type: new_stock > (previous_stock || 0) ? 'restock' : 'adjustment',
          quantity_change: new_stock - (previous_stock || 0),
          previous_quantity: previous_stock || 0,
          new_quantity: new_stock,
          notes: notes || `Batch stock update by ${user.email}`,
          created_at: new Date().toISOString()
        };

        movements.push(movement);

        results.push({
          variant_id,
          success: true,
          previous_stock: previous_stock || 0,
          new_stock
        });

      } catch (err) {
        console.error(`Error updating variant ${variant_id}:`, err);
        errors.push({
          variant_id,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    // Insert stock movements for audit trail (optional - table needs to exist)
    if (movements.length > 0) {
      try {
        const { error: movementError } = await supabaseClient
          .from('stock_movements')
          .insert(movements);

        if (movementError) {
          console.warn('Could not record stock movements:', movementError);
          // Don't fail the whole operation if audit log fails
        }
      } catch (err) {
        console.warn('Stock movements table might not exist:', err);
      }
    }

    // Check if we need to create alerts for low stock
    const { data: updatedVariants } = await supabaseClient
      .from('product_variants')
      .select('id, size, stock_quantity')
      .eq('product_id', product_id);

    const { data: productDetails } = await supabaseClient
      .from('products')
      .select('low_stock_threshold')
      .eq('id', product_id)
      .single();

    const lowStockThreshold = productDetails?.low_stock_threshold || 5;
    const lowStockVariants = updatedVariants?.filter(v =>
      v.stock_quantity > 0 && v.stock_quantity <= lowStockThreshold
    ) || [];

    if (lowStockVariants.length > 0) {
      // Create low stock alert
      try {
        await supabaseClient
          .from('inventory_alerts')
          .insert({
            product_id,
            vendor_id: product.vendor_id,
            alert_type: 'low_stock',
            message: `Low stock alert: ${lowStockVariants.length} variant(s) of "${product.name}" are running low`,
            metadata: {
              variants: lowStockVariants,
              threshold: lowStockThreshold
            },
            created_at: new Date().toISOString()
          });
      } catch (err) {
        console.warn('Could not create low stock alert:', err);
      }
    }

    console.log('✅ Batch stock update completed:', {
      successful: results.length,
      failed: errors.length
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${results.length} variant(s)`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      stats: {
        total: updates.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('💥 Critical error in batch stock update:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Alternative endpoint for bulk imports from CSV/Excel
  try {
    const supabaseClient = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { imports, dry_run = false } = body;

    console.log('📦 Processing bulk stock import:', {
      items: imports?.length,
      dry_run
    });

    // Validate input
    if (!imports || !Array.isArray(imports)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: imports array'
      }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Check vendor permissions
    const { data: profile } = await supabaseClient
      .from('users')
      .select('role, vendor_id')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role?.toLowerCase();
    const isVendor = userRole === 'vendor' || userRole === 'vendeur';
    const isAdmin = userRole === 'admin';

    if (!isVendor && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Vendor or admin privileges required'
      }, { status: 403 });
    }

    const vendorId = profile?.vendor_id || user.id;
    const validationResults = [];
    const updates = [];

    // Validate and prepare updates
    for (const item of imports) {
      const { sku, new_stock, notes } = item;

      if (!sku || new_stock === undefined) {
        validationResults.push({
          sku,
          valid: false,
          error: 'Missing SKU or new stock value'
        });
        continue;
      }

      // Find variant by SKU
      const { data: variant, error: variantError } = await supabaseClient
        .from('product_variants')
        .select(`
          id,
          product_id,
          stock_quantity,
          products!inner (
            vendor_id,
            name
          )
        `)
        .eq('sku', sku)
        .single();

      if (variantError || !variant) {
        validationResults.push({
          sku,
          valid: false,
          error: 'Variant not found'
        });
        continue;
      }

      // Check permissions
      if (!isAdmin && variant.products.vendor_id !== vendorId) {
        validationResults.push({
          sku,
          valid: false,
          error: 'No permission to manage this product'
        });
        continue;
      }

      validationResults.push({
        sku,
        valid: true,
        variant_id: variant.id,
        product_id: variant.product_id,
        product_name: variant.products.name,
        current_stock: variant.stock_quantity,
        new_stock: Math.max(0, new_stock),
        change: new_stock - variant.stock_quantity
      });

      updates.push({
        variant_id: variant.id,
        product_id: variant.product_id,
        new_stock: Math.max(0, new_stock),
        previous_stock: variant.stock_quantity,
        notes
      });
    }

    // If dry run, just return validation results
    if (dry_run) {
      return NextResponse.json({
        success: true,
        dry_run: true,
        validation_results: validationResults,
        stats: {
          total: imports.length,
          valid: validationResults.filter(r => r.valid).length,
          invalid: validationResults.filter(r => !r.valid).length
        }
      });
    }

    // Process actual updates
    const updateResults = [];
    for (const update of updates) {
      const { variant_id, new_stock, notes } = update;

      const quantityChange = new_stock - update.previous_stock;
      const { error: updateError } = await supabaseClient.rpc('update_variant_stock', {
        variant_id,
        quantity_change: quantityChange
      });

      if (updateError) {
        updateResults.push({
          variant_id,
          success: false,
          error: updateError.message
        });
      } else {
        updateResults.push({
          variant_id,
          success: true,
          new_stock
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${updateResults.length} stock updates`,
      results: updateResults,
      validation_results: validationResults,
      stats: {
        total: imports.length,
        processed: updateResults.length,
        successful: updateResults.filter(r => r.success).length,
        failed: updateResults.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('💥 Critical error in bulk stock import:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}