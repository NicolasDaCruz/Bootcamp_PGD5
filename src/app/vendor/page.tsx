'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  BarChart3,
  Users,
  Star,
  Upload,
  Eye,
  Edit
} from 'lucide-react';

interface VendorStats {
  totalProducts: number;
  activeProducts: number;
  pendingApproval: number;
  totalSales: number;
  monthlyRevenue: number;
  commissionEarned: number;
  averageRating: number;
  totalReviews: number;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  sku: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  price: number;
  stock_quantity: number;
  created_at: string;
  images?: string[];
  sales_count?: number;
}

interface Sale {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  commission: number;
  order_date: string;
  customer_name?: string;
}

export default function VendorDashboard() {
  const [stats, setStats] = useState<VendorStats>({
    totalProducts: 0,
    activeProducts: 0,
    pendingApproval: 0,
    totalSales: 0,
    monthlyRevenue: 0,
    commissionEarned: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVendor, setIsVendor] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);


  useEffect(() => {
    const checkVendor = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to access vendor dashboard');
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
        await loadVendorData(profile.id);
      } else {
        setError('Access denied. Vendor privileges required.');
        setLoading(false);
      }
    };

    checkVendor();
  }, []);

  const loadVendorData = async (vendorId: string) => {
    try {
      setLoading(true);

      // Load vendor products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          brand,
          sku,
          approval_status,
          price,
          original_image_urls,
          created_at,
          product_variants (
            stock_quantity
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (productsError) throw productsError;

      // Process products data
      const processedProducts: Product[] = (productsData || []).map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        sku: product.sku,
        status: product.approval_status as any,
        price: product.price,
        stock_quantity: product.product_variants?.reduce((sum: number, variant: any) => sum + (variant.stock_quantity || 0), 0) || 0,
        created_at: product.created_at,
        images: product.original_image_urls,
        sales_count: Math.floor(Math.random() * 50) // Simulated for demo
      }));

      setProducts(processedProducts);

      // Calculate stats
      const totalProducts = processedProducts.length;
      const activeProducts = processedProducts.filter(p => p.status === 'approved').length;
      const pendingApproval = processedProducts.filter(p => p.status === 'pending' || p.status === 'submitted').length;

      // Simulated sales and commission data
      const mockStats: VendorStats = {
        totalProducts,
        activeProducts,
        pendingApproval,
        totalSales: 142,
        monthlyRevenue: 15420,
        commissionEarned: 2313,
        averageRating: 4.3,
        totalReviews: 87
      };

      setStats(mockStats);

      // Generate mock recent sales
      const mockSales: Sale[] = Array.from({ length: 5 }, (_, i) => ({
        id: `sale-${i}`,
        product_name: processedProducts[i % processedProducts.length]?.name || 'Product Name',
        quantity: Math.floor(Math.random() * 3) + 1,
        unit_price: Math.floor(Math.random() * 200) + 50,
        total_amount: 0,
        commission: 0,
        order_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        customer_name: ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emily Davis'][Math.floor(Math.random() * 4)]
      })).map(sale => ({
        ...sale,
        total_amount: sale.quantity * sale.unit_price,
        commission: sale.quantity * sale.unit_price * 0.15 // 15% commission
      }));

      setRecentSales(mockSales);

    } catch (err) {
      console.error('Error loading vendor data:', err);
      setError('Failed to load vendor data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { color: 'bg-green-100 text-green-800', label: 'Approved' };
      case 'pending':
      case 'submitted':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', label: 'Rejected' };
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800', label: 'Draft' };
      default:
        return { color: 'bg-blue-100 text-blue-800', label: status || 'Unknown' };
    }
  };

  if (!isVendor && error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">{error}</p>
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-3">
                If you're interested in becoming a vendor, please contact our team.
              </p>
              <a
                href="mailto:vendors@sneakervault.com"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply to Become a Vendor
              </a>
            </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your products and track your sales performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/vendor/products/new"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </Link>
              <Link
                href="/vendor/inventory"
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Package className="w-4 h-4" />
                <span>Manage Inventory</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-sm text-blue-600">{stats.activeProducts} active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5% from last month
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
                <p className="text-sm text-purple-600">Commission: ${stats.commissionEarned}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                <p className="text-sm text-yellow-600">{stats.totalReviews} reviews</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {stats.pendingApproval > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  {stats.pendingApproval} product{stats.pendingApproval !== 1 ? 's' : ''} pending approval
                </h3>
                <p className="text-sm text-yellow-700">
                  Your products are being reviewed by our team. This usually takes 24-48 hours.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/vendor/products/new"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Add Product</span>
            </Link>

            <Link
              href="/vendor/products"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <Package className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">My Products</span>
            </Link>

            <Link
              href="/vendor/inventory"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <Upload className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Bulk Upload</span>
            </Link>

            <Link
              href="/vendor/analytics"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <BarChart3 className="w-8 h-8 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Analytics</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Products</h2>
                <Link
                  href="/vendor/products"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {products.slice(0, 5).map((product) => {
                  const { color, label } = getStatusBadge(product.status);

                  return (
                    <div key={product.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            {product.brand} • ${product.price}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                          {label}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {product.sales_count || 0} sold
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
                <Link
                  href="/vendor/sales"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sale.product_name}</p>
                      <p className="text-sm text-gray-500">
                        {sale.customer_name} • Qty: {sale.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${sale.total_amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-green-600">
                        +${sale.commission.toFixed(2)} commission
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {((stats.activeProducts / Math.max(stats.totalProducts, 1)) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Product Approval Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                ${(stats.monthlyRevenue / Math.max(stats.totalSales, 1)).toFixed(0)}
              </div>
              <p className="text-sm text-gray-600">Avg Revenue per Sale</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {((stats.commissionEarned / Math.max(stats.monthlyRevenue, 1)) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Commission Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}