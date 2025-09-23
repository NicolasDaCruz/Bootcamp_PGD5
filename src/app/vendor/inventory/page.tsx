'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Upload,
  Download,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import BulkInventoryManager from '@/components/vendor/BulkInventoryManager';
import InventoryDashboard from '@/components/vendor/InventoryDashboard';

export default function VendorInventory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVendor, setIsVendor] = useState(false);
  const [showBulkManager, setShowBulkManager] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'bulk' | 'overview'>('dashboard');


  useEffect(() => {
    const checkVendor = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to access vendor inventory');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'vendeur' || profile?.role === 'vendor' || profile?.role === 'admin') {
        setIsVendor(true);
      } else {
        setError('Access denied. Vendor privileges required.');
      }
      setLoading(false);
    };

    checkVendor();
  }, []);

  if (!isVendor && error) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white p-6 rounded-lg shadow h-96"></div>
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
                href="/vendor"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                <p className="text-gray-600 mt-1">Manage your product inventory and stock levels</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeView === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('bulk')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeView === 'bulk'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Bulk Manager
              </button>
              <button
                onClick={() => setActiveView('overview')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeView === 'overview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Overview
              </button>
            </div>
          </div>
        </div>

        {/* Render active view */}
        {activeView === 'dashboard' && <InventoryDashboard />}
        {activeView === 'bulk' && <BulkInventoryManager />}
        {activeView === 'overview' && (
          <div className="space-y-8">

        {/* Inventory Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total SKUs</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
                <p className="text-sm text-blue-600">32 variants</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">142</p>
                <p className="text-sm text-green-600">91% availability</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
                <p className="text-sm text-yellow-600">Need restock</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">6</p>
                <p className="text-sm text-red-600">Lost sales</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Management Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

          {/* Bulk Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Bulk Upload</h3>
                <p className="text-sm text-gray-600">Upload Excel file to update inventory</p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setShowBulkManager(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Open Bulk Manager
              </button>
              <p className="text-xs text-gray-500">
                Support for Excel (.xlsx), CSV files. Download template first.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-600">Common inventory tasks</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm">
                Mark All as In Stock
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm">
                Apply Reorder Points
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm">
                Generate Stock Report
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Download className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
                <p className="text-sm text-gray-600">Download inventory reports</p>
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm">
                Export Current Stock
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm">
                Export Low Stock Items
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm">
                Export Sales Report
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Alerts</h2>
          <div className="space-y-4">

            {/* Low Stock Alert */}
            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Low Stock Warning</h3>
                  <p className="text-sm text-yellow-700">
                    8 products are running low on stock and may need restocking soon.
                  </p>
                </div>
              </div>
              <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors">
                View Items
              </button>
            </div>

            {/* Out of Stock Alert */}
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <TrendingDown className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Out of Stock</h3>
                  <p className="text-sm text-red-700">
                    6 products are currently out of stock and unavailable for purchase.
                  </p>
                </div>
              </div>
              <button className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors">
                Restock Now
              </button>
            </div>

            {/* Overstock Alert */}
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Overstock Notice</h3>
                  <p className="text-sm text-blue-700">
                    12 products have excess inventory. Consider promotional pricing.
                  </p>
                </div>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                View Items
              </button>
            </div>
          </div>
        </div>

        {/* Getting Started Guide */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started with Inventory Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Bulk Upload Process</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">1</span>
                  Download the Excel template
                </li>
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">2</span>
                  Fill in your inventory data
                </li>
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">3</span>
                  Upload the completed file
                </li>
                <li className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">4</span>
                  Review and confirm changes
                </li>
              </ol>
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Best Practices</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Update inventory levels regularly to prevent overselling
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Set appropriate reorder points for each product
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Use bulk operations for large inventory adjustments
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Monitor alerts and respond promptly to stock issues
                </li>
              </ul>
            </div>
          </div>
        </div>
          </div>
        )}
      </div>
    </div>
  );
}