import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredReservations } from '../../../../../../lib/cart-utils';

// POST /api/stock/reservations/cleanup - Cleanup expired reservations
export async function POST(request: NextRequest) {
  try {
    // Optional: Check for admin/system access if needed
    // This endpoint could be called by a cron job or admin panel

    await cleanupExpiredReservations();

    return NextResponse.json({
      success: true,
      message: 'Expired reservations cleaned up successfully'
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup expired reservations'
      },
      { status: 500 }
    );
  }
}

// GET /api/stock/reservations/cleanup - Get cleanup status/stats
export async function GET(request: NextRequest) {
  try {
    // Get count of active and expired reservations for monitoring
    const { supabase } = await import('../../../../../../lib/supabase');

    const { data: activeCount } = await supabase
      .from('stock_reservations')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    const { data: expiredCount } = await supabase
      .from('stock_reservations')
      .select('id', { count: 'exact' })
      .eq('status', 'expired');

    const { data: recentExpired } = await supabase
      .from('stock_reservations')
      .select('expires_at')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        activeReservations: activeCount?.length || 0,
        expiredReservations: expiredCount?.length || 0,
        needsCleanup: recentExpired?.length || 0,
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting cleanup status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get cleanup status'
      },
      { status: 500 }
    );
  }
}