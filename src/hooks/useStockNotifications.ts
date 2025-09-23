'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface StockAlert {
  id: string;
  product_id: string;
  variant_id?: string;
  stock_level_id?: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'reorder_point' | 'overstock';
  threshold_value?: number;
  current_value?: number;
  status: 'active' | 'acknowledged' | 'resolved' | 'snoozed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  notify_email: boolean;
  notify_sms: boolean;
  notify_webhook: boolean;
  notification_sent_at?: string;
  notification_recipients?: string[];
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  snoozed_until?: string;
  snooze_count?: number;
  created_at: string;
  updated_at: string;
  products: {
    id: string;
    name: string;
    brand: string;
    model: string;
    sku: string;
    price: number;
    original_image_urls?: any;
    category_id: string;
  };
  stock_levels?: {
    location_name: string;
    quantity_available: number;
    reorder_point: number;
    reorder_quantity: number;
  };
}

export interface NotificationStatistics {
  total: number;
  active: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  byType: {
    low_stock: number;
    out_of_stock: number;
    reorder_point: number;
    overstock: number;
  };
}

export interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  webhook_enabled: boolean;
  email_frequency: 'immediate' | 'hourly' | 'daily';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  alert_types: {
    low_stock: boolean;
    out_of_stock: boolean;
    reorder_point: boolean;
    overstock: boolean;
  };
  minimum_priority: 'low' | 'medium' | 'high';
}

export interface UseStockNotificationsOptions {
  status?: string;
  alertType?: string;
  priority?: string;
  limit?: number;
  userId?: string;
  refreshInterval?: number;
  enableRealtime?: boolean;
}

export function useStockNotifications(options: UseStockNotificationsOptions = {}) {
  const {
    status = 'active',
    alertType,
    priority,
    limit = 50,
    userId,
    refreshInterval = 60000, // 1 minute
    enableRealtime = true
  } = options;

  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [statistics, setStatistics] = useState<NotificationStatistics | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (alertType) params.append('alert_type', alertType);
      if (priority) params.append('priority', priority);
      if (limit) params.append('limit', limit.toString());
      if (userId) params.append('user_id', userId);

      const response = await fetch(`/api/inventory/notifications?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAlerts(data.alerts);
      setStatistics(data.statistics);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [status, alertType, priority, limit, userId]);

  // Acknowledge an alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch('/api/inventory/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'acknowledge',
          alert_id: alertId,
          user_id: userId || 'current_user'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      await fetchNotifications(); // Refresh data
      return result;
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      throw err;
    }
  }, [userId, fetchNotifications]);

  // Resolve an alert
  const resolveAlert = useCallback(async (alertId: string, resolutionNotes?: string) => {
    try {
      const response = await fetch('/api/inventory/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resolve',
          alert_id: alertId,
          user_id: userId || 'current_user',
          resolution_notes: resolutionNotes
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      await fetchNotifications(); // Refresh data
      return result;
    } catch (err) {
      console.error('Error resolving alert:', err);
      throw err;
    }
  }, [userId, fetchNotifications]);

  // Snooze an alert
  const snoozeAlert = useCallback(async (alertId: string, snoozeUntil: Date) => {
    try {
      const response = await fetch('/api/inventory/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'snooze',
          alert_id: alertId,
          snooze_until: snoozeUntil.toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      await fetchNotifications(); // Refresh data
      return result;
    } catch (err) {
      console.error('Error snoozing alert:', err);
      throw err;
    }
  }, [fetchNotifications]);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const response = await fetch('/api/inventory/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_preferences',
          user_id: userId || 'current_user',
          notification_preferences: newPreferences
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setPreferences(result.preferences);
      return result;
    } catch (err) {
      console.error('Error updating preferences:', err);
      throw err;
    }
  }, [userId]);

  // Create alert configuration
  const createAlertConfig = useCallback(async (config: {
    product_id: string;
    variant_id?: string;
    alert_type: string;
    threshold_value: number;
    notify_email?: boolean;
    notify_sms?: boolean;
    notify_webhook?: boolean;
    notification_recipients?: string[];
  }) => {
    try {
      const response = await fetch('/api/inventory/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_alert_config',
          alert_config: config
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      await fetchNotifications(); // Refresh data
      return result;
    } catch (err) {
      console.error('Error creating alert configuration:', err);
      throw err;
    }
  }, [fetchNotifications]);

  // Send test notification
  const sendTestNotification = useCallback(async (notificationType: 'email' | 'sms' | 'webhook') => {
    try {
      const response = await fetch('/api/inventory/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_notification',
          user_id: userId || 'current_user',
          notification_type: notificationType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error sending test notification:', err);
      throw err;
    }
  }, [userId]);

  // Cancel/delete an alert
  const cancelAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`/api/inventory/notifications?alert_id=${alertId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      await fetchNotifications(); // Refresh data
      return result;
    } catch (err) {
      console.error('Error cancelling alert:', err);
      throw err;
    }
  }, [fetchNotifications]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    const alertsSubscription = supabase
      .channel('stock_alerts_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_alerts'
        },
        (payload) => {
          console.log('Stock alerts changed:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    subscriptionRef.current = alertsSubscription;

    return () => {
      alertsSubscription.unsubscribe();
    };
  }, [enableRealtime, fetchNotifications]);

  // Set up polling
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchNotifications, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchNotifications, refreshInterval]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    return fetchNotifications();
  }, [fetchNotifications]);

  // Helper functions
  const getUnreadCount = useCallback(() => {
    return alerts.filter(alert =>
      alert.status === 'active' && !alert.acknowledged_at
    ).length;
  }, [alerts]);

  const getHighPriorityCount = useCallback(() => {
    return alerts.filter(alert =>
      alert.status === 'active' && alert.priority === 'high'
    ).length;
  }, [alerts]);

  const getAlertsByType = useCallback((type: string) => {
    return alerts.filter(alert => alert.alert_type === type);
  }, [alerts]);

  const getAlertsByPriority = useCallback((priorityLevel: string) => {
    return alerts.filter(alert => alert.priority === priorityLevel);
  }, [alerts]);

  return {
    alerts,
    statistics,
    preferences,
    loading,
    error,
    lastUpdate,
    refetch,
    acknowledgeAlert,
    resolveAlert,
    snoozeAlert,
    updatePreferences,
    createAlertConfig,
    sendTestNotification,
    cancelAlert,
    // Helper functions
    getUnreadCount,
    getHighPriorityCount,
    getAlertsByType,
    getAlertsByPriority,
    // Status checkers
    isActive: useCallback((alert: StockAlert) => alert.status === 'active', []),
    isAcknowledged: useCallback((alert: StockAlert) => !!alert.acknowledged_at, []),
    isResolved: useCallback((alert: StockAlert) => alert.status === 'resolved', []),
    isSnoozed: useCallback((alert: StockAlert) =>
      alert.snoozed_until && new Date(alert.snoozed_until) > new Date(), []
    )
  };
}