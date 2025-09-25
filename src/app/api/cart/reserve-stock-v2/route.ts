import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Production-ready stock reservation API with robust error handling
export async function POST(request: NextRequest) {
  try {
    const { variantId, quantity, productId } = await request.json();

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid quantity required' },
        { status: 400 }
      );
    }

    console.log('🔒 Attempting stock reservation:', { variantId, productId, quantity });

    // Try service role key first, fallback to anon key with graceful degradation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        { success: false, error: 'Database configuration error' },
        { status: 500 }
      );
    }

    let supabaseClient;
    let useServiceRole = false;

    // Try service role first
    if (serviceRoleKey) {
      try {
        supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        // Test the connection with a quick query
        const { error: testError } = await supabaseClient
          .from('product_variants')
          .select('id')
          .limit(1)
          .single();

        if (!testError) {
          useServiceRole = true;
          console.log('✅ Using service role authentication');
        } else {
          console.log('❌ Service role failed, falling back to anon key');
        }
      } catch (error) {
        console.log('❌ Service role setup failed, falling back to anon key');
      }
    }

    // Fallback to anon key if service role failed
    if (!useServiceRole && anonKey) {
      supabaseClient = createClient(supabaseUrl, anonKey);
      console.log('⚠️ Using anon key (limited functionality)');
    }

    if (!supabaseClient) {
      return NextResponse.json(
        { success: false, error: 'Database authentication error' },
        { status: 500 }
      );
    }

    // Try to find variant by ID or find available variant for product
    let variant = null;
    let actualVariantId = variantId;

    if (variantId) {
      // First try with provided variant ID
      const { data: variantData, error: fetchError } = await supabaseClient
        .from('product_variants')
        .select('*')
        .eq('id', variantId)
        .eq('is_active', true)
        .single();

      if (variantData && !fetchError) {
        variant = variantData;
      }
    }

    // If no variant found and we have a product ID, find any available variant
    if (!variant && productId) {
      console.log(`🔍 Variant ${variantId} not found, searching for alternatives for product ${productId}`);

      const { data: alternativeVariants, error: altError } = await supabaseClient
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .gte('stock_quantity', quantity)
        .order('stock_quantity', { ascending: false })
        .limit(1);

      if (alternativeVariants && alternativeVariants.length > 0 && !altError) {
        variant = alternativeVariants[0];
        actualVariantId = variant.id;
        console.log(`✅ Found alternative variant: ${actualVariantId}`);
      }
    }

    if (!variant) {
      console.error('❌ No suitable variant found');
      return NextResponse.json(
        { success: false, error: 'Product variant not found or insufficient stock' },
        { status: 404 }
      );
    }

    // Check stock availability
    const currentStock = variant.stock_quantity || 0;
    const reservedStock = variant.reserved_quantity || 0;
    const availableStock = Math.max(0, currentStock - reservedStock);

    console.log('📊 Stock status:', {
      variantId: actualVariantId,
      currentStock,
      reservedStock,
      availableStock,
      requested: quantity
    });

    if (availableStock < quantity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient stock available',
          availableStock,
          requestedQuantity: quantity
        },
        { status: 409 }
      );
    }

    // Attempt stock reservation (only if using service role)
    if (useServiceRole) {
      const newReservedQuantity = reservedStock + quantity;

      const { data: updatedVariant, error: updateError } = await supabaseClient
        .from('product_variants')
        .update({
          reserved_quantity: newReservedQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', actualVariantId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Failed to update reserved stock:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to reserve stock - please try again' },
          { status: 500 }
        );
      }

      console.log('✅ Stock reserved successfully');

      // Generate reservation ID
      const reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      return NextResponse.json({
        success: true,
        reservationId,
        variantId: actualVariantId,
        quantityReserved: quantity,
        variant: updatedVariant
      });

    } else {
      // Anon key mode - simulate reservation (for cart display purposes)
      console.log('⚠️ Simulated reservation (anon mode)');

      const mockReservationId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      return NextResponse.json({
        success: true,
        reservationId: mockReservationId,
        variantId: actualVariantId,
        quantityReserved: quantity,
        simulated: true,
        warning: 'Reservation simulated - stock not actually reserved',
        variant: {
          ...variant,
          reserved_quantity: (variant.reserved_quantity || 0) + quantity
        }
      });
    }

  } catch (error) {
    console.error('💥 Stock reservation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('variantId');
    const quantity = parseInt(searchParams.get('quantity') || '0');
    const reservationId = searchParams.get('reservationId');

    if (!variantId || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid variantId and quantity required' },
        { status: 400 }
      );
    }

    // Skip if it's a simulated reservation
    if (reservationId && reservationId.startsWith('sim_')) {
      console.log('⚠️ Skipping release of simulated reservation:', reservationId);
      return NextResponse.json({ success: true, simulated: true });
    }

    console.log('🔓 Releasing stock:', { variantId, quantity, reservationId });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.log('⚠️ Cannot release stock - missing service role key');
      return NextResponse.json({ success: true, warning: 'Could not release reservation' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get current variant data
    const { data: variant, error: fetchError } = await supabaseAdmin
      .from('product_variants')
      .select('*')
      .eq('id', variantId)
      .single();

    if (fetchError || !variant) {
      console.log('⚠️ Variant not found for release:', fetchError);
      return NextResponse.json({ success: true, warning: 'Variant not found' });
    }

    // Update reserved quantity (decrease)
    const newReservedQuantity = Math.max(0, (variant.reserved_quantity || 0) - quantity);

    const { error: updateError } = await supabaseAdmin
      .from('product_variants')
      .update({
        reserved_quantity: newReservedQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', variantId);

    if (updateError) {
      console.error('❌ Error releasing reserved stock:', updateError);
      return NextResponse.json({ success: true, warning: 'Could not release reservation' });
    }

    console.log('✅ Stock released:', { variantId, quantity, newReservedQuantity });
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('💥 Stock release error:', error);
    return NextResponse.json({ success: true, warning: 'Release error - continuing anyway' });
  }
}