import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Retrieve stock notifications/alerts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'active';
    const alertType = searchParams.get('alert_type');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('user_id'); // For user-specific alerts

    let query = supabase
      .from('stock_alerts')
      .select(`
        *,
        products!inner(
          id,
          name,
          brand,
          model,
          sku,
          price,
          image_url,
          category
        ),
        stock_levels!left(
          location_name,
          quantity_available,
          reorder_point,
          reorder_quantity
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (alertType) {
      query = query.eq('alert_type', alertType);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error('Error fetching stock alerts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      );
    }

    // Get notification statistics
    const { data: stats } = await supabase
      .from('stock_alerts')
      .select('status, priority, alert_type')
      .eq('status', 'active');

    const statistics = {
      total: alerts?.length || 0,
      active: stats?.length || 0,
      byPriority: {
        high: stats?.filter(s => s.priority === 'high').length || 0,
        medium: stats?.filter(s => s.priority === 'medium').length || 0,
        low: stats?.filter(s => s.priority === 'low').length || 0
      },
      byType: {
        low_stock: stats?.filter(s => s.alert_type === 'low_stock').length || 0,
        out_of_stock: stats?.filter(s => s.alert_type === 'out_of_stock').length || 0,
        reorder_point: stats?.filter(s => s.alert_type === 'reorder_point').length || 0,
        overstock: stats?.filter(s => s.alert_type === 'overstock').length || 0
      }
    };

    return NextResponse.json({
      alerts: alerts || [],
      statistics,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update notification preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      alert_id,
      user_id,
      notification_preferences,
      alert_config
    } = body;

    switch (action) {
      case 'acknowledge':
        return await acknowledgeAlert(alert_id, user_id);

      case 'resolve':
        return await resolveAlert(alert_id, user_id, body.resolution_notes);

      case 'snooze':
        return await snoozeAlert(alert_id, body.snooze_until);

      case 'update_preferences':
        return await updateNotificationPreferences(user_id, notification_preferences);

      case 'create_alert_config':
        return await createAlertConfiguration(alert_config);

      case 'test_notification':
        return await sendTestNotification(user_id, body.notification_type);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in notifications POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
async function acknowledgeAlert(alertId: string, userId: string) {
  const { data, error } = await supabase
    .from('stock_alerts')
    .update({
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to acknowledge alert');
  }

  return NextResponse.json({
    success: true,
    alert: data,
    message: 'Alert acknowledged successfully'
  });
}

async function resolveAlert(alertId: string, userId: string, resolutionNotes?: string) {
  const { data, error } = await supabase
    .from('stock_alerts')
    .update({
      status: 'resolved',
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to resolve alert');
  }

  return NextResponse.json({
    success: true,
    alert: data,
    message: 'Alert resolved successfully'
  });
}

async function snoozeAlert(alertId: string, snoozeUntil: string) {
  const { data, error } = await supabase
    .from('stock_alerts')
    .update({
      snoozed_until: snoozeUntil,
      snooze_count: supabase.raw('COALESCE(snooze_count, 0) + 1'),
      updated_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to snooze alert');
  }

  return NextResponse.json({
    success: true,
    alert: data,
    message: 'Alert snoozed successfully'
  });
}

async function updateNotificationPreferences(userId: string, preferences: any) {
  // In a real app, you'd have a user_notification_preferences table
  // For now, we'll update the user's vendor_settings or create a simple preferences system

  const { data, error } = await supabase
    .from('users')
    .update({
      vendor_settings: {
        ...preferences,
        updated_at: new Date().toISOString()
      }
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update notification preferences');
  }

  return NextResponse.json({
    success: true,
    preferences: data.vendor_settings,
    message: 'Notification preferences updated successfully'
  });
}

async function createAlertConfiguration(config: any) {
  const {
    product_id,
    variant_id,
    alert_type,
    threshold_value,
    notify_email,
    notify_sms,
    notify_webhook,
    notification_recipients
  } = config;

  const { data, error } = await supabase
    .from('stock_alerts')
    .upsert({
      product_id,
      variant_id,
      alert_type,
      threshold_value,
      notify_email: notify_email || false,
      notify_sms: notify_sms || false,
      notify_webhook: notify_webhook || false,
      notification_recipients: notification_recipients || [],
      status: 'active',
      priority: 'medium'
    }, {
      onConflict: 'product_id,variant_id,alert_type',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create alert configuration');
  }

  return NextResponse.json({
    success: true,
    config: data,
    message: 'Alert configuration created successfully'
  });
}

async function sendTestNotification(userId: string, notificationType: string) {
  // This would integrate with your email service (e.g., Resend, SendGrid)
  // For now, we'll just log the test notification

  console.log(`Test notification sent to user ${userId} via ${notificationType}`);

  // In a real implementation, you'd:
  // 1. Get user email/phone from database
  // 2. Send actual notification via chosen service
  // 3. Log the notification attempt

  return NextResponse.json({
    success: true,
    message: `Test ${notificationType} notification sent successfully`
  });
}

// DELETE - Remove/disable notification
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const alertId = searchParams.get('alert_id');

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('stock_alerts')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to cancel alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Alert cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}