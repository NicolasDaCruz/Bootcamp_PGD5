'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProductVariantStock {
  id: string;
  name: string;
  value: string;
  size: string;
  eu_size?: number;
  us_size?: number;
  uk_size?: number;
  size_display: string;
  sku: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_stock: number;
  price: number;
  price_adjustment: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  is_active: boolean;
  low_stock_threshold: number;
}

export interface ProductStockSummary {
  product_id: string;
  product_name: string;
  brand: string;
  base_price: number;
  low_stock_threshold: number;
  vendor_id?: string;
  total_variants: number;
  total_stock: number;
  total_available: number;
  total_reserved: number;
  in_stock_variants: number;
  low_stock_variants: number;
  out_of_stock_variants: number;
  overall_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  variants: ProductVariantStock[];
}

export interface UseProductStockOptions {
  productId: string;
  sizeOnly?: boolean;
  enableRealtime?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function useProductStock(options: UseProductStockOptions) {
  const {
    productId,
    sizeOnly = true,
    enableRealtime = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [stockData, setStockData] = useState<ProductStockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchProductStock = useCallback(async () => {
    if (!productId) return;

    try {
      setError(null);

      const params = new URLSearchParams();
      if (sizeOnly) params.append('size_only', 'true');

      const response = await fetch(`/api/products/${productId}/stock?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch product stock: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch product stock');
      }

      setStockData(result.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching product stock:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch product stock');
      setStockData(null);
    } finally {
      setLoading(false);
    }
  }, [productId, sizeOnly]);

  // Update variant stock
  const updateVariantStock = useCallback(async (
    variantId: string,
    newStock: number,
    reason: string = 'manual_adjustment'
  ) => {
    try {
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variant_id: variantId,
          new_stock: newStock,
          reason
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update stock: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update stock');
      }

      // Refresh data after successful update
      await fetchProductStock();

      return result.data;
    } catch (err) {
      console.error('Error updating variant stock:', err);
      throw err;
    }
  }, [productId, fetchProductStock]);

  // Set up real-time subscriptions for product variants and stock levels
  useEffect(() => {
    if (!enableRealtime || !productId) return;

    const subscription = supabase
      .channel(`product_stock_${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_variants',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          console.log('📦 Product variant stock changed:', payload);
          // Refresh data when variant stock changes
          fetchProductStock();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_levels'
        },
        (payload) => {
          console.log('📊 Stock levels changed:', payload);
          // Only refresh if this affects our product variants
          if (stockData?.variants.some(v => v.id === payload.new?.product_variant_id || v.id === payload.old?.product_variant_id)) {
            fetchProductStock();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [enableRealtime, productId, fetchProductStock, stockData]);

  // Set up periodic refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(fetchProductStock, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [fetchProductStock, refreshInterval]);

  // Initial data fetch
  useEffect(() => {
    fetchProductStock();
  }, [fetchProductStock]);

  // Helper functions
  const getVariantBySize = useCallback((sizeDisplay: string) => {
    if (!stockData) return null;

    return stockData.variants.find(variant =>
      variant.size_display === sizeDisplay ||
      variant.size === sizeDisplay ||
      variant.size_display.includes(sizeDisplay)
    );
  }, [stockData]);

  const isVariantAvailable = useCallback((variantId: string) => {
    if (!stockData) return false;

    const variant = stockData.variants.find(v => v.id === variantId);
    return variant ? variant.available_stock > 0 : false;
  }, [stockData]);

  const getStockStatus = useCallback((variantId: string) => {
    if (!stockData) return 'out_of_stock';

    const variant = stockData.variants.find(v => v.id === variantId);
    return variant ? variant.status : 'out_of_stock';
  }, [stockData]);

  const getAvailableStock = useCallback((variantId: string) => {
    if (!stockData) return 0;

    const variant = stockData.variants.find(v => v.id === variantId);
    return variant ? variant.available_stock : 0;
  }, [stockData]);

  const getStockMessage = useCallback((variantId: string) => {
    if (!stockData) return 'Stock information unavailable';

    const variant = stockData.variants.find(v => v.id === variantId);
    if (!variant) return 'Variant not found';

    if (variant.available_stock === 0) {
      return 'Out of Stock';
    } else if (variant.status === 'low_stock') {
      return `Only ${variant.available_stock} left`;
    } else {
      return `${variant.available_stock} available`;
    }
  }, [stockData]);

  const getSortedVariants = useCallback(() => {
    if (!stockData) return [];

    return [...stockData.variants].sort((a, b) => {
      // Sort by EU size if available, otherwise by US size or value
      if (a.eu_size && b.eu_size) {
        return Number(a.eu_size) - Number(b.eu_size);
      }
      if (a.us_size && b.us_size) {
        return Number(a.us_size) - Number(b.us_size);
      }
      return (a.value || '').localeCompare(b.value || '');
    });
  }, [stockData]);

  const refetch = useCallback(() => {
    setLoading(true);
    return fetchProductStock();
  }, [fetchProductStock]);

  return {
    stockData,
    variants: stockData?.variants || [],
    loading,
    error,
    lastUpdate,
    refetch,
    updateVariantStock,

    // Helper functions
    getVariantBySize,
    isVariantAvailable,
    getStockStatus,
    getAvailableStock,
    getStockMessage,
    getSortedVariants,

    // Quick access to summary data
    totalStock: stockData?.total_stock || 0,
    totalAvailable: stockData?.total_available || 0,
    overallStatus: stockData?.overall_status || 'out_of_stock',
    lowStockThreshold: stockData?.low_stock_threshold || 5,
    inStockCount: stockData?.in_stock_variants || 0,
    lowStockCount: stockData?.low_stock_variants || 0,
    outOfStockCount: stockData?.out_of_stock_variants || 0
  };
}