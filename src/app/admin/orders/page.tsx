'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Order, OrderItem, getAllOrders, updateOrderStatus, updateShippingStatus, getOrderWithItems, searchOrders, getOrderConfirmationData } from '../../../../lib/order-utils';
import { sendShippingUpdateEmail, sendDeliveryConfirmationEmail, getCustomerEmailFromOrder, EmailData } from '../../../../lib/email';

interface OrderWithItems extends Order {
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | ''>('');
  const [shippingStatusFilter, setShippingStatusFilter] = useState<Order['shipping_status'] | ''>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    shippingStatus: '',
    trackingNumber: '',
    estimatedDelivery: ''
  });


  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to access admin panel');
        setLoading(false);
        return;
      }

      // Check if user is admin (you can implement role-based access control)
      // For now, check if user email is in admin list or has admin role
      const { data: profile } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin' || profile?.email?.includes('admin')) {
        setIsAdmin(true);
        await loadOrders();
      } else {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await getAllOrders(100, 0, statusFilter || undefined, shippingStatusFilter || undefined);
      setOrders(allOrders);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
    }
  }, [statusFilter, shippingStatusFilter, isAdmin]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await loadOrders();
      return;
    }

    try {
      const searchResults = await searchOrders(searchTerm);
      setOrders(searchResults);
    } catch (err) {
      console.error('Error searching orders:', err);
      setError('Search failed');
    }
  };

  const handleViewDetails = async (orderId: string) => {
    try {
      const orderData = await getOrderWithItems(orderId);
      if (orderData) {
        setSelectedOrder({
          ...orderData.order,
          items: orderData.items
        });
        setUpdateForm({
          status: orderData.order.status,
          shippingStatus: orderData.order.shipping_status,
          trackingNumber: orderData.order.tracking_number || '',
          estimatedDelivery: orderData.order.estimated_delivery || ''
        });
      }
    } catch (err) {
      console.error('Error loading order details:', err);
      setError('Failed to load order details');
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    try {
      const updates: any = {};
      let emailSent = false;

      // Update order status if changed
      if (updateForm.status !== selectedOrder.status) {
        const success = await updateOrderStatus(selectedOrder.id, updateForm.status as Order['status']);
        if (!success) throw new Error('Failed to update order status');
        updates.status = updateForm.status;
      }

      // Update shipping status if changed
      if (updateForm.shippingStatus !== selectedOrder.shipping_status ||
          updateForm.trackingNumber !== (selectedOrder.tracking_number || '') ||
          updateForm.estimatedDelivery !== (selectedOrder.estimated_delivery || '')) {

        const success = await updateShippingStatus(
          selectedOrder.id,
          updateForm.shippingStatus as Order['shipping_status'],
          updateForm.trackingNumber || undefined,
          updateForm.estimatedDelivery || undefined
        );

        if (!success) throw new Error('Failed to update shipping status');

        updates.shipping_status = updateForm.shippingStatus;
        if (updateForm.trackingNumber) updates.tracking_number = updateForm.trackingNumber;
        if (updateForm.estimatedDelivery) updates.estimated_delivery = updateForm.estimatedDelivery;

        // Send email notifications for shipping updates
        if (updateForm.shippingStatus === 'shipped' && selectedOrder.shipping_status !== 'shipped') {
          await sendShippingNotification(selectedOrder, updateForm.trackingNumber);
          emailSent = true;
        } else if (updateForm.shippingStatus === 'delivered' && selectedOrder.shipping_status !== 'delivered') {
          await sendDeliveryNotification(selectedOrder);
          emailSent = true;
        }
      }

      // Update local state
      setSelectedOrder({
        ...selectedOrder,
        ...updates
      });

      // Reload orders list
      await loadOrders();

      alert(`Order updated successfully${emailSent ? ' and customer notified' : ''}`);
    } catch (err) {
      console.error('Error updating order:', err);
      setError('Failed to update order');
    }
  };

  const sendShippingNotification = async (order: Order, trackingNumber?: string) => {
    try {
      const customerEmail = await getCustomerEmailFromOrder(order);
      if (!customerEmail) return;

      const confirmationData = await getOrderConfirmationData(order.id);
      if (!confirmationData) return;

      const emailData: EmailData = {
        ...confirmationData,
        customerEmail
      };

      await sendShippingUpdateEmail(emailData, trackingNumber);
    } catch (err) {
      console.error('Error sending shipping notification:', err);
    }
  };

  const sendDeliveryNotification = async (order: Order) => {
    try {
      const customerEmail = await getCustomerEmailFromOrder(order);
      if (!customerEmail) return;

      const confirmationData = await getOrderConfirmationData(order.id);
      if (!confirmationData) return;

      const emailData: EmailData = {
        ...confirmationData,
        customerEmail
      };

      await sendDeliveryConfirmationEmail(emailData);
    } catch (err) {
      console.error('Error sending delivery notification:', err);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getShippingStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
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
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
          <p className="text-gray-600">Manage customer orders and shipping</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Order ID or Payment Intent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Order['status'] | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Status
              </label>
              <select
                value={shippingStatusFilter}
                onChange={(e) => setShippingStatusFilter(e.target.value as Order['shipping_status'] | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Shipping Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadOrders}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipping
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.slice(0, 8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.order_number || 'No order number'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.user_id ? 'Registered User' : 'Guest'}
                      </div>
                      {order.shipping_address && (
                        <div className="text-sm text-gray-500">
                          {order.shipping_address.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${Number(order.total).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getShippingStatusBadgeColor(order.shipping_status || 'pending')}`}>
                        {order.shipping_status ? order.shipping_status.replace('_', ' ') : 'pending'}
                      </span>
                      {order.tracking_number && (
                        <div className="text-xs text-gray-500 mt-1">
                          Track: {order.tracking_number}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(order.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order Management - #{selectedOrder.id.slice(0, 8)}
                  </h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Order Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Order ID</p>
                        <p className="text-sm text-gray-900">{selectedOrder.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Order Number</p>
                        <p className="text-sm text-gray-900 font-mono">{selectedOrder.order_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Order Date</p>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedOrder.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Amount</p>
                        <p className="text-sm text-gray-900 font-semibold">
                          ${Number(selectedOrder.total).toFixed(2)} {selectedOrder.currency.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Update Form */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Order</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Order Status
                        </label>
                        <select
                          value={updateForm.status}
                          onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shipping Status
                        </label>
                        <select
                          value={updateForm.shippingStatus}
                          onChange={(e) => setUpdateForm({ ...updateForm, shippingStatus: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="in_transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tracking Number
                        </label>
                        <input
                          type="text"
                          value={updateForm.trackingNumber}
                          onChange={(e) => setUpdateForm({ ...updateForm, trackingNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter tracking number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estimated Delivery
                        </label>
                        <input
                          type="date"
                          value={updateForm.estimatedDelivery}
                          onChange={(e) => setUpdateForm({ ...updateForm, estimatedDelivery: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <button
                        onClick={handleUpdateOrder}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Update Order
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-3 border rounded-lg">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                          <p className="text-sm text-gray-500">{item.product_brand}</p>
                          {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                          {item.color && <p className="text-sm text-gray-500">Color: {item.color}</p>}
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ${(item.total_price / 100).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${(item.unit_price / 100).toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shipping_address && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Address</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedOrder.shipping_address.name}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.shipping_address.line1}</p>
                      {selectedOrder.shipping_address.line2 && (
                        <p className="text-sm text-gray-600">{selectedOrder.shipping_address.line2}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.postal_code}
                      </p>
                      <p className="text-sm text-gray-600">{selectedOrder.shipping_address.country}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}