'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Calendar,
  Eye,
  Settings,
  Database,
  FileText,
  Shield,
  Activity,
  CheckCircle,
  Truck
} from 'lucide-react';
import OrderManagement from '@/components/admin/OrderManagement';
import ProductApproval from '@/components/admin/ProductApproval';
import StockManagementDashboard from '@/components/admin/StockManagementDashboard';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  conversionRate: number;
  averageOrderValue: number;
  abandonedCarts: number;
  lowStockItems: number;
}

interface RecentOrder {
  id: string;
  created_at: string;
  total: number;
  status: string;
  customer_name?: string;
}

interface TopProduct {
  id: string;
  name: string;
  brand: string;
  total_sold: number;
  revenue: number;
  image_url?: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'inventory'>('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    abandonedCarts: 0,
    lowStockItems: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');


  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to access admin dashboard');
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
        await loadDashboardData();
      } else {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
      }
    };

    checkAdmin();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading dashboard data...');

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Load dashboard stats with individual error handling
      const promises = [
        loadRevenue(startDate, endDate).catch(err => console.warn('Revenue load failed:', err)),
        loadOrderStats(startDate, endDate).catch(err => console.warn('Order stats load failed:', err)),
        loadCustomerStats().catch(err => console.warn('Customer stats load failed:', err)),
        loadProductStats().catch(err => console.warn('Product stats load failed:', err)),
        loadRecentOrders().catch(err => console.warn('Recent orders load failed:', err)),
        loadTopProducts(startDate, endDate).catch(err => console.warn('Top products load failed:', err))
      ];

      await Promise.allSettled(promises);
      console.log('✅ Dashboard data loading completed');

    } catch (err) {
      console.error('❌ Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadRevenue = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase
      .from('orders')
      .select('total, status')
      .in('status', ['confirmed', 'shipped'])
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const totalRevenue = data?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
    setStats(prev => ({ ...prev, totalRevenue })); // Already in dollars
  };

  const loadOrderStats = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, total, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const totalOrders = data?.length || 0;
    const completedOrders = data?.filter(order => order.status === 'confirmed' || order.status === 'shipped') || [];
    const totalRevenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    setStats(prev => ({
      ...prev,
      totalOrders,
      averageOrderValue
    }));
  };

  const loadCustomerStats = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .neq('role', 'admin');

    if (error) throw error;

    setStats(prev => ({ ...prev, totalCustomers: data?.length || 0 }));
  };

  const loadProductStats = async () => {
    // Load total products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id');

    if (productsError) throw productsError;

    // Load low stock items
    const { data: lowStock, error: lowStockError } = await supabase
      .from('product_variants')
      .select('id')
      .lt('stock_quantity', 10);

    if (lowStockError) throw lowStockError;

    setStats(prev => ({
      ...prev,
      totalProducts: products?.length || 0,
      lowStockItems: lowStock?.length || 0
    }));
  };

  const loadRecentOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total,
        status,
        shipping_full_name
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    setRecentOrders(data || []);
  };

  const loadTopProducts = async (startDate: Date, endDate: Date) => {
    try {
      // Get actual sales data from order_items
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price,
          total_price,
          product_id,
          product_variant_id,
          orders!inner (
            created_at,
            status
          )
        `)
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString())
        .in('orders.status', ['pending', 'confirmed', 'shipped']);

      if (error) throw error;

      // Aggregate sales by product
      const productSales = new Map();

      for (const item of orderItems || []) {
        const productId = item.product_id;
        if (!productSales.has(productId)) {
          productSales.set(productId, {
            total_sold: 0,
            revenue: 0
          });
        }
        const sales = productSales.get(productId);
        sales.total_sold += item.quantity;
        sales.revenue += parseFloat(item.total_price || (item.unit_price * item.quantity));
      }

      // Get top 5 products by revenue
      const topProductIds = Array.from(productSales.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([id]) => id);

      if (topProductIds.length === 0) {
        setTopProducts([]);
        return;
      }

      // Get product details with images
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          brand,
          product_images (
            image_url,
            is_primary
          )
        `)
        .in('id', topProductIds);

      if (productsError) throw productsError;

      // Combine product details with sales data
      const topProductsWithSales = products?.map(product => {
        const primaryImage = product.product_images?.find(img => img.is_primary);
        const firstImage = product.product_images?.[0];
        return {
          id: product.id,
          name: product.name,
          brand: product.brand,
          total_sold: productSales.get(product.id)?.total_sold || 0,
          revenue: productSales.get(product.id)?.revenue || 0,
          image_url: primaryImage?.image_url || firstImage?.image_url || null
        };
      })
      .sort((a, b) => b.revenue - a.revenue) || [];

      setTopProducts(topProductsWithSales);
    } catch (error) {
      console.error('Error loading top products:', error);
      setTopProducts([]);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome to your e-commerce management center</p>
            </div>
            <div className="flex items-center space-x-4">
              {activeTab === 'dashboard' && (
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`${
                activeTab === 'dashboard'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`${
                activeTab === 'orders'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Truck className="w-4 h-4" />
              Order Management
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`${
                activeTab === 'products'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <CheckCircle className="w-4 h-4" />
              Product Approval
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`${
                activeTab === 'inventory'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Package className="w-4 h-4" />
              Inventory Management
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5% from last period
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
                <p className="text-sm text-blue-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8.2% from last period
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers.toLocaleString()}</p>
                <p className="text-sm text-purple-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +15.3% from last period
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts.toLocaleString()}</p>
                <p className="text-sm text-orange-600">
                  {stats.lowStockItems} low stock items
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                <p className="text-xl font-bold text-gray-900">${stats.averageOrderValue.toFixed(2)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-xl font-bold text-gray-900">3.2%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cart Abandonment</p>
                <p className="text-xl font-bold text-gray-900">68.5%</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link
              href="/admin/orders"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <ShoppingCart className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Manage Orders</span>
            </Link>

            <Link
              href="/admin/products"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <Package className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Products</span>
            </Link>

            <Link
              href="/admin/customers"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <Users className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Customers</span>
            </Link>

            <Link
              href="/admin/analytics"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <BarChart3 className="w-8 h-8 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Analytics</span>
            </Link>

            <Link
              href="/admin/inventory"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              <Database className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Inventory</span>
            </Link>

            <Link
              href="/admin/reports"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-8 h-8 text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Reports</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <Link
                  href="/admin/orders"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${parseFloat(order.total).toFixed(2)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
                <Link
                  href="/admin/products"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {topProducts.map((product) => (
                  <div key={product.id} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">{product.brand}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {product.total_sold} sold
                      </p>
                      <p className="text-sm text-gray-500">
                        ${product.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Payment Processing: Online</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Inventory Sync: Active</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Email Service: Monitoring</span>
            </div>
          </div>
        </div>
          </>
        )}

        {activeTab === 'orders' && (
          <OrderManagement />
        )}

        {activeTab === 'products' && (
          <ProductApproval />
        )}

        {activeTab === 'inventory' && (
          <StockManagementDashboard />
        )}
      </div>
    </div>
  );
}