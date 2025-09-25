'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  Download,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  Database,
  Loader2
} from 'lucide-react';

// TypeScript interfaces
interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  eu_size?: number;
  us_size?: number;
  stock_quantity: number;
  reserved_quantity: number;
  computed_available_stock: number;
  price_adjustment: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
    brand: string;
    price: number;
    is_active: boolean;
  };
}

interface StockItem {
  id: string;
  product_id: string;
  product_name: string;
  product_brand: string;
  sku: string;
  eu_size?: number;
  us_size?: number;
  size_display: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_point: number;
  price: number;
  last_updated: string;
  is_synced: boolean;
}

interface StockUpdate {
  variantId: string;
  newStock: number;
  adjustment?: number;
  reason?: string;
}

export default function EnhancedInventoryManagement() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out' | 'normal'>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [brands, setBrands] = useState<string[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Inline editing states
  const [editingItems, setEditingItems] = useState<Map<string, number>>(new Map());
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [updateSuccess, setUpdateSuccess] = useState<Set<string>>(new Set());
  const [updateError, setUpdateError] = useState<Map<string, string>>(new Map());

  // Real-time subscription
  useEffect(() => {
    loadInventoryData();

    // Set up real-time subscription for stock updates
    const subscription = supabase
      .channel('inventory-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_variants'
        },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle real-time updates
  const handleRealtimeUpdate = (payload: any) => {
    console.log('📡 Real-time update received:', payload);

    if (payload.eventType === 'UPDATE') {
      const updatedVariant = payload.new;

      setStockItems(prev => prev.map(item => {
        if (item.id === updatedVariant.id) {
          return {
            ...item,
            stock_quantity: updatedVariant.stock_quantity,
            reserved_quantity: updatedVariant.reserved_quantity,
            available_quantity: updatedVariant.computed_available_stock ||
                               (updatedVariant.stock_quantity - updatedVariant.reserved_quantity),
            last_updated: updatedVariant.updated_at
          };
        }
        return item;
      }));

      // Show sync indicator
      setSyncing(true);
      setTimeout(() => setSyncing(false), 1000);
    }
  };

  const loadInventoryData = async () => {
    try {
      setLoading(true);

      // Fetch all product variants with their product info
      const { data: variants, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
          sku,
          eu_size,
          us_size,
          stock_quantity,
          reserved_quantity,
          computed_available_stock,
          price_adjustment,
          is_active,
          created_at,
          updated_at,
          products!inner (
            id,
            name,
            brand,
            price,
            is_active
          )
        `)
        .eq('is_active', true)
        .eq('products.is_active', true)
        .order('products(name)', { ascending: true })
        .order('eu_size', { ascending: true });

      if (error) throw error;

      // Transform data for display
      const items: StockItem[] = (variants || []).map((variant: ProductVariant) => ({
        id: variant.id,
        product_id: variant.product_id,
        product_name: variant.products?.name || 'Unknown Product',
        product_brand: variant.products?.brand || 'Unknown Brand',
        sku: variant.sku || 'N/A',
        eu_size: variant.eu_size,
        us_size: variant.us_size,
        size_display: variant.eu_size
          ? `EU ${variant.eu_size}${variant.us_size ? ` / US ${variant.us_size}` : ''}`
          : 'One Size',
        stock_quantity: variant.stock_quantity || 0,
        reserved_quantity: variant.reserved_quantity || 0,
        available_quantity: variant.computed_available_stock ||
                           ((variant.stock_quantity || 0) - (variant.reserved_quantity || 0)),
        reorder_point: 5, // Default reorder point
        price: (variant.products?.price || 0) + (variant.price_adjustment || 0),
        last_updated: variant.updated_at,
        is_synced: true
      }));

      setStockItems(items);
      setLastSync(new Date());

      // Extract unique brands for filtering
      const uniqueBrands = Array.from(new Set(items.map(item => item.product_brand))).sort();
      setBrands(uniqueBrands);

    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Quick stock update with immediate sync
  const quickUpdateStock = async (item: StockItem, adjustment: number) => {
    const newQuantity = item.stock_quantity + adjustment;
    if (newQuantity < 0) return;

    await updateStockQuantity(item.id, newQuantity);
  };

  // Direct stock update
  const updateStockQuantity = async (variantId: string, newQuantity: number, reason?: string) => {
    if (newQuantity < 0) {
      setUpdateError(new Map(updateError.set(variantId, 'Stock cannot be negative')));
      setTimeout(() => {
        setUpdateError(new Map());
      }, 3000);
      return;
    }

    setSavingItems(new Set(savingItems.add(variantId)));
    setUpdateError(new Map()); // Clear any previous errors

    try {
      // Get current variant data
      const currentItem = stockItems.find(item => item.id === variantId);
      if (!currentItem) throw new Error('Item not found');

      // Calculate new available stock
      const availableStock = newQuantity - currentItem.reserved_quantity;

      // Update in database
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({
          stock_quantity: newQuantity,
          computed_available_stock: availableStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId);

      if (updateError) throw updateError;

      // Record stock movement if there's a change
      if (newQuantity !== currentItem.stock_quantity) {
        const difference = newQuantity - currentItem.stock_quantity;

        await supabase
          .from('stock_movements')
          .insert({
            product_id: currentItem.product_id,
            variant_id: variantId,
            movement_type: difference > 0 ? 'restock' : 'adjustment',
            quantity: Math.abs(difference),
            quantity_before: currentItem.stock_quantity,
            quantity_after: newQuantity,
            reason: reason || `Stock updated to ${newQuantity}`,
            reference_type: 'admin_adjustment',
            status: 'completed',
            movement_date: new Date().toISOString()
          });
      }

      // Update local state immediately for responsive UI
      setStockItems(prev => prev.map(item =>
        item.id === variantId
          ? {
              ...item,
              stock_quantity: newQuantity,
              available_quantity: availableStock,
              last_updated: new Date().toISOString()
            }
          : item
      ));

      // Show success feedback
      setUpdateSuccess(new Set(updateSuccess.add(variantId)));
      setTimeout(() => {
        setUpdateSuccess(new Set());
      }, 2000);

      // Clear editing state
      setEditingItems(new Map());

    } catch (error) {
      console.error('Error updating stock:', error);
      setUpdateError(new Map(updateError.set(variantId, 'Update failed')));
      setTimeout(() => {
        setUpdateError(new Map());
      }, 3000);
    } finally {
      setSavingItems(new Set());
    }
  };

  // Start inline editing
  const startInlineEdit = (variantId: string, currentStock: number) => {
    const newMap = new Map(editingItems);
    newMap.set(variantId, currentStock);
    setEditingItems(newMap);
  };

  // Cancel inline editing
  const cancelInlineEdit = (variantId: string) => {
    const newMap = new Map(editingItems);
    newMap.delete(variantId);
    setEditingItems(newMap);
  };

  // Handle inline edit save
  const saveInlineEdit = (variantId: string) => {
    const newValue = editingItems.get(variantId);
    if (newValue !== undefined) {
      updateStockQuantity(variantId, newValue);
    }
  };

  // Export inventory report
  const exportInventoryReport = () => {
    const csvContent = [
      ['Product', 'Brand', 'Size', 'SKU', 'Current Stock', 'Reserved', 'Available', 'Reorder Point', 'Status', 'Last Updated'],
      ...filteredItems.map(item => [
        item.product_name,
        item.product_brand,
        item.size_display,
        item.sku,
        item.stock_quantity,
        item.reserved_quantity,
        item.available_quantity,
        item.reorder_point,
        getStockStatus(item),
        new Date(item.last_updated).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get stock status
  const getStockStatus = (item: StockItem) => {
    if (item.available_quantity === 0) return 'Out of Stock';
    if (item.available_quantity <= item.reorder_point) return 'Low Stock';
    return 'In Stock';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Out of Stock': return 'bg-red-100 text-red-800 border-red-200';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  // Filter items
  const filteredItems = stockItems.filter(item => {
    const matchesSearch =
      !searchTerm ||
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.size_display.toLowerCase().includes(searchTerm.toLowerCase());

    const status = getStockStatus(item);
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'low' && status === 'Low Stock') ||
      (filterStatus === 'out' && status === 'Out of Stock') ||
      (filterStatus === 'normal' && status === 'In Stock');

    const matchesBrand =
      filterBrand === 'all' ||
      item.product_brand === filterBrand;

    return matchesSearch && matchesFilter && matchesBrand;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Statistics
  const stats = {
    totalProducts: stockItems.length,
    totalStock: stockItems.reduce((sum, item) => sum + item.stock_quantity, 0),
    lowStock: stockItems.filter(item => getStockStatus(item) === 'Low Stock').length,
    outOfStock: stockItems.filter(item => getStockStatus(item) === 'Out of Stock').length,
    totalValue: stockItems.reduce((sum, item) => sum + (item.stock_quantity * item.price), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Inventory Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time stock management with instant sync
            {lastSync && (
              <span className="ml-2 text-gray-500">
                Last sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncing && (
            <div className="flex items-center gap-2 text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Syncing...</span>
            </div>
          )}
          <button
            onClick={loadInventoryData}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportInventoryReport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <Package className="text-blue-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStock}</p>
            </div>
            <Database className="text-green-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
            <TrendingDown className="text-yellow-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
            <AlertTriangle className="text-red-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Value</p>
              <p className="text-xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</p>
            </div>
            <TrendingUp className="text-purple-500 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products, brands, SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterBrand}
            onChange={(e) => {
              setFilterBrand(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="normal">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {currentItems.length} of {filteredItems.length} items</span>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading inventory...</span>
          </div>
        </div>
      ) : (
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Qty
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reserved
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((item) => {
                  const status = getStockStatus(item);
                  const isEditing = editingItems.has(item.id);
                  const isSaving = savingItems.has(item.id);
                  const hasSuccess = updateSuccess.has(item.id);
                  const hasError = updateError.has(item.id);
                  const errorMessage = updateError.get(item.id);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                          <div className="text-sm text-gray-500">{item.product_brand}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {item.size_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-mono text-gray-600">{item.sku}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingItems.get(item.id)}
                            onChange={(e) => {
                              const newMap = new Map(editingItems);
                              newMap.set(item.id, parseInt(e.target.value) || 0);
                              setEditingItems(newMap);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveInlineEdit(item.id);
                              } else if (e.key === 'Escape') {
                                cancelInlineEdit(item.id);
                              }
                            }}
                            className="w-20 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500"
                            min="0"
                            autoFocus
                            disabled={isSaving}
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">
                            {item.stock_quantity}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-600">{item.reserved_quantity}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-sm font-semibold ${
                          item.available_quantity === 0 ? 'text-red-600' :
                          item.available_quantity <= item.reorder_point ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {item.available_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveInlineEdit(item.id)}
                                disabled={isSaving}
                                className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                                title="Save (Enter)"
                              >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => cancelInlineEdit(item.id)}
                                disabled={isSaving}
                                className="p-1 text-gray-600 hover:text-gray-700 disabled:opacity-50"
                                title="Cancel (Esc)"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => quickUpdateStock(item, -1)}
                                disabled={item.stock_quantity === 0 || isSaving}
                                className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50 rounded hover:bg-red-50"
                                title="Decrease by 1"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => startInlineEdit(item.id, item.stock_quantity)}
                                disabled={isSaving}
                                className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50 rounded hover:bg-blue-50"
                                title="Edit stock"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => quickUpdateStock(item, 1)}
                                disabled={isSaving}
                                className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50 rounded hover:bg-green-50"
                                title="Increase by 1"
                              >
                                <Plus className="w-4 h-4" />
                              </button>

                              {/* Success/Error indicators */}
                              {hasSuccess && (
                                <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
                              )}
                              {hasError && (
                                <div className="flex items-center gap-1 ml-1">
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <span className="text-xs text-red-600">{errorMessage}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredItems.length)} of{' '}
                  {filteredItems.length} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = currentPage - 2 + i;
                      if (page < 1 || page > totalPages) return null;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm border rounded ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}