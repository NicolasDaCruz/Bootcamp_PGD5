'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowLeft,
  Filter,
  Loader
} from 'lucide-react';

interface ReportData {
  sales: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topProducts: Array<{ name: string; sales: number; revenue: number }>;
    dailySales: Array<{ date: string; revenue: number; orders: number }>;
  };
  customers: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    customerLifetimeValue: number;
    topCustomers: Array<{ name: string; email: string; totalSpent: number; orders: number }>;
  };
  inventory: {
    totalProducts: number;
    lowStockItems: number;
    outOfStockItems: number;
    inventoryValue: number;
    topMovingProducts: Array<{ name: string; sales: number; stock: number }>;
  };
  financial: {
    grossRevenue: number;
    netRevenue: number;
    totalCosts: number;
    profitMargin: number;
    monthlyBreakdown: Array<{ month: string; revenue: number; costs: number; profit: number }>;
  };
}

export default function AdminReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedReport, setSelectedReport] = useState<'sales' | 'customers' | 'inventory' | 'financial'>('sales');
  const [generatingReport, setGeneratingReport] = useState(false);


  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to access reports');
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
        await loadReportData();
      } else {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
      }
    };

    checkAdmin();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);

      // In a real implementation, these would be complex database queries
      // For demo purposes, we'll generate sample data
      const mockReportData: ReportData = {
        sales: {
          totalRevenue: 156750,
          totalOrders: 1247,
          averageOrderValue: 125.60,
          topProducts: [
            { name: 'Air Jordan 1 Retro High', sales: 145, revenue: 18125 },
            { name: 'Nike Dunk Low', sales: 132, revenue: 13200 },
            { name: 'Adidas Yeezy 350', sales: 98, revenue: 24500 },
            { name: 'New Balance 550', sales: 87, revenue: 10875 },
            { name: 'Converse Chuck 70', sales: 76, revenue: 7600 }
          ],
          dailySales: generateDailySales()
        },
        customers: {
          totalCustomers: 2847,
          newCustomers: 342,
          returningCustomers: 198,
          customerLifetimeValue: 287.45,
          topCustomers: [
            { name: 'John Smith', email: 'john@example.com', totalSpent: 2450, orders: 12 },
            { name: 'Sarah Johnson', email: 'sarah@example.com', totalSpent: 1890, orders: 8 },
            { name: 'Mike Wilson', email: 'mike@example.com', totalSpent: 1675, orders: 9 },
            { name: 'Emily Davis', email: 'emily@example.com', totalSpent: 1520, orders: 7 },
            { name: 'Alex Brown', email: 'alex@example.com', totalSpent: 1340, orders: 6 }
          ]
        },
        inventory: {
          totalProducts: 456,
          lowStockItems: 23,
          outOfStockItems: 8,
          inventoryValue: 245670,
          topMovingProducts: [
            { name: 'Air Jordan 1 Retro High', sales: 145, stock: 12 },
            { name: 'Nike Dunk Low', sales: 132, stock: 18 },
            { name: 'Adidas Yeezy 350', sales: 98, stock: 5 },
            { name: 'New Balance 550', sales: 87, stock: 22 },
            { name: 'Converse Chuck 70', sales: 76, stock: 34 }
          ]
        },
        financial: {
          grossRevenue: 156750,
          netRevenue: 140475,
          totalCosts: 78375,
          profitMargin: 44.2,
          monthlyBreakdown: [
            { month: 'Jan', revenue: 45200, costs: 22600, profit: 22600 },
            { month: 'Feb', revenue: 52300, costs: 26150, profit: 26150 },
            { month: 'Mar', revenue: 59250, costs: 29625, profit: 29725 }
          ]
        }
      };

      setReportData(mockReportData);

    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const generateDailySales = () => {
    const days = 30;
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 8000) + 2000,
        orders: Math.floor(Math.random() * 50) + 10
      });
    }
    return data;
  };

  const generateReport = async (format: 'json' | 'csv') => {
    setGeneratingReport(true);

    try {
      // Simulate report generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (format === 'json') {
        const reportContent = {
          reportType: selectedReport,
          dateRange,
          generatedAt: new Date().toISOString(),
          data: reportData?.[selectedReport]
        };

        const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}-report-${dateRange.start}-to-${dateRange.end}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Generate CSV format
        let csvContent = '';

        if (selectedReport === 'sales' && reportData?.sales) {
          csvContent = 'Date,Revenue,Orders\n';
          reportData.sales.dailySales.forEach(item => {
            csvContent += `${item.date},${item.revenue},${item.orders}\n`;
          });
        } else if (selectedReport === 'customers' && reportData?.customers) {
          csvContent = 'Name,Email,Total Spent,Orders\n';
          reportData.customers.topCustomers.forEach(customer => {
            csvContent += `${customer.name},${customer.email},${customer.totalSpent},${customer.orders}\n`;
          });
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}-report-${dateRange.start}-to-${dateRange.end}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const reportTabs = [
    { id: 'sales', label: 'Sales Report', icon: DollarSign },
    { id: 'customers', label: 'Customer Report', icon: Users },
    { id: 'inventory', label: 'Inventory Report', icon: Package },
    { id: 'financial', label: 'Financial Report', icon: BarChart3 }
  ];

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentReportData = reportData?.[selectedReport];

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
                <h1 className="text-3xl font-bold text-gray-900">Business Reports</h1>
                <p className="text-gray-600 mt-1">Generate and export comprehensive business reports</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Report Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {reportTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedReport(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      selectedReport === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Export Controls */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {reportTabs.find(t => t.id === selectedReport)?.label}
              </h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => generateReport('csv')}
                  disabled={generatingReport}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {generatingReport ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => generateReport('json')}
                  disabled={generatingReport}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {generatingReport ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Export JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="p-6">
            {selectedReport === 'sales' && currentReportData && (
              <div className="space-y-6">
                {/* Sales Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-700">Total Revenue</p>
                    <p className="text-2xl font-bold text-blue-900">${currentReportData.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-700">Total Orders</p>
                    <p className="text-2xl font-bold text-green-900">{currentReportData.totalOrders.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-700">Avg Order Value</p>
                    <p className="text-2xl font-bold text-purple-900">${currentReportData.averageOrderValue.toFixed(2)}</p>
                  </div>
                </div>

                {/* Top Products */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
                  <div className="space-y-3">
                    {currentReportData.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-700">{index + 1}</span>
                          </div>
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">${product.revenue.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{product.sales} sales</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'customers' && currentReportData && (
              <div className="space-y-6">
                {/* Customer Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-700">Total Customers</p>
                    <p className="text-2xl font-bold text-blue-900">{currentReportData.totalCustomers.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-700">New Customers</p>
                    <p className="text-2xl font-bold text-green-900">{currentReportData.newCustomers.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-700">Returning</p>
                    <p className="text-2xl font-bold text-purple-900">{currentReportData.returningCustomers.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-orange-700">Avg LTV</p>
                    <p className="text-2xl font-bold text-orange-900">${currentReportData.customerLifetimeValue.toFixed(2)}</p>
                  </div>
                </div>

                {/* Top Customers */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
                  <div className="space-y-3">
                    {currentReportData.topCustomers.map((customer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-700">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">${customer.totalSpent.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{customer.orders} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'inventory' && currentReportData && (
              <div className="space-y-6">
                {/* Inventory Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-700">Total Products</p>
                    <p className="text-2xl font-bold text-blue-900">{currentReportData.totalProducts.toLocaleString()}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-yellow-700">Low Stock</p>
                    <p className="text-2xl font-bold text-yellow-900">{currentReportData.lowStockItems.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-red-700">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-900">{currentReportData.outOfStockItems.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-700">Total Value</p>
                    <p className="text-2xl font-bold text-green-900">${currentReportData.inventoryValue.toLocaleString()}</p>
                  </div>
                </div>

                {/* Top Moving Products */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Fast Moving Products</h3>
                  <div className="space-y-3">
                    {currentReportData.topMovingProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-green-700">{index + 1}</span>
                          </div>
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{product.sales} sold</p>
                          <p className="text-sm text-gray-500">{product.stock} in stock</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'financial' && currentReportData && (
              <div className="space-y-6">
                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-700">Gross Revenue</p>
                    <p className="text-2xl font-bold text-green-900">${currentReportData.grossRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-700">Net Revenue</p>
                    <p className="text-2xl font-bold text-blue-900">${currentReportData.netRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-red-700">Total Costs</p>
                    <p className="text-2xl font-bold text-red-900">${currentReportData.totalCosts.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-700">Profit Margin</p>
                    <p className="text-2xl font-bold text-purple-900">{currentReportData.profitMargin.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Monthly Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Financial Breakdown</h3>
                  <div className="space-y-3">
                    {currentReportData.monthlyBreakdown.map((month, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{month.month}</h4>
                          <span className="text-sm font-medium text-green-600">
                            ${month.profit.toLocaleString()} profit
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Revenue</p>
                            <p className="font-medium">${month.revenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Costs</p>
                            <p className="font-medium">${month.costs.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Margin</p>
                            <p className="font-medium">{((month.profit / month.revenue) * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}