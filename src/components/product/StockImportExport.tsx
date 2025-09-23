'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StockImportExportProps {
  productId: string;
  productName: string;
  variants: Array<{
    id: string;
    size: string;
    color?: string;
    sku: string;
    stock_quantity: number;
  }>;
  onImportComplete?: () => void;
}

interface ImportPreview {
  sku: string;
  current_stock: number;
  new_stock: number;
  change: number;
  status: 'valid' | 'invalid' | 'warning';
  message?: string;
}

export default function StockImportExport({
  productId,
  productName,
  variants,
  onImportComplete
}: StockImportExportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export current stock to Excel
  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData = variants.map(variant => ({
        'Product Name': productName,
        'Product ID': productId,
        'SKU': variant.sku,
        'Size': variant.size,
        'Color': variant.color || '',
        'Current Stock': variant.stock_quantity,
        'New Stock': variant.stock_quantity, // Pre-fill with current for easier editing
        'Notes': ''
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const cols = [
        { wch: 30 }, // Product Name
        { wch: 15 }, // Product ID
        { wch: 20 }, // SKU
        { wch: 10 }, // Size
        { wch: 15 }, // Color
        { wch: 12 }, // Current Stock
        { wch: 12 }, // New Stock
        { wch: 30 }  // Notes
      ];
      worksheet['!cols'] = cols;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `stock_${productName.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      setMessage({
        type: 'success',
        text: `Stock data exported to ${filename}`
      });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to export stock data'
      });
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/)) {
      setMessage({
        type: 'error',
        text: 'Please upload a valid Excel or CSV file'
      });
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process and validate imported data
        const preview: ImportPreview[] = [];

        jsonData.forEach((row: any) => {
          const sku = row['SKU'] || row['sku'];
          const newStock = parseInt(row['New Stock'] || row['new_stock'] || 0);

          // Find matching variant
          const variant = variants.find(v => v.sku === sku);

          if (!variant) {
            preview.push({
              sku,
              current_stock: 0,
              new_stock: newStock,
              change: 0,
              status: 'invalid',
              message: 'SKU not found in product variants'
            });
          } else {
            const change = newStock - variant.stock_quantity;
            let status: 'valid' | 'warning' | 'invalid' = 'valid';
            let message: string | undefined;

            if (newStock < 0) {
              status = 'invalid';
              message = 'Stock cannot be negative';
            } else if (newStock === 0) {
              status = 'warning';
              message = 'This will mark the item as out of stock';
            } else if (change < -variant.stock_quantity) {
              status = 'invalid';
              message = 'Cannot reduce stock below 0';
            }

            preview.push({
              sku,
              current_stock: variant.stock_quantity,
              new_stock: Math.max(0, newStock),
              change,
              status,
              message
            });
          }
        });

        setImportPreview(preview);
        setShowPreview(true);
        setIsImporting(false);
      } catch (error) {
        console.error('Import error:', error);
        setMessage({
          type: 'error',
          text: 'Failed to read file. Please check the format.'
        });
        setIsImporting(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Process import after preview
  const handleConfirmImport = async () => {
    const validImports = importPreview.filter(item => item.status !== 'invalid');

    if (validImports.length === 0) {
      setMessage({
        type: 'error',
        text: 'No valid items to import'
      });
      return;
    }

    setUploading(true);
    try {
      // Prepare import data
      const imports = validImports.map(item => ({
        sku: item.sku,
        new_stock: item.new_stock,
        notes: `Bulk import - ${new Date().toLocaleString()}`
      }));

      // Call import API
      const response = await fetch('/api/inventory/stock/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imports,
          dry_run: false
        })
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();

      setMessage({
        type: 'success',
        text: `Successfully imported ${result.stats.successful} items`
      });

      setShowPreview(false);
      setImportPreview([]);

      if (onImportComplete) {
        onImportComplete();
      }

      // Refresh page after successful import
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Import error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to import stock data'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancelImport = () => {
    setShowPreview(false);
    setImportPreview([]);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Export/Import Buttons */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Stock</span>
        </button>

        <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>{isImporting ? 'Processing...' : 'Import Stock'}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isImporting}
          />
        </label>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Info className="w-4 h-4" />
          <span>Excel or CSV format supported</span>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-md flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : message.type === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Import Preview</h3>
                  <button
                    onClick={handleCancelImport}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Review the changes before importing
                </p>
              </div>

              {/* Preview Table */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3">SKU</th>
                      <th className="text-center py-2 px-3">Current</th>
                      <th className="text-center py-2 px-3">New</th>
                      <th className="text-center py-2 px-3">Change</th>
                      <th className="text-left py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((item, index) => (
                      <tr
                        key={index}
                        className={`border-b border-gray-100 ${
                          item.status === 'invalid' ? 'bg-red-50' :
                          item.status === 'warning' ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-mono text-xs">{item.sku}</td>
                        <td className="text-center py-2 px-3">{item.current_stock}</td>
                        <td className="text-center py-2 px-3 font-medium">{item.new_stock}</td>
                        <td className="text-center py-2 px-3">
                          <span className={`font-medium ${
                            item.change > 0 ? 'text-green-600' :
                            item.change < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {item.change > 0 && '+'}
                            {item.change}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center space-x-1">
                            {item.status === 'valid' && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {item.status === 'warning' && (
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                            )}
                            {item.status === 'invalid' && (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                            {item.message && (
                              <span className="text-xs text-gray-500">
                                {item.message}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {importPreview.filter(i => i.status === 'valid').length} valid items,
                    {' '}
                    {importPreview.filter(i => i.status === 'warning').length} warnings,
                    {' '}
                    {importPreview.filter(i => i.status === 'invalid').length} invalid
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleCancelImport}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      disabled={uploading || importPreview.filter(i => i.status !== 'invalid').length === 0}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Importing...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Confirm Import</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}