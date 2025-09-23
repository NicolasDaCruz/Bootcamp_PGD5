'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  CreditCard,
  ArrowLeft,
  Search,
  Filter,
  Eye,
  X,
  ShoppingBag
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Order, OrderItem, getUserOrders, getOrderWithItems } from '../../../lib/order-utils';

interface OrderWithItems extends Order {
  items: OrderItem[];
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: 'client' | 'vendeur' | 'admin';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();


  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userData) {
        setUser(userData);
        await loadOrders(userData.id);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('Please sign in to view your orders');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (userId: string) => {
    try {
      setLoading(true);
      const userOrders = await getUserOrders(userId);

      // Get items for each order
      const ordersWithItems = await Promise.all(
        userOrders.map(async (order) => {
          const orderData = await getOrderWithItems(order.id);
          return {
            ...order,
            items: orderData?.items || []
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'confirmed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'processing': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'shipped': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30';
      case 'delivered': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'refunded': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      case 'failed': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getShippingStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'shipped':
      case 'in_transit': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'processing': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center max-w-md mx-4">
          <Package className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Error Loading Orders</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/account"
              className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                My Orders
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Track and manage your sneaker orders
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order ID, tracking number, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No orders found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {orders.length === 0
                ? "You haven't placed any orders yet. Start shopping to see your orders here."
                : "No orders match your search criteria. Try adjusting your filters."
              }
            </p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
              >
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Order #{order.id.slice(0, 8)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          ${Number(order.total).toFixed(2)}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2">
                        <Package className="w-6 h-6 text-slate-500" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {item.product_name}
                        </span>
                        {item.variant_name && (
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            ({item.variant_name}: {item.variant_value})
                          </span>
                        )}
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="flex items-center px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                        +{order.items.length - 3} more items
                      </div>
                    )}
                  </div>

                  {/* Shipping Status */}
                  {order.shipping_status && (
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${getShippingStatusColor(order.shipping_status)}`}>
                      <Truck className="w-4 h-4" />
                      <span className="capitalize">{order.shipping_status.replace('_', ' ')}</span>
                    </div>
                  )}

                  {/* Tracking Info */}
                  {order.tracking_number && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                      <Package className="w-4 h-4" />
                      <span>Tracking: {order.tracking_number}</span>
                    </div>
                  )}

                  {/* Estimated Delivery */}
                  {order.estimated_delivery && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span>Estimated delivery: {formatDate(order.estimated_delivery)}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Order Details */}
                {selectedOrder?.id === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                  >
                    <div className="p-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Shipping Address */}
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            Shipping Address
                          </h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            <p>{order.shipping_full_name}</p>
                            <p>{order.shipping_address}</p>
                            <p>{order.shipping_city}, {order.shipping_postal_code}</p>
                            <p>{order.shipping_country}</p>
                          </div>
                        </div>

                        {/* Payment Info */}
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Payment Info
                          </h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            <p>Order: {order.order_number}</p>
                            <p>Total: ${Number(order.total).toFixed(2)}</p>
                            <p>Payment Status: {order.payment_status || 'Pending'}</p>
                            {order.payment_method && <p>Method: {order.payment_method}</p>}
                          </div>
                        </div>
                      </div>

                      {/* All Order Items */}
                      <div className="mt-6">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Order Items</h4>
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Package className="w-12 h-12 text-slate-500" />
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-white">
                                    {item.product_name}
                                  </div>
                                  <div className="text-sm text-slate-600 dark:text-slate-400">
                                    {item.variant_name && `${item.variant_name}: ${item.variant_value} • `}
                                    {item.product_sku && `SKU: ${item.product_sku} • `}
                                    Qty: {item.quantity}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  ${Number(item.total_price).toFixed(2)}
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                  ${Number(item.unit_price).toFixed(2)} each
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}