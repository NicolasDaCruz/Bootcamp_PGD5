'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRealtimeAlerts, useRealtimeInventoryStats } from '@/hooks/useRealtimeInventory';
import { supabase } from '@/lib/supabase';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  Bell,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';

interface StockAlert {
  id: string;
  product_name: string;
  variant_name?: string;
  alert_type: string;
  current_stock: number;
  threshold_value: number;
  last_triggered: string;
  is_active: boolean;
  price?: number;
}

interface StockMovement {
  id: string;
  created_at: string;
  product_name: string;
  variant_name?: string;
  movement_type: string;
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  notes?: string;
  created_by?: {
    name: string;
    email: string;
  };
}

interface InventoryStats {
  totalSKUs: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
  totalUnits: number;
  potentialLostRevenue: number;
}

export default function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [stats, setStats] = useState<InventoryStats>({
    totalSKUs: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    totalUnits: 0,
    potentialLostRevenue: 0
  });
  const [selectedAlertType, setSelectedAlertType] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');

  // State for local data
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Use real-time hooks
  const { alerts: realtimeAlerts, newAlert } = useRealtimeAlerts(vendorId || undefined);
  const realtimeStats = useRealtimeInventoryStats(vendorId || undefined);

  // Combine real-time and fetched data
  const allAlerts = realtimeAlerts.length > 0 ? realtimeAlerts : alerts;
  const allMovements = movements; // Use API-fetched movements only

  // Filter alerts based on selected type
  const filteredAlerts = allAlerts.filter(alert => {
    if (selectedAlertType === 'all') return true;
    return alert.alert_type === selectedAlertType;
  });

  // Fetch inventory statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory/stock');
      if (!response.ok) throw new Error('Failed to fetch inventory stats');

      const data = await response.json();

      if (data.success && data.stats) {
        const apiStats = data.stats;
        const stats: InventoryStats = {
          totalSKUs: apiStats.total || 0,
          inStock: apiStats.in_stock || 0,
          lowStock: apiStats.low_stock || 0,
          outOfStock: apiStats.out_of_stock || 0,
          totalValue: apiStats.total_value || 0,
          totalUnits: apiStats.total_units || 0,
          potentialLostRevenue: (apiStats.out_of_stock || 0) * 100 // Estimate $100 lost per out of stock item
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Fetch active alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (selectedAlertType !== 'all') {
        params.append('type', selectedAlertType);
      }

      const response = await fetch(`/api/inventory/alerts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch alerts');

      const data = await response.json();
      if (data.success) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, [selectedAlertType]);

  // Fetch recent movements
  const fetchMovements = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory/movements?limit=10');
      if (!response.ok) throw new Error('Failed to fetch movements');

      const data = await response.json();
      if (data.success) {
        setMovements(data.movements || []);
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  }, []);

  // Fetch all data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchAlerts(),
      fetchMovements()
    ]);
    setLoading(false);
  }, [fetchStats, fetchAlerts, fetchMovements]);

  // Initial load and set up refresh
  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchDashboardData]);

  // Handle alert resolution
  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/inventory/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, isActive: false, resolved: true })
      });

      if (!response.ok) throw new Error('Failed to resolve alert');

      // Refresh alerts
      await fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Get movement type color
  const getMovementColor = (type: string, change: number) => {
    if (type === 'sale') return 'text-blue-600';
    if (type === 'restock' || change > 0) return 'text-green-600';
    if (type === 'adjustment' && change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Get alert severity color
  const getAlertColor = (type: string) => {
    if (type === 'out_of_stock') return 'bg-red-100 text-red-800 border-red-200';
    if (type === 'low_stock') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Overview</h2>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <Package className="w-8 h-8 text-gray-400" />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalSKUs}</p>
          <p className="text-xs text-gray-500">SKUs</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <span className="text-xs text-green-600">Available</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.inStock}</p>
          <p className="text-xs text-gray-500">In Stock</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
            <span className="text-xs text-yellow-600">Warning</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.lowStock}</p>
          <p className="text-xs text-gray-500">Low Stock</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <TrendingDown className="w-8 h-8 text-red-400" />
            <span className="text-xs text-red-600">Critical</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.outOfStock}</p>
          <p className="text-xs text-gray-500">Out of Stock</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <Package className="w-8 h-8 text-blue-400" />
            <span className="text-xs text-blue-600">Units</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats.totalUnits.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Total Stock</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <DollarSign className="w-8 h-8 text-green-400" />
            <span className="text-xs text-green-600">Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${(stats.totalValue / 1000).toFixed(1)}k
          </p>
          <p className="text-xs text-gray-500">Inventory Value</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <TrendingDown className="w-8 h-8 text-red-400" />
            <span className="text-xs text-red-600">Lost</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${(stats.potentialLostRevenue / 1000).toFixed(1)}k
          </p>
          <p className="text-xs text-gray-500">Potential Loss</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  {filteredAlerts.length}
                </span>
              </div>
              <select
                value={selectedAlertType}
                onChange={(e) => setSelectedAlertType(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1"
              >
                <option value="all">All Alerts</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading alerts...</div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <p>No active alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${getAlertColor(alert.alert_type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{alert.product_name}</h4>
                        {alert.variant_name && (
                          <p className="text-xs opacity-75">{alert.variant_name}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs">
                            Stock: {alert.current_stock} / {alert.threshold_value}
                          </span>
                          <span className="text-xs opacity-75">
                            {formatDate(alert.last_triggered)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
                        title="Resolve alert"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Movements</h3>
            </div>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading movements...</div>
            ) : allMovements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No recent movements</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allMovements.map(movement => (
                  <div key={movement.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                    <div className={`mt-1 ${getMovementColor(movement.movement_type, movement.quantity_change)}`}>
                      {movement.quantity_change > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {movement.product_name}
                          </p>
                          {movement.variant_name && (
                            <p className="text-xs text-gray-500">{movement.variant_name}</p>
                          )}
                          <p className="text-xs text-gray-600 mt-1">
                            {movement.movement_type.replace('_', ' ')}:
                            <span className={`font-medium ml-1 ${
                              movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                            </span>
                            <span className="text-gray-500 ml-2">
                              ({movement.previous_stock} → {movement.new_stock})
                            </span>
                          </p>
                          {movement.notes && (
                            <p className="text-xs text-gray-500 mt-1">{movement.notes}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(movement.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Quick Inventory Actions</h3>
            <p className="text-xs text-gray-600 mt-1">
              Manage your inventory efficiently with these quick actions
            </p>
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 bg-white text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              View Full Inventory
            </button>
            <button className="px-3 py-1.5 bg-white text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Export Report
            </button>
            <button className="px-3 py-1.5 bg-blue-600 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition-colors">
              Bulk Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}