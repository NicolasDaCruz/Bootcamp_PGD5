'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Archive,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react';

interface StockItem {
  id: string;
  product_id: string;
  product_name?: string;
  product_brand?: string;
  variant_name?: string;
  sku?: string;
  eu_size?: number;
  us_size?: number;
  size_display?: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_point: number;
  price: number;
  last_updated?: string;
}

interface StockMovement {
  id: string;
  product_variant_id: string;
  movement_type: string;
  quantity: number;
  reason: string;
  reference_id?: string;
  created_at: string;
  created_by?: string;
}

export default function StockManagementDashboard() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out' | 'overstock'>('all');
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100); // Increased to show more items per page

  useEffect(() => {
    fetchStockData();
    fetchRecentMovements();
  }, []);

  const fetchStockData = async () => {
    try {
      setLoading(true);

      // Fetch all products from both tables
      const [variantsResponse, productsResponse, sneakersResponse] = await Promise.all([
        // Get all product variants with their product info
        supabase
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
          .order('eu_size', { ascending: true }),

        // Get all products to know which ones have variants
        supabase
          .from('products')
          .select('id, name, brand, price')
          .eq('is_active', true),

        // Get ALL sneakers from sneakers table
        supabase
          .from('sneakers')
          .select('id, name, brand, brand_name, retail_price')
          .order('name', { ascending: true })
      ]);

      if (variantsResponse.error) throw variantsResponse.error;
      if (productsResponse.error) throw productsResponse.error;

      // Create a set of product IDs that have variants
      const productsWithVariants = new Set(variantsResponse.data?.map(v => v.product_id) || []);
      const allProductIds = new Set(productsResponse.data?.map(p => p.id) || []);

      // Format variants data
      const formattedStock = variantsResponse.data?.map(item => {
        const sizeDisplay = item.eu_size ?
          `EU ${item.eu_size}${item.us_size ? ` / US ${item.us_size}` : ''}` :
          'One Size';

        return {
          id: item.id,
          product_id: item.product_id,
          product_name: item.products?.name || 'Unknown',
          product_brand: item.products?.brand || 'Unknown',
          sku: item.sku || 'N/A',
          eu_size: item.eu_size,
          us_size: item.us_size,
          size_display: sizeDisplay,
          stock_quantity: item.stock_quantity || 0,
          reserved_quantity: item.reserved_quantity || 0,
          available_quantity: item.computed_available_stock || 0,
          reorder_point: 5,
          price: (item.products?.price || 0) + (item.price_adjustment || 0),
          last_updated: new Date().toISOString()
        };
      }) || [];

      // Add products without variants
      const productsWithoutVariants = productsResponse.data?.filter(
        p => !productsWithVariants.has(p.id)
      ) || [];

      const productPlaceholders = productsWithoutVariants.map(product => ({
        id: `no-variant-${product.id}`,
        product_id: product.id,
        product_name: product.name || 'Unknown',
        product_brand: product.brand || 'Unknown',
        sku: 'NO-VARIANTS',
        eu_size: null,
        us_size: null,
        size_display: 'No Size Variants',
        stock_quantity: 0,
        reserved_quantity: 0,
        available_quantity: 0,
        reorder_point: 5,
        price: product.price || 0,
        last_updated: new Date().toISOString()
      }));

      // Add sneakers that are not in products table
      const sneakersNotInProducts = sneakersResponse.data?.filter(
        s => !allProductIds.has(s.id)
      ) || [];

      const sneakerPlaceholders = sneakersNotInProducts.map(sneaker => ({
        id: `sneaker-${sneaker.id}`,
        product_id: sneaker.id,
        product_name: sneaker.name || sneaker.brand_name || 'Unknown',
        product_brand: sneaker.brand || 'Unknown',
        sku: 'NOT-IN-PRODUCTS',
        eu_size: null,
        us_size: null,
        size_display: 'Not Synced to Products',
        stock_quantity: 0,
        reserved_quantity: 0,
        available_quantity: 0,
        reorder_point: 5,
        price: sneaker.retail_price || 0,
        last_updated: new Date().toISOString()
      }));

      // Combine all items
      const allItems = [...formattedStock, ...productPlaceholders, ...sneakerPlaceholders];

      console.log(`Loaded inventory: ${formattedStock.length} variants, ${productPlaceholders.length} products without variants, ${sneakerPlaceholders.length} sneakers not synced`);

      setStockItems(allItems);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setStockMovements(data || []);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    }
  };

  const adjustStock = async (item: StockItem, quantity: number, reason: string) => {
    try {
      const newQuantity = item.stock_quantity + quantity;

      if (newQuantity < 0) {
        alert('Stock cannot be negative');
        return;
      }

      // Update the product variant stock
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      // Record the stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_variant_id: item.id,
          movement_type: quantity > 0 ? 'adjustment_in' : 'adjustment_out',
          quantity: Math.abs(quantity),
          reason: reason,
          created_at: new Date().toISOString()
        });

      if (movementError) {
        console.error('Error recording stock movement:', movementError);
        // Continue even if movement recording fails
      }

      alert(`Stock adjusted successfully for ${item.product_name} - ${item.size_display}`);
      setSelectedItem(null);
      setAdjustmentQuantity(0);
      setAdjustmentReason('');
      fetchStockData();
      fetchRecentMovements();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Failed to adjust stock');
    }
  };

  const exportStockReport = () => {
    const csvContent = [
      ['Product', 'Brand', 'Size', 'SKU', 'Current Stock', 'Reserved', 'Available', 'Status'],
      ...stockItems.map(item => [
        item.product_name,
        item.product_brand,
        item.size_display,
        item.sku,
        item.stock_quantity,
        item.reserved_quantity,
        item.available_quantity,
        getStockStatus(item)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStockStatus = (item: StockItem) => {
    if (item.available_quantity === 0) return 'Out of Stock';
    if (item.available_quantity <= item.reorder_point) return 'Low Stock';
    if (item.available_quantity > 50) return 'Overstock';
    return 'Normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Overstock': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const filteredItems = stockItems.filter(item => {
    const matchesSearch =
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    const status = getStockStatus(item);
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'low' && status === 'Low Stock') ||
      (filterStatus === 'out' && status === 'Out of Stock') ||
      (filterStatus === 'overstock' && status === 'Overstock');

    return matchesSearch && matchesFilter;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const stats = {
    totalProducts: stockItems.length,
    lowStock: stockItems.filter(item => getStockStatus(item) === 'Low Stock').length,
    outOfStock: stockItems.filter(item => getStockStatus(item) === 'Out of Stock').length,
    totalValue: stockItems.reduce((sum, item) => sum + (item.stock_quantity * item.price), 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <button
          onClick={exportStockReport}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Products</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
            <Package className="text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
            <TrendingDown className="text-yellow-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
            <AlertTriangle className="text-red-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Value</p>
              <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
            </div>
            <TrendingUp className="text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by product name, brand, or SKU..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value as any);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
          <option value="overstock">Overstock</option>
        </select>
      </div>

      {/* Stock Items Table */}
      {loading ? (
        <div className="text-center py-8">Loading inventory...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredItems.length)}
                </span>{' '}
                of <span className="font-medium">{filteredItems.length}</span> items
                {searchTerm && ` (filtered from ${stockItems.length} total)`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
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
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reserved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                      <div className="text-sm text-gray-500">{item.product_brand}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.size_display}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stock_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.reserved_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.available_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(getStockStatus(item))}`}>
                      {getStockStatus(item)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.sku === 'NO-VARIANTS' ? (
                      <span className="text-gray-400">No Variants</span>
                    ) : (
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Adjust
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Adjust Stock</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Product: {selectedItem.product_name}</p>
                <p className="text-sm text-gray-600">Size: {selectedItem.size_display}</p>
                <p className="text-sm text-gray-600">Current Stock: {selectedItem.stock_quantity}</p>
                <p className="text-sm text-gray-600">Available: {selectedItem.available_quantity}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Adjustment Quantity</label>
                <input
                  type="number"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  placeholder="Use negative for reduction"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Reason for adjustment..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => adjustStock(selectedItem, adjustmentQuantity, adjustmentReason)}
                  disabled={!adjustmentReason || adjustmentQuantity === 0}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Apply Adjustment
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setAdjustmentQuantity(0);
                    setAdjustmentReason('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}