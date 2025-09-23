'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Save,
  Eye,
  Search,
  Filter
} from 'lucide-react';

interface InventoryItem {
  id?: string;
  product_id: string;
  product_name: string;
  sku?: string;
  variant_id?: string;
  variant_name?: string;
  current_stock: number;
  new_stock?: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  location?: string;
  price?: number;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface BulkUpdate {
  product_id: string;
  variant_id?: string;
  new_stock: number;
  notes?: string;
}

export default function BulkInventoryManager() {
  const [loading, setLoading] = useState(false);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryItem[]>([]);
  const [uploadedData, setUploadedData] = useState<InventoryItem[]>([]);
  const [updatePreview, setUpdatePreview] = useState<BulkUpdate[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current inventory data
  const fetchInventoryData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch inventory data from our API
      const response = await fetch('/api/inventory/stock');
      if (!response.ok) throw new Error('Failed to fetch inventory data');

      const inventoryResponse = await response.json();
      if (!inventoryResponse.success) throw new Error(inventoryResponse.error || 'API error');

      const items = inventoryResponse.items.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        variant_id: item.variant_id,
        variant_name: item.variant_name,
        current_stock: item.current_stock,
        reserved_stock: item.reserved_stock,
        available_stock: item.available_stock,
        low_stock_threshold: item.low_stock_threshold,
        location: 'main_warehouse',
        price: item.price,
        status: item.status
      }));

      setInventoryData(items);
      setFilteredData(items);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setMessage('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...inventoryData];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    setFilteredData(filtered);
  }, [searchTerm, filterStatus, inventoryData]);

  const getStockStatus = (availableStock: number, threshold: number) => {
    if (availableStock === 0) return 'out_of_stock';
    if (availableStock <= threshold) return 'low_stock';
    return 'in_stock';
  };

  // Download Excel template
  const downloadTemplate = () => {
    const templateData = inventoryData.map(item => ({
      'Product ID': item.product_id,
      'Product Name': item.product_name,
      'Variant ID': item.variant_id || '',
      'SKU': item.sku || '',
      'Current Stock': item.current_stock,
      'New Stock': item.current_stock,
      'Low Stock Threshold': item.low_stock_threshold,
      'Location': item.location || 'main_warehouse',
      'Notes': ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

    // Auto-size columns
    const maxWidth = 30;
    const colWidths = Object.keys(templateData[0] || {}).map(key => ({
      wch: Math.min(maxWidth, Math.max(key.length, 15))
    }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `inventory_template_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Parse and validate uploaded data
        const parsedData: InventoryItem[] = [];
        const updates: BulkUpdate[] = [];

        jsonData.forEach((row: any) => {
          const productId = row['Product ID'];
          const variantId = row['Variant ID'] || null;
          const newStock = parseInt(row['New Stock']);
          const notes = row['Notes'] || '';

          if (productId && !isNaN(newStock)) {
            // Find existing item
            const existingItem = inventoryData.find(item =>
              item.product_id === productId &&
              (variantId ? item.variant_id === variantId : !item.variant_id)
            );

            if (existingItem) {
              parsedData.push({
                ...existingItem,
                new_stock: newStock
              });

              if (existingItem.current_stock !== newStock) {
                updates.push({
                  product_id: productId,
                  variant_id: variantId,
                  new_stock: newStock,
                  notes
                });
              }
            }
          }
        });

        setUploadedData(parsedData);
        setUpdatePreview(updates);
        setShowPreview(true);
        setUploadStatus('success');
        setMessage(`Successfully parsed ${updates.length} stock updates`);
      } catch (error) {
        console.error('Error parsing file:', error);
        setUploadStatus('error');
        setMessage('Failed to parse Excel file. Please check the format.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Apply bulk updates
  const applyBulkUpdates = async () => {
    if (updatePreview.length === 0) {
      setMessage('No updates to apply');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Process each update using our stock API
      const results = await Promise.all(updatePreview.map(async (update) => {
        try {
          const response = await fetch('/api/inventory/stock', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_id: update.product_id,
              variant_id: update.variant_id,
              new_stock: update.new_stock,
              notes: update.notes || 'Bulk inventory update'
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update stock');
          }

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error || 'API returned error');
          }

          return { success: true, update, result };
        } catch (error) {
          console.error('Update failed:', error);
          return { success: false, update, error };
        }
      }));

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        setMessage(`Successfully updated ${successCount} items${failCount > 0 ? `, ${failCount} failed` : ''}`);
        setUploadStatus('success');

        // Refresh inventory data
        await fetchInventoryData();

        // Clear preview
        setShowPreview(false);
        setUpdatePreview([]);
        setUploadedData([]);
      } else {
        setMessage('All updates failed. Please check the data and try again.');
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      setMessage('Failed to apply updates');
      setUploadStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Export current inventory
  const exportInventory = () => {
    const exportData = filteredData.map(item => ({
      'Product ID': item.product_id,
      'Product Name': item.product_name,
      'Variant': item.variant_name || '',
      'SKU': item.sku || '',
      'Current Stock': item.current_stock,
      'Reserved Stock': item.reserved_stock,
      'Available Stock': item.available_stock,
      'Status': item.status,
      'Low Stock Threshold': item.low_stock_threshold,
      'Location': item.location || 'main_warehouse',
      'Price': item.price || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Current Inventory');

    XLSX.writeFile(workbook, `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Calculate inventory statistics
  const getInventoryStats = () => {
    const stats = {
      total: filteredData.length,
      inStock: filteredData.filter(item => item.status === 'in_stock').length,
      lowStock: filteredData.filter(item => item.status === 'low_stock').length,
      outOfStock: filteredData.filter(item => item.status === 'out_of_stock').length,
      totalValue: filteredData.reduce((sum, item) => sum + (item.current_stock * (item.price || 0)), 0),
      totalUnits: filteredData.reduce((sum, item) => sum + item.current_stock, 0)
    };
    return stats;
  };

  const stats = getInventoryStats();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <Package className="w-5 h-5 text-gray-600 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Total SKUs</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p className="text-xs text-gray-500">In Stock</p>
              <p className="text-xl font-bold text-green-600">{stats.inStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Low Stock</p>
              <p className="text-xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Out of Stock</p>
              <p className="text-xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <Package className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Total Units</p>
              <p className="text-xl font-bold text-blue-600">{stats.totalUnits.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Total Value</p>
              <p className="text-xl font-bold text-purple-600">${stats.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        <button
          onClick={() => fetchInventoryData()}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={downloadTemplate}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download Template</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Excel File</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={exportInventory}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Current Inventory</span>
        </button>
      </div>

      {/* Status Messages */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
          uploadStatus === 'success' ? 'bg-green-50 text-green-800' :
          uploadStatus === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {uploadStatus === 'success' && <CheckCircle className="w-5 h-5" />}
          {uploadStatus === 'error' && <XCircle className="w-5 h-5" />}
          {uploadStatus === 'idle' && <AlertCircle className="w-5 h-5" />}
          <span>{message}</span>
        </div>
      )}

      {/* Preview Panel */}
      {showPreview && updatePreview.length > 0 && (
        <div className="mb-6 border border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">
              Preview: {updatePreview.length} Stock Updates
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowPreview(false)}
                className="px-3 py-1 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={applyBulkUpdates}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Apply Updates</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">New Stock</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadedData.filter(item => item.new_stock !== undefined).map((item, index) => {
                  const change = (item.new_stock || 0) - item.current_stock;
                  return (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.product_name}
                        {item.variant_name && (
                          <span className="block text-xs text-gray-500">{item.variant_name}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.current_stock}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.new_stock}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`font-medium ${
                          change > 0 ? 'text-green-600' :
                          change < 0 ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {change > 0 ? '+' : ''}{change}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {updatePreview.find(u =>
                          u.product_id === item.product_id &&
                          u.variant_id === item.variant_id
                        )?.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reserved
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Threshold
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Loading inventory data...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No inventory items found
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={`${item.product_id}-${item.variant_id || 'main'}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.product_name}
                    </div>
                    {item.variant_name && (
                      <div className="text-xs text-gray-500">{item.variant_name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.sku || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.current_stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.reserved_stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.available_stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.low_stock_threshold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                      item.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.location || 'main_warehouse'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Bulk Upload Instructions:</h4>
        <ol className="text-xs text-gray-600 space-y-1">
          <li>1. Download the Excel template with your current inventory</li>
          <li>2. Update the "New Stock" column with desired quantities</li>
          <li>3. Add notes for tracking purposes (optional)</li>
          <li>4. Save the file and upload it back</li>
          <li>5. Review the preview and apply changes</li>
        </ol>
        <p className="text-xs text-gray-500 mt-2">
          Note: Stock movements are automatically recorded for audit purposes.
        </p>
      </div>
    </div>
  );
}