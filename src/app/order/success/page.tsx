'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, CreditCard, ArrowRight, Download, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getOrderByPaymentIntent, getOrderConfirmationData } from '../../../../lib/order-utils';
import { Order, OrderConfirmationData } from '../../../../lib/order-utils';
import { useCart } from '../../../contexts/CartContext';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<OrderConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        // Get payment intent ID from URL params
        const paymentIntentId = searchParams.get('payment_intent');
        const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');

        if (!paymentIntentId) {
          // If no payment intent ID, try to get the most recent order for the user
          // This handles the case where users are redirected without query params
          setError('Order not found. Please check your email for order confirmation.');
          return;
        }

        console.log('🔍 Fetching order for payment intent:', paymentIntentId);

        // Get order details by payment intent
        const orderData = await getOrderByPaymentIntent(paymentIntentId);

        if (!orderData) {
          setError('Order not found. Please check your email for order confirmation.');
          return;
        }

        // Get full order confirmation data
        const confirmationData = await getOrderConfirmationData(orderData.id);

        if (!confirmationData) {
          setError('Unable to load order details. Please check your email for order confirmation.');
          return;
        }

        setOrder(confirmationData);
        console.log('✅ Order data loaded successfully:', confirmationData);

        // Clear the cart since order was successfully created
        try {
          await clearCart();
          console.log('✅ Cart cleared successfully after order confirmation');
        } catch (cartError) {
          console.error('⚠️ Error clearing cart after order:', cartError);
          // Don't fail the success page if cart clearing fails
        }

      } catch (error) {
        console.error('Error fetching order data:', error);
        setError('Unable to load order details. Please check your email for order confirmation.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [searchParams]);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Order Information</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">{error}</p>
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              Back to Home
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <motion.div
          variants={cardVariants}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            className="mx-auto h-20 w-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mb-6"
          >
            <CheckCircle className="h-10 w-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
            Order Confirmed!
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-4">
            Thank you for your purchase
          </p>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-4 inline-block">
            <p className="text-sm text-slate-500 dark:text-slate-400">Order Number</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">#{order.order.order_number}</p>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <motion.div
            variants={cardVariants}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Package className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Order Summary</h2>
            </div>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={`${item.product_id}-${item.product_variant_id}`} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="h-16 w-16 bg-slate-200 dark:bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.product?.original_image_urls?.[0] ? (
                      <Image
                        src={item.product.original_image_urls[0]}
                        alt={item.product_name || 'Product'}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{item.product_name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Size {item.variant_value} • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 mt-6 pt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                <span className="text-slate-900 dark:text-white">${parseFloat(order.order.subtotal || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Shipping</span>
                <span className="text-slate-900 dark:text-white">${parseFloat(order.order.shipping_amount || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Tax</span>
                <span className="text-slate-900 dark:text-white">${parseFloat(order.order.tax_amount || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-slate-900 dark:text-white">Total</span>
                <span className="text-slate-900 dark:text-white">${parseFloat(order.order.total || '0').toFixed(2)}</span>
              </div>
            </div>
          </motion.div>

          {/* Order Details */}
          <motion.div
            variants={cardVariants}
            className="space-y-6"
          >
            {/* Shipping Information */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Shipping Address</h3>
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                <p className="font-medium text-slate-900 dark:text-white">{order.order.shipping_full_name}</p>
                <p>{order.order.shipping_address}</p>
                <p>{order.order.shipping_city}, {order.order.shipping_postal_code}</p>
                <p>{order.order.shipping_country}</p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payment Method</h3>
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                <p className="capitalize">{order.order.payment_method || 'card'}</p>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Payment Confirmed</p>
              </div>
            </div>

            {/* Order Status */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Status</h3>
              </div>
              <div className="space-y-2">
                <p className="text-green-600 dark:text-green-400 font-medium capitalize">
                  {order.order.status || 'confirmed'}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  You will receive email updates as your order is processed and shipped.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          variants={cardVariants}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href={`/order/track?order=${order.order.order_number}`}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            Track Your Order
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
          >
            Continue Shopping
          </Link>
        </motion.div>

        {/* Help Section */}
        <motion.div
          variants={cardVariants}
          className="mt-8 text-center"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Need help with your order?{' '}
            <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
              Contact our support team
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}