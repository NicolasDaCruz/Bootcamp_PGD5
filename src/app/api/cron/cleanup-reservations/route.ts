import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredReservations } from '../../../../../lib/cart-utils';

// POST /api/cron/cleanup-reservations - Cleanup expired reservations (for cron jobs)
export async function POST(request: NextRequest) {
  try {
    // Verify this is coming from a trusted source (Vercel Cron, admin, etc.)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If we have a cron secret configured, verify it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    console.log('Running automated reservation cleanup...');

    // Run the cleanup
    await cleanupExpiredReservations();

    // Get some statistics about the cleanup
    const { supabase } = await import('../../../../../lib/supabase');

    const { data: expiredCount } = await supabase
      .from('stock_reservations')
      .select('id', { count: 'exact' })
      .eq('status', 'expired');

    const { data: activeCount } = await supabase
      .from('stock_reservations')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    console.log(`Cleanup completed. Active: ${activeCount?.length || 0}, Expired: ${expiredCount?.length || 0}`);

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: {
        timestamp: new Date().toISOString(),
        activeReservations: activeCount?.length || 0,
        expiredReservations: expiredCount?.length || 0
      }
    });

  } catch (error) {
    console.error('Error during automated cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/cron/cleanup-reservations - Get cleanup status
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await import('../../../../../lib/supabase');

    // Get current statistics
    const { data: activeReservations } = await supabase
      .from('stock_reservations')
      .select('expires_at')
      .eq('status', 'active');

    const { data: expiredCount } = await supabase
      .from('stock_reservations')
      .select('id', { count: 'exact' })
      .eq('status', 'expired');

    const now = new Date();
    const expiringSoon = activeReservations?.filter(res =>
      new Date(res.expires_at) < new Date(now.getTime() + 5 * 60 * 1000) // Expiring in next 5 minutes
    ).length || 0;

    const needsCleanup = activeReservations?.filter(res =>
      new Date(res.expires_at) < now
    ).length || 0;

    return NextResponse.json({
      success: true,
      data: {
        activeReservations: activeReservations?.length || 0,
        expiredReservations: expiredCount?.length || 0,
        expiringSoon,
        needsCleanup,
        lastChecked: now.toISOString(),
        nextCleanupRecommended: needsCleanup > 0
      }
    });

  } catch (error) {
    console.error('Error getting cleanup status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get status'
      },
      { status: 500 }
    );
  }
}