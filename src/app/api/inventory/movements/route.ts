import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');
    const productId = searchParams.get('product_id');
    const type = searchParams.get('type'); // 'sale', 'restock', 'adjustment', 'return'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔍 Fetching stock movements...', { vendorId, productId, type, limit, offset });

    // For now, we'll simulate stock movements since we don't have a dedicated table
    // In a real implementation, you would query a stock_movements table

    // Get products to simulate movements
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        brand,
        sku,
        stock_quantity,
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
    if (productId) {
      query = query.eq('id', productId);
    }

    query = query.limit(20); // Limit products for simulation

    const { data: products, error } = await query;

    if (error) {
      console.error('❌ Error fetching products for movements:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Simulate stock movements based on products
    const movements: any[] = [];

    products?.forEach(product => {
      // Simulate some historical movements for each product
      const movementTypes = ['sale', 'restock', 'adjustment'];
      const numMovements = Math.floor(Math.random() * 5) + 1; // 1-5 movements per product

      for (let i = 0; i < numMovements; i++) {
        const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
        const quantityChange = movementType === 'sale'
          ? -(Math.floor(Math.random() * 5) + 1) // -1 to -5
          : Math.floor(Math.random() * 10) + 1;  // +1 to +10

        const previousStock = Math.floor(Math.random() * 50) + 10;
        const newStock = Math.max(0, previousStock + quantityChange);

        // Create movement for main product
        movements.push({
          id: `${product.id}_${i}_main`,
          product_id: product.id,
          product_name: product.name,
          variant_id: null,
          variant_name: null,
          movement_type: movementType,
          quantity_change: quantityChange,
          previous_stock: previousStock,
          new_stock: newStock,
          notes: `${movementType === 'sale' ? 'Product sold' : movementType === 'restock' ? 'Inventory restocked' : 'Stock adjustment'}`,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
          created_by: {
            name: 'System',
            email: 'system@example.com'
          },
          vendor_id: product.vendor_id
        });

        // Sometimes add variant movements
        if (product.product_variants && product.product_variants.length > 0 && Math.random() > 0.5) {
          const variant = product.product_variants[Math.floor(Math.random() * product.product_variants.length)];
          movements.push({
            id: `${product.id}_${i}_${variant.id}`,
            product_id: product.id,
            product_name: product.name,
            variant_id: variant.id,
            variant_name: `${variant.name}: ${variant.value}`,
            movement_type: movementType,
            quantity_change: quantityChange,
            previous_stock: previousStock,
            new_stock: newStock,
            notes: `${movementType === 'sale' ? 'Variant sold' : movementType === 'restock' ? 'Variant restocked' : 'Variant stock adjustment'}`,
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: {
              name: 'System',
              email: 'system@example.com'
            },
            vendor_id: product.vendor_id
          });
        }
      }
    });

    // Filter by type if specified
    let filteredMovements = movements;
    if (type && type !== 'all') {
      filteredMovements = movements.filter(movement => movement.movement_type === type);
    }

    // Sort by created_at (most recent first) and apply pagination
    const sortedMovements = filteredMovements
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit);

    // Calculate movement statistics
    const stats = {
      total: filteredMovements.length,
      sales: filteredMovements.filter(m => m.movement_type === 'sale').length,
      restocks: filteredMovements.filter(m => m.movement_type === 'restock').length,
      adjustments: filteredMovements.filter(m => m.movement_type === 'adjustment').length,
      returns: filteredMovements.filter(m => m.movement_type === 'return').length,
      total_units_out: filteredMovements
        .filter(m => m.quantity_change < 0)
        .reduce((sum, m) => sum + Math.abs(m.quantity_change), 0),
      total_units_in: filteredMovements
        .filter(m => m.quantity_change > 0)
        .reduce((sum, m) => sum + m.quantity_change, 0)
    };

    console.log('✅ Successfully fetched stock movements:', {
      totalMovements: sortedMovements.length,
      stats
    });

    return NextResponse.json({
      success: true,
      movements: sortedMovements,
      stats,
      count: sortedMovements.length,
      total: filteredMovements.length,
      has_more: offset + limit < filteredMovements.length
    });

  } catch (error) {
    console.error('💥 Critical error in inventory movements API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      product_id,
      variant_id,
      movement_type,
      quantity_change,
      notes
    } = body;

    console.log('📝 Creating stock movement:', {
      product_id,
      variant_id,
      movement_type,
      quantity_change,
      notes
    });

    if (!product_id || !movement_type || quantity_change === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: product_id, movement_type, and quantity_change'
      }, { status: 400 });
    }

    // Get current stock
    let currentStock = 0;
    let stockField = 'stock_quantity';
    let table = 'products';
    let id = product_id;

    if (variant_id) {
      table = 'product_variants';
      id = variant_id;
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

    const newStock = Math.max(0, currentStock + quantity_change);

    // Update the stock
    const { error: updateError } = await supabase
      .from(table)
      .update({ [stockField]: newStock })
      .eq('id', id);

    if (updateError) {
      console.error('❌ Error updating stock:', updateError);
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 });
    }

    // In a real implementation, you would also insert into a stock_movements table
    // For now, we'll just return the movement data

    const movement = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      product_id,
      variant_id: variant_id || null,
      movement_type,
      quantity_change,
      previous_stock: currentStock,
      new_stock: newStock,
      notes: notes || '',
      created_at: new Date().toISOString(),
      created_by: {
        name: 'System',
        email: 'system@example.com'
      }
    };

    console.log('✅ Stock movement created successfully');

    return NextResponse.json({
      success: true,
      message: 'Stock movement created successfully',
      movement
    });

  } catch (error) {
    console.error('💥 Critical error creating stock movement:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}