import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { variantId, quantity } = await request.json();

    if (!variantId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid variantId and quantity required' },
        { status: 400 }
      );
    }

    console.log('🔒 Reserving stock:', { variantId, quantity });

    // Use admin client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing Supabase configuration:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey
      });
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
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
      console.error('❌ Variant not found:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Product variant not found' },
        { status: 404 }
      );
    }

    // Check available stock
    const availableStock = (variant.stock_quantity || 0) - (variant.reserved_quantity || 0);

    if (availableStock < quantity) {
      console.log('❌ Insufficient stock:', { availableStock, requested: quantity });
      return NextResponse.json(
        { success: false, error: 'Insufficient stock available' },
        { status: 409 }
      );
    }

    // Update reserved quantity
    const newReservedQuantity = (variant.reserved_quantity || 0) + quantity;

    const { data: updatedVariant, error: updateError } = await supabaseAdmin
      .from('product_variants')
      .update({
        reserved_quantity: newReservedQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', variantId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating reserved stock:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to reserve stock' },
        { status: 500 }
      );
    }

    // Generate reservation ID
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('✅ Stock reserved:', {
      variantId,
      quantity,
      newReservedQuantity,
      reservationId
    });

    return NextResponse.json({
      success: true,
      reservationId,
      variant: updatedVariant
    });

  } catch (error) {
    console.error('💥 Stock reservation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('variantId');
    const quantity = parseInt(searchParams.get('quantity') || '0');

    if (!variantId || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid variantId and quantity required' },
        { status: 400 }
      );
    }

    console.log('🔓 Releasing stock:', { variantId, quantity });

    // Use admin client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing Supabase configuration:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey
      });
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
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
      return NextResponse.json(
        { success: false, error: 'Product variant not found' },
        { status: 404 }
      );
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
      return NextResponse.json(
        { success: false, error: 'Failed to release stock' },
        { status: 500 }
      );
    }

    console.log('✅ Stock released:', { variantId, quantity, newReservedQuantity });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('💥 Stock release error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}