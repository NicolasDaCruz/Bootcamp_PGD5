'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Calendar,
  Download,
  Filter,
  ArrowLeft
} from 'lucide-react';

interface AnalyticsData {
  revenue: { date: string; amount: number }[];
  orders: { date: string; count: number }[];
  customers: { date: string; count: number }[];
  topProducts: { name: string; sales: number; revenue: number }[];
  conversionFunnel: { stage: string; count: number; rate: number }[];
  customerDemographics: { segment: string; count: number; percentage: number }[];
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    revenue: [],
    orders: [],
    customers: [],
    topProducts: [],
    conversionFunnel: [],
    customerDemographics: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders' | 'customers'>('revenue');


  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to access analytics');
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
        await loadAnalyticsData();
      } else {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
      }
    };

    checkAdmin();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      startDate.setDate(endDate.getDate() - days);

      // Generate sample data for demonstration
      // In a real implementation, these would be database queries
      const revenueData = generateTimeSeriesData(startDate, endDate, 'revenue');
      const ordersData = generateTimeSeriesData(startDate, endDate, 'orders');
      const customersData = generateTimeSeriesData(startDate, endDate, 'customers');

      setData({
        revenue: revenueData,
        orders: ordersData,
        customers: customersData,
        topProducts: [
          { name: 'Air Jordan 1 Retro High', sales: 145, revenue: 18125 },
          { name: 'Nike Dunk Low', sales: 132, revenue: 13200 },
          { name: 'Adidas Yeezy 350', sales: 98, revenue: 24500 },
          { name: 'New Balance 550', sales: 87, revenue: 10875 },
          { name: 'Converse Chuck 70', sales: 76, revenue: 7600 }
        ],
        conversionFunnel: [
          { stage: 'Visitors', count: 10000, rate: 100 },
          { stage: 'Product Views', count: 6500, rate: 65 },
          { stage: 'Add to Cart', count: 1950, rate: 19.5 },
          { stage: 'Checkout Started', count: 650, rate: 6.5 },
          { stage: 'Orders Completed', count: 325, rate: 3.25 }
        ],
        customerDemographics: [
          { segment: '18-24', count: 1250, percentage: 31.25 },
          { segment: '25-34', count: 1600, percentage: 40 },
          { segment: '35-44', count: 800, percentage: 20 },
          { segment: '45-54', count: 250, percentage: 6.25 },
          { segment: '55+', count: 100, percentage: 2.5 }
        ]
      });

    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSeriesData = (startDate: Date, endDate: Date, type: string) => {
    const data = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      let value;
      if (type === 'revenue') {
        value = Math.floor(Math.random() * 5000) + 1000;
      } else if (type === 'orders') {
        value = Math.floor(Math.random() * 50) + 10;
      } else {
        value = Math.floor(Math.random() * 20) + 5;
      }

      data.push({
        date: current.toISOString().split('T')[0],
        [type === 'revenue' ? 'amount' : 'count']: value
      });

      current.setDate(current.getDate() + 1);
    }

    return data;
  };

  const exportData = () => {
    const exportData = {
      timeRange,
      exportDate: new Date().toISOString(),
      data
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCurrentData = () => {
    switch (selectedMetric) {
      case 'revenue':
        return data.revenue;
      case 'orders':
        return data.orders;
      case 'customers':
        return data.customers;
      default:
        return data.revenue;
    }
  };

  const formatValue = (value: number) => {
    if (selectedMetric === 'revenue') {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  const getChangeIcon = (isPositive: boolean) => {
    return isPositive ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

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
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 mt-1">Comprehensive business insights and metrics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={exportData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${data.revenue.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  {getChangeIcon(true)}
                  <span className="text-sm text-green-600 ml-1">+12.5% vs last period</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.orders.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  {getChangeIcon(true)}
                  <span className="text-sm text-green-600 ml-1">+8.2% vs last period</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.customers.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  {getChangeIcon(false)}
                  <span className="text-sm text-red-600 ml-1">-2.1% vs last period</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Time Series Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Trends Over Time</h2>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as 'revenue' | 'orders' | 'customers')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="revenue">Revenue</option>
                <option value="orders">Orders</option>
                <option value="customers">New Customers</option>
              </select>
            </div>

            {/* Simple Chart Representation */}
            <div className="space-y-3">
              {getCurrentData().slice(-7).map((item, index) => {
                const value = selectedMetric === 'revenue' ? item.amount : item.count;
                const maxValue = Math.max(...getCurrentData().map(d => selectedMetric === 'revenue' ? d.amount : d.count));
                const percentage = (value / maxValue) * 100;

                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-20 text-xs text-gray-500">
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-20 text-xs text-gray-900 text-right font-medium">
                      {formatValue(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Products</h2>
            <div className="space-y-4">
              {data.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${product.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Funnel & Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Conversion Funnel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Conversion Funnel</h2>
            <div className="space-y-4">
              {data.conversionFunnel.map((stage, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">{stage.count.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 ml-2">({stage.rate}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${stage.rate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Demographics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer Demographics</h2>
            <div className="space-y-4">
              {data.customerDemographics.map((segment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Age {segment.segment}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{segment.count.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 ml-2">({segment.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}