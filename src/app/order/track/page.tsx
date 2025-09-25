'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  Home,
  AlertCircle,
  Search,
  Copy,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  total: number;
  currency: string;
  customer_email: string;
  shipping_full_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_country: string;
  shipping_postal_code: string;
  shipping_status: string;
  tracking_number: string;
  estimated_delivery_date?: string;
  payment_status: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  brand: string;
  variant_name: string;
  variant_value: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  original_image_urls?: string[];
}

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  timestamp: string;
  location?: string;
}

export default function OrderTrackingPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchOrderNumber, setSearchOrderNumber] = useState(orderNumber || '');

  useEffect(() => {
    if (orderNumber) {
      fetchOrderDetails(orderNumber);
    } else {
      setLoading(false);
    }
  }, [orderNumber]);

  const fetchOrderDetails = async (orderNum: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/track?order=${encodeURIComponent(orderNum)}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found. Please check your order number.');
        }
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data.order);
      setOrderItems(data.items);
      setTrackingEvents(data.tracking || generateMockTracking(data.order));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateMockTracking = (order: Order): TrackingEvent[] => {
    const events: TrackingEvent[] = [];

    // Order placed
    events.push({
      id: '1',
      status: 'confirmed',
      description: 'Order confirmed and payment processed',
      timestamp: order.created_at,
      location: 'Online Store'
    });

    // Based on current status, add appropriate events
    if (['processing', 'shipped', 'delivered'].includes(order.status)) {
      events.push({
        id: '2',
        status: 'processing',
        description: 'Order is being prepared for shipment',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        location: 'Fulfillment Center'
      });
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      events.push({
        id: '3',
        status: 'shipped',
        description: 'Package shipped and in transit',
        timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        location: 'Distribution Center'
      });
    }

    if (order.status === 'delivered') {
      events.push({
        id: '4',
        status: 'delivered',
        description: 'Package delivered successfully',
        timestamp: order.updated_at,
        location: order.shipping_address
      });
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'pending':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Package className="w-5 h-5 text-yellow-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <Home className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'pending':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'shipped':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'delivered':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const copyTrackingNumber = () => {
    if (order?.tracking_number) {
      navigator.clipboard.writeText(order.tracking_number);
      // You could add a toast notification here
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchOrderNumber.trim()) {
      window.location.href = `/order/track?order=${encodeURIComponent(searchOrderNumber.trim())}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderNumber || error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Track Your Order
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Enter your order number to see the latest updates
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Order Number
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchOrderNumber}
                    onChange={(e) => setSearchOrderNumber(e.target.value)}
                    placeholder="ORD-20250924-000017"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Track Order
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Order Tracking
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Order #{order.order_number}
              </p>
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="font-medium capitalize">{order.status}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Tracking Information
              </h2>

              {order.tracking_number && (
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Tracking Number
                      </p>
                      <p className="text-lg font-mono text-slate-900 dark:text-white">
                        {order.tracking_number}
                      </p>
                    </div>
                    <button
                      onClick={copyTrackingNumber}
                      className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {trackingEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full ${
                        event.status === order.status
                          ? 'bg-blue-600'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}>
                        {event.status === order.status ? (
                          <div className="w-3 h-3 bg-white rounded-full" />
                        ) : (
                          getStatusIcon(event.status)
                        )}
                      </div>
                      {index < trackingEvents.length - 1 && (
                        <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700 mt-2" />
                      )}
                    </div>

                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {event.description}
                        </h3>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(event.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(event.timestamp).toLocaleTimeString()}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Order Items
              </h2>

              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-20 h-20 bg-slate-200 dark:bg-slate-600 rounded-lg overflow-hidden flex-shrink-0">
                      {item.original_image_urls && item.original_image_urls.length > 0 ? (
                        <Image
                          src={item.original_image_urls[0]}
                          alt={item.product_name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-400 m-6" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {item.product_name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {item.brand}
                      </p>
                      {item.variant_name && item.variant_value && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.variant_name}: {item.variant_value}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Qty: {item.quantity}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          ${item.total_price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            {/* Order Details */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Order Details
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Order Date</span>
                  <span className="text-slate-900 dark:text-white">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Payment Status</span>
                  <span className={`capitalize ${
                    order.payment_status === 'paid'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {order.payment_status}
                  </span>
                </div>

                {order.estimated_delivery_date && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Est. Delivery</span>
                    <span className="text-slate-900 dark:text-white">
                      {new Date(order.estimated_delivery_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <hr className="border-slate-200 dark:border-slate-700" />

                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-slate-900 dark:text-white">Total</span>
                  <span className="text-slate-900 dark:text-white">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>

              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-medium text-slate-900 dark:text-white">
                  {order.shipping_full_name}
                </p>
                <p>{order.shipping_address}</p>
                <p>
                  {order.shipping_city}, {order.shipping_postal_code}
                </p>
                <p>{order.shipping_country}</p>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Need Help?
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-200 mb-4">
                If you have questions about your order, contact our support team.
              </p>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1">
                <ExternalLink className="w-4 h-4" />
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}