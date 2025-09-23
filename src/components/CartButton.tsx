'use client';

import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function CartButton() {
  const { state, toggleCart } = useCart();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleCart}
      className="fixed top-6 right-6 z-30 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-blue-700"
    >
      <div className="relative">
        <ShoppingBag className="w-6 h-6" />
        {state.itemCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
          >
            {state.itemCount > 99 ? '99+' : state.itemCount}
          </motion.span>
        )}
      </div>
    </motion.button>
  );
}