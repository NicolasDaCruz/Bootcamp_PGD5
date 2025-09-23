import { NextRequest, NextResponse } from 'next/server';
import { updateStockDirectly } from '../../../../lib/order-utils';

export async function POST(request: NextRequest) {
  try {
    const { variantId, quantity } = await request.json();

    if (!variantId || quantity === undefined) {
      return NextResponse.json(
        { error: 'variantId and quantity are required' },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing stock decrement for variant ${variantId} by ${quantity}`);

    // Test the direct stock update method (fallback approach)
    const result = await updateStockDirectly(variantId, -Math.abs(quantity));

    return NextResponse.json({
      success: result.success,
      result,
      message: result.success
        ? `Stock successfully decremented by ${quantity}`
        : `Stock update failed: ${result.error}`
    });

  } catch (error) {
    console.error('Error testing stock decrement:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';