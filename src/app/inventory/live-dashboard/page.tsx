'use client';

import React, { useState } from 'react';
import { useRealTimeStock, StockLevel } from '@/hooks/useRealTimeStock';
import {
  BarChart,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Filter,
  RefreshCw,
  Eye,
  Edit3,
  Plus,
  Minus
} from 'lucide-react';

interface StockDashboardProps {
  locationId?: string;
}

export default function LiveStockDashboard({ locationId }: StockDashboardProps) {
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>(locationId || '');
  const [selectedProduct, setSelectedProduct] = useState<StockLevel | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');

  const {
    data,
    loading,
    error,
    lastUpdate,
    refetch,
    updateStockLevel,
    isLowStock,
    isOutOfStock,
    getStockStatus,
    getActiveAlerts
  } = useRealTimeStock({
    locationId: selectedLocation || undefined,
    lowStockOnly: showLowStockOnly,
    limit: 100,
    refreshInterval: 15000, // 15 seconds
    enableRealtime: true
  });

  const handleStockAdjustment = async (stockLevelId: string, quantityChange: number, reason: string) => {
    try {
      await updateStockLevel(
        stockLevelId,
        quantityChange,
        quantityChange > 0 ? 'adjustment_in' : 'adjustment_out',
        reason,
        'current_user' // In real app, get from auth context
      );
      setEditMode(false);
      setSelectedProduct(null);
      setAdjustmentQuantity(0);
      setAdjustmentReason('');
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert('Failed to update stock level');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-200';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high_stock': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading real-time inventory data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center space-x-2 text-red-600 mb-4">
            <AlertTriangle className="h-6 w-6" />
            <span className="font-semibold">Error Loading Data</span>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const locations = data?.locationStats?.byLocation ? Object.keys(data.locationStats.byLocation) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Live Inventory Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Last updated: {lastUpdate?.toLocaleTimeString() || 'Never'}
                  {loading && <span className="ml-2 text-blue-600">• Updating...</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Filters */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>

                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showLowStockOnly}
                    onChange={(e) => setShowLowStockOnly(e.target.checked)}
                    className="rounded"
                  />
                  <span>Low Stock Only</span>
                </label>
              </div>

              <button
                onClick={refetch}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{data?.metrics.totalProducts || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock Items</p>
                <p className="text-2xl font-bold text-yellow-600">{data?.metrics.lowStockItems || 0}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{data?.metrics.outOfStockItems || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(data?.metrics.totalValue || 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Alerts</p>
                <p className="text-2xl font-bold text-orange-600">{data?.metrics.activeAlerts || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Location Stats */}
        {data?.locationStats?.byLocation && Object.keys(data.locationStats.byLocation).length > 1 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(data.locationStats.byLocation).map(([location, stats]) => (
                <div key={location} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-gray-900 mb-2">{location}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Items:</span>
                      <span className="font-medium">{stats.totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Value:</span>
                      <span className="font-medium">${stats.totalValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Low Stock:</span>
                      <span className="font-medium text-yellow-600">{stats.lowStockItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Out of Stock:</span>
                      <span className="font-medium text-red-600">{stats.outOfStockItems}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock Levels Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Current Stock Levels</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reserved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Point
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alerts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.stockLevels?.map((item) => {
                  const status = getStockStatus(item);
                  const alerts = getActiveAlerts(item);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded object-cover"
                              src={
                                (item.products.original_image_urls &&
                                 Array.isArray(item.products.original_image_urls) &&
                                 item.products.original_image_urls.length > 0)
                                ? item.products.original_image_urls[0]
                                : '/placeholder-product.jpg'
                              }
                              alt={item.products.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.products.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              SKU: {item.products.sku}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.location_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.quantity_available}
                        </div>
                        <div className="text-xs text-gray-500">
                          On hand: {item.quantity_on_hand}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity_reserved}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.reorder_point}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {alerts.length > 0 ? (
                          <div className="space-y-1">
                            {alerts.slice(0, 2).map((alert, index) => (
                              <div key={index} className={`text-xs ${getPriorityColor(alert.priority)}`}>
                                {alert.alert_type.replace('_', ' ')}
                              </div>
                            ))}
                            {alerts.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{alerts.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedProduct(item)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(item);
                              setEditMode(true);
                            }}
                            className="text-green-600 hover:text-green-800"
                            title="Adjust stock"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(!data?.stockLevels || data.stockLevels.length === 0) && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No stock levels found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {showLowStockOnly
                  ? 'No low stock items in the selected location.'
                  : 'No stock levels available for the selected filters.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {data?.recentMovements && data.recentMovements.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Recent Stock Movements</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {data.recentMovements.slice(0, 5).map((movement) => (
                <div key={movement.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      movement.movement_type.includes('in') ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {movement.movement_type.includes('in') ? (
                        <Plus className="h-4 w-4 text-green-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {movement.products.name} (SKU: {movement.products.sku})
                      </p>
                      <p className="text-sm text-gray-500">
                        {movement.movement_type} • {movement.quantity} units • {movement.stock_levels.location_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(movement.movement_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(movement.movement_date).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && editMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Adjust Stock Level</h3>
              <button
                onClick={() => {
                  setEditMode(false);
                  setSelectedProduct(null);
                  setAdjustmentQuantity(0);
                  setAdjustmentReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">{selectedProduct.products.name}</p>
                <p className="text-sm text-gray-500">Current: {selectedProduct.quantity_available} available</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Adjustment
                </label>
                <input
                  type="number"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter positive or negative number"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Positive numbers add stock, negative numbers reduce stock
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Manual count, Damaged goods, etc."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setEditMode(false);
                    setSelectedProduct(null);
                    setAdjustmentQuantity(0);
                    setAdjustmentReason('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStockAdjustment(selectedProduct.id, adjustmentQuantity, adjustmentReason)}
                  disabled={!adjustmentQuantity || !adjustmentReason}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}