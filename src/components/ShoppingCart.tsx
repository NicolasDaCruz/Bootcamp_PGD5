'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Trash2,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import ReservationStatus from './ReservationStatus';

export default function ShoppingCart() {
  const { state, removeItem, updateQuantity, closeCart } = useCart();

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeCart}
          />

          {/* Cart Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Shopping Cart
                  </h2>
                  {state.itemCount > 0 && (
                    <span className="bg-blue-600 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center">
                      {state.itemCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={closeCart}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Reservation Status */}
              {state.items.length > 0 && (
                <div className="px-6 pb-4">
                  <ReservationStatus showInline={true} />
                </div>
              )}
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto">
              {state.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Discover our amazing collection of sneakers and start shopping!
                  </p>
                  <Link
                    href="/products"
                    onClick={closeCart}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {state.items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 flex gap-4"
                    >
                      {/* Product Image */}
                      <div className="relative w-20 h-20 bg-white dark:bg-slate-600 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight mb-1">
                          {item.name}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 text-xs mb-2">
                          {item.brand}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-3">
                          <span>Size: {item.size}</span>
                          <span>•</span>
                          <span>Color: {item.color}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-md">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 py-1 text-sm font-medium text-slate-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.maxStock}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                ${item.price.toFixed(2)} each
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors flex-shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {state.items.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 p-6 space-y-4">
                {/* Total */}
                <div className="flex items-center justify-between text-lg font-bold text-slate-900 dark:text-white">
                  <span>Total</span>
                  <span>${state.total.toFixed(2)}</span>
                </div>

                {/* Shipping Notice */}
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {state.total >= 100
                      ? 'Free shipping included!'
                      : `Add $${(100 - state.total).toFixed(2)} more for free shipping`
                    }
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={closeCart}
                    className="w-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}