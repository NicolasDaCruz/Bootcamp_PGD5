'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface StockLevel {
  id: string;
  product_id: string;
  variant_id?: string;
  location_id?: string;
  location_name: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  quantity_incoming: number;
  reorder_point: number;
  reorder_quantity: number;
  maximum_stock: number;
  total_value: number;
  last_restock_date?: string;
  last_sale_date?: string;
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
    is_active: boolean;
  };
  stock_alerts?: Array<{
    id: string;
    alert_type: string;
    status: string;
    priority: string;
    current_value: number;
    threshold_value: number;
    created_at: string;
  }>;
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string;
  movement_date: string;
  created_at: string;
  products: {
    name: string;
    sku: string;
  };
  stock_levels: {
    location_name: string;
  };
}

export interface StockReservation {
  id: string;
  product_id: string;
  quantity: number;
  reservation_type: string;
  status: string;
  expires_at: string;
  created_at: string;
  products: {
    name: string;
    sku: string;
  };
}

export interface StockMetrics {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  activeAlerts: number;
  lastUpdated: string;
}

export interface LiveStockData {
  metrics: StockMetrics;
  stockLevels: StockLevel[];
  recentMovements: StockMovement[];
  pendingReservations: StockReservation[];
  locationStats: {
    byLocation: Record<string, {
      totalItems: number;
      totalValue: number;
      lowStockItems: number;
      outOfStockItems: number;
    }>;
  };
}

export interface UseRealTimeStockOptions {
  locationId?: string;
  lowStockOnly?: boolean;
  limit?: number;
  refreshInterval?: number; // in milliseconds
  enableRealtime?: boolean;
}

export function useRealTimeStock(options: UseRealTimeStockOptions = {}) {
  const {
    locationId,
    lowStockOnly = false,
    limit = 50,
    refreshInterval = 30000, // 30 seconds
    enableRealtime = true
  } = options;

  const [data, setData] = useState<LiveStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);

  const fetchStockData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (locationId) params.append('location_id', locationId);
      if (lowStockOnly) params.append('low_stock', 'true');
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`/api/inventory/live-dashboard?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const stockData = await response.json();
      setData(stockData);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  }, [locationId, lowStockOnly, limit]);

  // Update stock level directly
  const updateStockLevel = useCallback(async (
    stockLevelId: string,
    quantityChange: number,
    movementType: string,
    reason?: string,
    performedBy?: string
  ) => {
    try {
      const response = await fetch('/api/inventory/live-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock_level_id: stockLevelId,
          quantity_change: quantityChange,
          movement_type: movementType,
          reason,
          performed_by: performedBy
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Refresh data after successful update
      await fetchStockData();

      return result;
    } catch (err) {
      console.error('Error updating stock level:', err);
      throw err;
    }
  }, [fetchStockData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    // Subscribe to stock_levels changes
    const stockLevelsSubscription = supabase
      .channel('stock_levels_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_levels'
        },
        (payload) => {
          console.log('Stock levels changed:', payload);
          // Refresh data when stock levels change
          fetchStockData();
        }
      )
      .subscribe();

    // Subscribe to stock_movements for activity feed
    const movementsSubscription = supabase
      .channel('stock_movements_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_movements'
        },
        (payload) => {
          console.log('New stock movement:', payload);
          // Refresh data when new movements occur
          fetchStockData();
        }
      )
      .subscribe();

    // Subscribe to stock_alerts
    const alertsSubscription = supabase
      .channel('stock_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_alerts'
        },
        (payload) => {
          console.log('Stock alerts changed:', payload);
          // Refresh data when alerts change
          fetchStockData();
        }
      )
      .subscribe();

    subscriptionRef.current = {
      stockLevelsSubscription,
      movementsSubscription,
      alertsSubscription
    };

    return () => {
      stockLevelsSubscription.unsubscribe();
      movementsSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
    };
  }, [enableRealtime, fetchStockData]);

  // Set up polling fallback
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchStockData, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchStockData, refreshInterval]);

  // Initial data fetch
  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (subscriptionRef.current) {
        Object.values(subscriptionRef.current).forEach((sub: any) => {
          if (sub && typeof sub.unsubscribe === 'function') {
            sub.unsubscribe();
          }
        });
      }
    };
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    return fetchStockData();
  }, [fetchStockData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refetch,
    updateStockLevel,
    // Helper functions for common operations
    isLowStock: useCallback((item: StockLevel) =>
      item.quantity_available <= (item.reorder_point || 10), []
    ),
    isOutOfStock: useCallback((item: StockLevel) =>
      item.quantity_available <= 0, []
    ),
    getStockStatus: useCallback((item: StockLevel) => {
      if (item.quantity_available <= 0) return 'out_of_stock';
      if (item.quantity_available <= (item.reorder_point || 10)) return 'low_stock';
      if (item.quantity_available >= (item.maximum_stock || 500) * 0.9) return 'high_stock';
      return 'normal';
    }, []),
    getActiveAlerts: useCallback((item: StockLevel) =>
      item.stock_alerts?.filter(alert => alert.status === 'active') || [], []
    )
  };
}