'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Star,
  Calendar,
  Download
} from 'lucide-react';

interface VendorAnalytics {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    daily: Array<{ date: string; amount: number }>;
  };
  sales: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    averageOrderValue: number;
  };
  products: {
    total: number;
    active: number;
    topSelling: Array<{ name: string; sales: number; revenue: number }>;
  };
  customers: {
    total: number;
    returning: number;
    retention: number;
    satisfaction: number;
  };
  commissions: {
    total: number;
    thisMonth: number;
    rate: number;
    pending: number;
  };
}

export default function VendorAnalytics() {
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVendor, setIsVendor] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');


  useEffect(() => {
    const checkVendor = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to access analytics');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role, id')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'vendeur' || profile?.role === 'vendor' || profile?.role === 'admin') {
        setIsVendor(true);
        setVendorId(profile.id);
        await loadAnalytics(profile.id);
      } else {
        setError('Access denied. Vendor privileges required.');
        setLoading(false);
      }
    };

    checkVendor();
  }, [timeRange]);

  const loadAnalytics = async (vendorId: string) => {
    try {
      setLoading(true);

      // Generate mock analytics data for demo
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const dailyRevenue = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          date: date.toISOString().split('T')[0],
          amount: Math.floor(Math.random() * 2000) + 500
        };
      });

      const mockAnalytics: VendorAnalytics = {
        revenue: {
          total: 45200,
          thisMonth: 15420,
          lastMonth: 13650,
          growth: 12.97,
          daily: dailyRevenue
        },
        sales: {
          total: 342,
          thisMonth: 87,
          lastMonth: 76,
          growth: 14.47,
          averageOrderValue: 177.20
        },
        products: {
          total: 24,
          active: 22,
          topSelling: [
            { name: 'Air Jordan 1 Retro High', sales: 45, revenue: 5625 },
            { name: 'Nike Dunk Low', sales: 38, revenue: 3800 },
            { name: 'Adidas Yeezy 350', sales: 32, revenue: 8000 },
            { name: 'New Balance 550', sales: 28, revenue: 3500 },
            { name: 'Converse Chuck 70', sales: 24, revenue: 2400 }
          ]
        },
        customers: {
          total: 256,
          returning: 89,
          retention: 34.8,
          satisfaction: 4.3
        },
        commissions: {
          total: 6780,
          thisMonth: 2313,
          rate: 15,
          pending: 420
        }
      };

      setAnalytics(mockAnalytics);

    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!analytics) return;

    const reportData = {
      vendorId,
      timeRange,
      generatedAt: new Date().toISOString(),
      analytics
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  if (!analytics) return null;

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
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 mt-1">Track your performance and sales metrics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={exportReport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.revenue.thisMonth.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {analytics.revenue.growth >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm ${analytics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(analytics.revenue.growth).toFixed(1)}% vs last month
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sales */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sales</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.sales.thisMonth}</p>
                <div className="flex items-center mt-1">
                  {analytics.sales.growth >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm ${analytics.sales.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(analytics.sales.growth).toFixed(1)}% vs last month
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Commissions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Commission</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.commissions.thisMonth.toLocaleString()}</p>
                <p className="text-sm text-purple-600">{analytics.commissions.rate}% rate</p>
              </div>
            </div>
          </div>

          {/* Customer Satisfaction */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.customers.satisfaction}</p>
                <p className="text-sm text-yellow-600">Average rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
            <div className="text-sm text-gray-500">
              Total: ${analytics.revenue.total.toLocaleString()}
            </div>
          </div>

          {/* Simple Chart Representation */}
          <div className="space-y-3">
            {analytics.revenue.daily.slice(-14).map((day, index) => {
              const maxRevenue = Math.max(...analytics.revenue.daily.map(d => d.amount));
              const percentage = (day.amount / maxRevenue) * 100;

              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-20 text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                    <div
                      className="bg-green-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="w-20 text-xs text-gray-900 text-right font-medium">
                    ${day.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Selling Products</h2>
            <div className="space-y-4">
              {analytics.products.topSelling.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
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

          {/* Customer Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer Insights</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.customers.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Returning Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.customers.returning}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600">{analytics.customers.retention}% retention</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">${analytics.sales.averageOrderValue}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Commission Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                ${analytics.commissions.total.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Total Earned</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                ${analytics.commissions.thisMonth.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">This Month</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {analytics.commissions.rate}%
              </div>
              <p className="text-sm text-gray-600">Commission Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                ${analytics.commissions.pending.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Pending Payout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}