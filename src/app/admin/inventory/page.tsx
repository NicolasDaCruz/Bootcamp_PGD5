'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  ArrowLeft,
  BarChart3,
  Download
} from 'lucide-react';
import StockManagementDashboard from '@/components/admin/StockManagementDashboard';

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  product_brand: string;
  sku: string;
  variant_name?: string;
  eu_size?: number;
  us_size?: number;
  size_display?: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_point: number;
  price: number;
  last_updated: string;
}

interface StockAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'discrepancy';
  product_name: string;
  variant_name?: string;
  current_stock: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export default function AdminInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [showStockMovements, setShowStockMovements] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');


  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to access inventory management');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin' || profile?.email?.includes('admin')) {
        setIsAdmin(true);
        await loadInventoryData();
      } else {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);

      // Load inventory with product information
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select(`
          id,
          sku,
          name,
          eu_size,
          us_size,
          stock_quantity,
          reserved_quantity,
          price_adjustment,
          updated_at,
          product_id,
          products!inner (
            id,
            name,
            brand,
            price,
            low_stock_threshold
          )
        `)
        .eq('variant_type', 'size')
        .order('stock_quantity', { ascending: true });

      if (variantsError) throw variantsError;

      // Transform data
      const inventoryItems: InventoryItem[] = (variants || []).map((variant) => {
        const sizeDisplay = variant.eu_size ? `EU ${variant.eu_size}` :
                           variant.us_size ? `US ${variant.us_size}` :
                           variant.name || 'Default';

        return {
          id: variant.id,
          product_id: variant.product_id,
          product_name: variant.products.name,
          product_brand: variant.products.brand,
          sku: variant.sku,
          variant_name: variant.name,
          eu_size: variant.eu_size,
          us_size: variant.us_size,
          size_display: sizeDisplay,
          stock_quantity: variant.stock_quantity || 0,
          reserved_quantity: variant.reserved_quantity || 0,
          available_quantity: (variant.stock_quantity || 0) - (variant.reserved_quantity || 0),
          reorder_point: variant.products.low_stock_threshold || 10,
          price: variant.products.price + (variant.price_adjustment || 0),
          last_updated: variant.updated_at
        };
      });

      setInventory(inventoryItems);

      // Generate alerts based on inventory levels
      const stockAlerts: StockAlert[] = inventoryItems
        .filter(item =>
          item.stock_quantity <= item.reorder_point ||
          item.stock_quantity === 0
        )
        .map(item => ({
          id: item.id,
          type: item.stock_quantity === 0 ? 'out_of_stock' : 'low_stock',
          product_name: item.product_name,
          variant_name: item.size_display,
          current_stock: item.stock_quantity,
          threshold: item.reorder_point,
          severity: item.stock_quantity === 0 ? 'critical' :
                   item.stock_quantity <= item.reorder_point / 2 ? 'high' : 'medium',
          created_at: new Date().toISOString()
        }));

      setAlerts(stockAlerts);

    } catch (err) {
      console.error('Error loading inventory:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async () => {
    if (!selectedItem || adjustmentQuantity === 0) return;

    try {
      const newStock = selectedItem.stock_quantity + adjustmentQuantity;

      // Update stock in database
      const { error } = await supabase
        .from('product_variants')
        .update({
          stock_quantity: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      // Update local state
      setInventory(inventory.map(item =>
        item.id === selectedItem.id
          ? {
              ...item,
              stock_quantity: newStock,
              available_quantity: newStock - item.reserved_quantity,
              last_updated: new Date().toISOString()
            }
          : item
      ));

      // Close modal
      setShowAdjustModal(false);
      setSelectedItem(null);
      setAdjustmentQuantity(0);
      setAdjustmentReason('');

      // Reload alerts
      await loadInventoryData();

    } catch (err) {
      console.error('Error adjusting stock:', err);
      alert('Failed to adjust stock');
    }
  };

  const exportInventory = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalItems: inventory.length,
      lowStockItems: alerts.filter(a => a.type === 'low_stock').length,
      outOfStockItems: alerts.filter(a => a.type === 'out_of_stock').length,
      inventory: inventory.map(item => ({
        sku: item.sku,
        product_name: item.product_name,
        brand: item.product_brand,
        size: item.size_display,
        stock_quantity: item.stock_quantity,
        available_quantity: item.available_quantity,
        reserved_quantity: item.reserved_quantity,
        reorder_point: item.reorder_point,
        price: item.price
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock_quantity === 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (item.stock_quantity <= item.reorder_point) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else if (item.stock_quantity >= 50) { // High stock threshold
      return { status: 'High Stock', color: 'bg-blue-100 text-blue-800' };
    }
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = !searchTerm ||
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.size_display && item.size_display.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || categoryFilter === 'sneakers'; // All are sneakers for now

    return matchesSearch && matchesCategory;
  });

  const filteredAlerts = alerts.filter(alert => {
    return alertFilter === 'all' || alert.type === alertFilter;
  });

  if (!isAdmin && error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (showStockMovements) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => setShowStockMovements(false)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Inventory</span>
            </button>
          </div>
          <StockManagementDashboard />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                <p className="text-gray-600 mt-1">Manage stock levels by product size</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowStockMovements(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Stock Movements</span>
              </button>
              <button
                onClick={exportInventory}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Variants</p>
                <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.filter(a => a.type === 'low_stock').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <TrendingDown className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.filter(a => a.type === 'out_of_stock').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${inventory.reduce((sum, item) => sum + (item.stock_quantity * item.price), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Stock Alerts</h2>
              <select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Alerts</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAlerts.slice(0, 6).map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${getAlertSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{alert.product_name}</p>
                      {alert.variant_name && (
                        <p className="text-sm opacity-75">{alert.variant_name}</p>
                      )}
                      <p className="text-sm">
                        Current: {alert.current_stock} | Threshold: {alert.threshold}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium uppercase">{alert.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Inventory
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Product name, SKU, brand, or size..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="sneakers">Sneakers</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadInventoryData}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const { status, color } = getStockStatus(item);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                          <div className="text-sm text-gray-500">
                            {item.product_brand}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {item.size_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {item.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Available: {item.available_quantity}</div>
                          <div className="text-xs text-gray-500">
                            Total: {item.stock_quantity} | Reserved: {item.reserved_quantity}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(item.stock_quantity * item.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.last_updated).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowAdjustModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No inventory items found</p>
            </div>
          )}
        </div>

        {/* Stock Adjustment Modal */}
        {showAdjustModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Adjust Stock by Size</h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{selectedItem.product_name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedItem.size_display} • SKU: {selectedItem.sku}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Current Stock: {selectedItem.stock_quantity}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adjustment Quantity
                    </label>
                    <input
                      type="number"
                      value={adjustmentQuantity}
                      onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter positive to add, negative to reduce"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      New stock will be: {selectedItem.stock_quantity + adjustmentQuantity}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason (Optional)
                    </label>
                    <input
                      type="text"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Reason for adjustment"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowAdjustModal(false);
                        setSelectedItem(null);
                        setAdjustmentQuantity(0);
                        setAdjustmentReason('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStockAdjustment}
                      disabled={adjustmentQuantity === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Adjust Stock
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}