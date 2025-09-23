'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useWishlist } from '@/contexts/WishlistContext';

export default function WishlistButton() {
  const { state } = useWishlist();

  return (
    <Link href="/wishlist">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-6 right-20 z-30 bg-red-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-red-600"
      >
        <div className="relative">
          <Heart className="w-6 h-6 fill-current" />
          {state.itemCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
            >
              {state.itemCount > 99 ? '99+' : state.itemCount}
            </motion.span>
          )}
        </div>
      </motion.button>
    </Link>
  );
}