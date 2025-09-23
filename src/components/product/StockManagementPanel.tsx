'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import StockImportExport from './StockImportExport';
import {
  Package,
  Edit3,
  Save,
  X,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Upload,
  Download,
  Settings,
  CheckCircle,
  AlertTriangle,
  Plus,
  Minus,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductVariant {
  id: string;
  size: string;
  color?: string;
  sku: string;
  stock_quantity: number;
  price_modifier: number;
  is_active: boolean;
}

interface StockManagementPanelProps {
  productId: string;
  productName: string;
  vendorId: string | null;
  variants: ProductVariant[];
  lowStockThreshold?: number;
  onStockUpdate?: (variantId: string, newStock: number) => void;
  className?: string;
}

interface StockEdit {
  variantId: string;
  originalStock: number;
  newStock: number;
}

export default function StockManagementPanel({
  productId,
  productName,
  vendorId,
  variants,
  lowStockThreshold = 5,
  onStockUpdate,
  className = ''
}: StockManagementPanelProps) {
  const { isVendor, isAdmin, canManageProduct, loading: authLoading } = useVendorAuth();
  const [editMode, setEditMode] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [stockEdits, setStockEdits] = useState<Map<string, StockEdit>>(new Map());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [bulkOperation, setBulkOperation] = useState<'set' | 'add' | 'subtract'>('set');
  const [bulkValue, setBulkValue] = useState<number>(0);

  // Check if user can manage this product
  const canManage = canManageProduct(vendorId);

  // Reset states when switching products
  useEffect(() => {
    setEditMode(false);
    setBulkEditMode(false);
    setStockEdits(new Map());
    setSelectedVariants(new Set());
    setError(null);
    setSuccess(null);
  }, [productId]);

  const handleStockChange = (variantId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const variant = variants.find(v => v.id === variantId);

    if (!variant) return;

    // Clear any previous errors when user starts editing
    if (error) setError(null);

    const newEdit: StockEdit = {
      variantId,
      originalStock: variant.stock_quantity,
      newStock: Math.max(0, numValue) // Prevent negative stock
    };

    setStockEdits(prev => {
      const updated = new Map(prev);
      updated.set(variantId, newEdit);
      return updated;
    });

    // Show warning for extremely high quantities
    if (numValue > 1000) {
      setError('Warning: Stock quantity seems unusually high. Please double-check.');
    }
  };

  const handleBulkOperation = () => {
    const newEdits = new Map(stockEdits);

    selectedVariants.forEach(variantId => {
      const variant = variants.find(v => v.id === variantId);
      if (!variant) return;

      let newStock = 0;
      switch (bulkOperation) {
        case 'set':
          newStock = bulkValue;
          break;
        case 'add':
          newStock = variant.stock_quantity + bulkValue;
          break;
        case 'subtract':
          newStock = variant.stock_quantity - bulkValue;
          break;
      }

      newEdits.set(variantId, {
        variantId,
        originalStock: variant.stock_quantity,
        newStock: Math.max(0, newStock)
      });
    });

    setStockEdits(newEdits);
  };

  const handleSaveChanges = async () => {
    if (stockEdits.size === 0) {
      setError('No changes to save');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare batch updates
      const updates = Array.from(stockEdits.values()).map(edit => ({
        variant_id: edit.variantId,
        new_stock: edit.newStock,
        previous_stock: edit.originalStock
      }));

      // Call batch update API
      const response = await fetch('/api/inventory/stock/batch', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          updates,
          notes: `Stock updated for ${productName}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update stock');
      }

      const result = await response.json();

      // Update local state
      updates.forEach(update => {
        if (onStockUpdate) {
          onStockUpdate(update.variant_id, update.new_stock);
        }
      });

      setSuccess(`Successfully updated stock for ${updates.length} variant(s)`);
      setEditMode(false);
      setBulkEditMode(false);
      setStockEdits(new Map());
      setSelectedVariants(new Set());

      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (err) {
      console.error('Error saving stock changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setBulkEditMode(false);
    setStockEdits(new Map());
    setSelectedVariants(new Set());
    setError(null);
    setSuccess(null);
  };

  const toggleVariantSelection = (variantId: string) => {
    setSelectedVariants(prev => {
      const updated = new Set(prev);
      if (updated.has(variantId)) {
        updated.delete(variantId);
      } else {
        updated.add(variantId);
      }
      return updated;
    });
  };

  const selectAllVariants = () => {
    if (selectedVariants.size === variants.length) {
      setSelectedVariants(new Set());
    } else {
      setSelectedVariants(new Set(variants.map(v => v.id)));
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'red', label: 'Out of Stock', icon: TrendingDown };
    if (stock <= lowStockThreshold) return { color: 'yellow', label: 'Low Stock', icon: AlertTriangle };
    return { color: 'green', label: 'In Stock', icon: CheckCircle };
  };

  // Don't show panel if user doesn't have permissions
  if (authLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return null; // Don't show the panel for non-vendors
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Stock Management</h3>
            {isAdmin && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                Admin
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Stock</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving || stockEdits.size === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bulk Operations */}
        {editMode && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setBulkEditMode(!bulkEditMode)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {bulkEditMode ? 'Hide Bulk Operations' : 'Show Bulk Operations'}
              </button>
              <button
                onClick={selectAllVariants}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                {selectedVariants.size === variants.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {bulkEditMode && (
              <div className="mt-3 flex items-center space-x-3">
                <select
                  value={bulkOperation}
                  onChange={(e) => setBulkOperation(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="set">Set to</option>
                  <option value="add">Add</option>
                  <option value="subtract">Subtract</option>
                </select>
                <input
                  type="number"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(parseInt(e.target.value) || 0)}
                  min="0"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24"
                />
                <button
                  onClick={handleBulkOperation}
                  disabled={selectedVariants.size === 0}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply to Selected
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 bg-red-50 border-b border-red-200"
          >
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 bg-green-50 border-b border-green-200"
          >
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{success}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Variants List */}
      <div className="p-4">
        <div className="space-y-3">
          {variants.map((variant) => {
            const stockStatus = getStockStatus(variant.stock_quantity);
            const StatusIcon = stockStatus.icon;
            const editedStock = stockEdits.get(variant.id);
            const hasChanges = editedStock && editedStock.newStock !== variant.stock_quantity;

            return (
              <motion.div
                key={variant.id}
                layout
                className={`flex items-center space-x-4 p-3 rounded-lg border transition-all duration-200 ${
                  hasChanges
                    ? 'border-blue-300 bg-blue-50 shadow-md ring-1 ring-blue-200'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {/* Checkbox for bulk operations */}
                {editMode && (
                  <input
                    type="checkbox"
                    checked={selectedVariants.has(variant.id)}
                    onChange={() => toggleVariantSelection(variant.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                )}

                {/* Variant Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      Size {variant.size}
                    </span>
                    {variant.color && (
                      <span className="text-sm text-gray-500">
                        - {variant.color}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      SKU: {variant.sku}
                    </span>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="flex items-center space-x-2">
                  <StatusIcon className={`w-4 h-4 ${
                    stockStatus.color === 'red' ? 'text-red-600' :
                    stockStatus.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    stockStatus.color === 'red' ? 'text-red-600' :
                    stockStatus.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {stockStatus.label}
                  </span>
                </div>

                {/* Stock Quantity */}
                {editMode ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={editedStock?.newStock ?? variant.stock_quantity}
                      onChange={(e) => handleStockChange(variant.id, e.target.value)}
                      min="0"
                      className="w-20 px-2 py-1 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {hasChanges && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          (was {variant.stock_quantity})
                        </span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                          Changed
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {variant.stock_quantity}
                    </span>
                    <span className="text-sm text-gray-500">units</span>
                  </div>
                )}

                {/* Quick Actions */}
                {editMode && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleStockChange(variant.id, String((editedStock?.newStock ?? variant.stock_quantity) - 1))}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      title="Decrease by 1"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStockChange(variant.id, String((editedStock?.newStock ?? variant.stock_quantity) + 1))}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      title="Increase by 1"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Stock:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {variants.reduce((sum, v) => {
                  const edit = stockEdits.get(v.id);
                  return sum + (edit?.newStock ?? v.stock_quantity);
                }, 0)} units
              </span>
              {stockEdits.size > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  (was {variants.reduce((sum, v) => sum + v.stock_quantity, 0)})
                </div>
              )}
            </div>
            <div>
              <span className="text-gray-500">Variants:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {variants.length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Low Stock Alert:</span>
              <span className="ml-2 font-semibold text-gray-900">
                ≤ {lowStockThreshold} units
              </span>
            </div>
            {stockEdits.size > 0 && (
              <div>
                <span className="text-orange-600">Pending Changes:</span>
                <span className="ml-2 font-semibold text-orange-700">
                  {stockEdits.size} variant{stockEdits.size === 1 ? '' : 's'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Import/Export Section */}
        {!editMode && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <StockImportExport
              productId={productId}
              productName={productName}
              variants={variants.map(v => ({
                id: v.id,
                size: v.size,
                color: v.color,
                sku: v.sku,
                stock_quantity: v.stock_quantity
              }))}
              onImportComplete={() => {
                // Refresh the page after import
                window.location.reload();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}