import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface InventoryUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
  timestamp: string;
}

interface UseRealtimeInventoryOptions {
  vendorId?: string;
  productId?: string;
  onStockUpdate?: (update: InventoryUpdate) => void;
  onAlertTriggered?: (alert: any) => void;
  onMovementRecorded?: (movement: any) => void;
}

export function useRealtimeInventory(options: UseRealtimeInventoryOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<InventoryUpdate | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const handleInventoryChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    const update: InventoryUpdate = {
      type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      table: 'product_inventory',
      record: payload.new,
      old_record: payload.old,
      timestamp: new Date().toISOString()
    };

    setLastUpdate(update);

    if (options.onStockUpdate) {
      options.onStockUpdate(update);
    }
  }, [options]);

  const handleProductChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    const update: InventoryUpdate = {
      type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      table: 'products',
      record: payload.new,
      old_record: payload.old,
      timestamp: new Date().toISOString()
    };

    setLastUpdate(update);

    if (options.onStockUpdate) {
      options.onStockUpdate(update);
    }
  }, [options]);

  const handleVariantChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    const update: InventoryUpdate = {
      type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      table: 'product_variants',
      record: payload.new,
      old_record: payload.old,
      timestamp: new Date().toISOString()
    };

    setLastUpdate(update);

    if (options.onStockUpdate) {
      options.onStockUpdate(update);
    }
  }, [options]);

  const handleAlertChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    if (payload.eventType === 'INSERT' ||
        (payload.eventType === 'UPDATE' && payload.new?.is_active && !payload.old?.is_active)) {
      if (options.onAlertTriggered) {
        options.onAlertTriggered(payload.new);
      }
    }
  }, [options]);

  const handleMovementChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    if (payload.eventType === 'INSERT') {
      if (options.onMovementRecorded) {
        options.onMovementRecorded(payload.new);
      }
    }
  }, [options]);

  useEffect(() => {
    // Create realtime channel
    const channelName = `inventory-${options.vendorId || 'all'}-${Date.now()}`;
    const newChannel = supabase.channel(channelName);

    // Subscribe to product_inventory changes
    let inventorySubscription = newChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'product_inventory',
        filter: options.productId ? `product_id=eq.${options.productId}` : undefined
      },
      handleInventoryChange
    );

    // Subscribe to products table changes
    let productsSubscription = newChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: options.vendorId ? `vendor_id=eq.${options.vendorId}` :
                options.productId ? `id=eq.${options.productId}` : undefined
      },
      handleProductChange
    );

    // Subscribe to product_variants changes
    let variantsSubscription = newChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'product_variants',
        filter: options.productId ? `product_id=eq.${options.productId}` : undefined
      },
      handleVariantChange
    );

    // Subscribe to stock_alerts changes
    let alertsSubscription = newChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stock_alerts',
        filter: options.vendorId ? `vendor_id=eq.${options.vendorId}` :
                options.productId ? `product_id=eq.${options.productId}` : undefined
      },
      handleAlertChange
    );

    // Subscribe to stock_movements changes
    let movementsSubscription = newChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'stock_movements',
        filter: options.productId ? `product_id=eq.${options.productId}` : undefined
      },
      handleMovementChange
    );

    // Subscribe and handle connection status
    newChannel.subscribe((status) => {
      setIsConnected(status === 'SUBSCRIBED');
      console.log('Realtime inventory subscription status:', status);
    });

    setChannel(newChannel);

    // Cleanup on unmount or dependency change
    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [
    options.vendorId,
    options.productId,
    handleInventoryChange,
    handleProductChange,
    handleVariantChange,
    handleAlertChange,
    handleMovementChange
  ]);

  const disconnect = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
      setIsConnected(false);
    }
  }, [channel]);

  const reconnect = useCallback(() => {
    disconnect();
    // The useEffect will automatically create a new connection
  }, [disconnect]);

  return {
    isConnected,
    lastUpdate,
    disconnect,
    reconnect
  };
}

// Hook for real-time stock alerts
export function useRealtimeAlerts(vendorId?: string) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [newAlert, setNewAlert] = useState<any | null>(null);

  useEffect(() => {
    // Fetch initial alerts
    const fetchAlerts = async () => {
      const query = supabase
        .from('stock_alerts')
        .select('*, products(name, sku), product_variants(name, value)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (vendorId) {
        query.eq('vendor_id', vendorId);
      }

      const { data, error } = await query;
      if (!error && data) {
        setAlerts(data);
      }
    };

    fetchAlerts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`alerts-${vendorId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_alerts',
          filter: vendorId ? `vendor_id=eq.${vendorId}` : undefined
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNewAlert(payload.new);
            setAlerts(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAlerts(prev => prev.map(alert =>
              alert.id === payload.new.id ? payload.new : alert
            ));
          } else if (payload.eventType === 'DELETE') {
            setAlerts(prev => prev.filter(alert => alert.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId]);

  return { alerts, newAlert };
}

// Hook for real-time stock movements
export function useRealtimeMovements(productId?: string, limit: number = 10) {
  const [movements, setMovements] = useState<any[]>([]);
  const [latestMovement, setLatestMovement] = useState<any | null>(null);

  useEffect(() => {
    // Fetch initial movements
    const fetchMovements = async () => {
      const query = supabase
        .from('stock_movements')
        .select('*, products(name, sku), product_variants(name, value), users!created_by(email, first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (productId) {
        query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (!error && data) {
        setMovements(data);
      }
    };

    fetchMovements();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`movements-${productId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_movements',
          filter: productId ? `product_id=eq.${productId}` : undefined
        },
        async (payload) => {
          // Fetch complete movement data with relations
          const { data } = await supabase
            .from('stock_movements')
            .select('*, products(name, sku), product_variants(name, value), users!created_by(email, first_name, last_name)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setLatestMovement(data);
            setMovements(prev => [data, ...prev.slice(0, limit - 1)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, limit]);

  return { movements, latestMovement };
}

// Hook for real-time inventory statistics
export function useRealtimeInventoryStats(vendorId?: string) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0
  });

  const calculateStats = useCallback(async () => {
    const query = supabase
      .from('products')
      .select('stock_quantity, low_stock_threshold, price');

    if (vendorId) {
      query.eq('vendor_id', vendorId);
    }

    const { data, error } = await query;

    if (!error && data) {
      const newStats = data.reduce((acc, product) => {
        acc.totalProducts++;
        acc.totalStock += product.stock_quantity || 0;
        acc.totalValue += (product.stock_quantity || 0) * (product.price || 0);

        if (product.stock_quantity === 0) {
          acc.outOfStockCount++;
        } else if (product.stock_quantity <= product.low_stock_threshold) {
          acc.lowStockCount++;
        }

        return acc;
      }, {
        totalProducts: 0,
        totalStock: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalValue: 0
      });

      setStats(newStats);
    }
  }, [vendorId]);

  useEffect(() => {
    // Initial calculation
    calculateStats();

    // Subscribe to changes
    const channel = supabase
      .channel(`inventory-stats-${vendorId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: vendorId ? `vendor_id=eq.${vendorId}` : undefined
        },
        () => {
          // Recalculate on any product change
          calculateStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_inventory'
        },
        () => {
          // Recalculate on any inventory change
          calculateStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, calculateStats]);

  return stats;
}