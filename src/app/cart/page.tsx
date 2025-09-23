'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Clock,
  AlertTriangle,
  ArrowRight,
  Package,
  Shield
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

interface ReservationTimer {
  itemId: string;
  expiry: string;
  timeLeft: string;
}

export default function CartPage() {
  const { state, removeItem, updateQuantity, validateStockAndUpdate } = useCart();
  const [reservationTimers, setReservationTimers] = useState<ReservationTimer[]>([]);

  // Update reservation timers
  useEffect(() => {
    const updateTimers = () => {
      const timers: ReservationTimer[] = [];

      state.items.forEach(item => {
        if (item.reservationExpiry) {
          const expiry = new Date(item.reservationExpiry);
          const now = new Date();
          const timeLeft = expiry.getTime() - now.getTime();

          if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            timers.push({
              itemId: item.id,
              expiry: item.reservationExpiry,
              timeLeft: `${minutes}:${seconds.toString().padStart(2, '0')}`
            });
          }
        }
      });

      setReservationTimers(timers);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, [state.items]);

  // Validate stock when page loads
  useEffect(() => {
    validateStockAndUpdate();
  }, [validateStockAndUpdate]);

  const getItemStockIssue = (itemId: string) => {
    return state.stockIssues.find(issue => issue.itemId === itemId);
  };

  const getItemTimer = (itemId: string) => {
    return reservationTimers.find(timer => timer.itemId === itemId);
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      await updateQuantity(itemId, newQuantity);
    }
  };

  const calculateSubtotal = () => {
    return state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.08; // 8% tax
  };

  const calculateShipping = (subtotal: number) => {
    return subtotal >= 50 ? 0 : 9.99; // Free shipping over $50
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const shipping = calculateShipping(subtotal);
  const total = subtotal + tax + shipping;

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <ShoppingCart className="w-24 h-24 text-slate-400 dark:text-slate-600 mx-auto mb-8" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Your cart is empty
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Looks like you haven&apos;t added any sneakers to your cart yet.
              Start shopping to find your perfect pair!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Shopping
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Shopping Cart
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {state.itemCount} {state.itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {state.items.map((item) => {
                const stockIssue = getItemStockIssue(item.id);
                const timer = getItemTimer(item.id);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border ${
                      stockIssue ? 'border-red-200 dark:border-red-800' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {/* Stock Issue Alert */}
                    {stockIssue && (
                      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">{stockIssue.message}</span>
                      </div>
                    )}

                    {/* Reservation Timer */}
                    {timer && (
                      <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 p-3 rounded-lg mb-4">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Reserved for {timer.timeLeft} - Complete checkout to secure your item
                        </span>
                      </div>
                    )}

                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {item.name}
                            </h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              {item.brand}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                          <span>Size: {item.size}</span>
                          <span>Color: {item.color}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Qty:
                            </span>
                            <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-lg transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-3 py-1 min-w-[2.5rem] text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-lg transition-colors"
                                disabled={item.quantity >= item.maxStock}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {item.maxStock} available
                            </span>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              ${item.price.toFixed(2)} each
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Shipping</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Tax</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ${tax.toFixed(2)}
                  </span>
                </div>

                <hr className="border-slate-200 dark:border-slate-700" />

                <div className="flex justify-between text-lg">
                  <span className="font-bold text-slate-900 dark:text-white">Total</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Free Shipping Progress */}
              {shipping > 0 && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Add ${(50 - subtotal).toFixed(2)} more for free shipping
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((subtotal / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Security Badge */}
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
                <Shield className="w-4 h-4" />
                <span>Secure checkout with SSL encryption</span>
              </div>

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-4"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </Link>

              {/* Continue Shopping */}
              <Link
                href="/products"
                className="w-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-center block"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}