'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  ShoppingCart,
  Eye,
  Heart
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  tags: string[];
  isNew?: boolean;
  isOnSale?: boolean;
}

interface RelatedProductsProps {
  currentProduct: {
    id: string;
    category: string;
    brand: string;
    tags: string[];
    price: number;
  };
}

// Mock products database
const allProducts: Product[] = [
  {
    id: '3',
    name: 'Nike Air Force 1 Low',
    brand: 'Nike',
    price: 90,
    originalPrice: 110,
    image: '/api/placeholder/400/400',
    rating: 4.7,
    reviewCount: 892,
    category: 'Basketball',
    tags: ['classic', 'white', 'basketball', 'lifestyle'],
    isOnSale: true
  },
  {
    id: '4',
    name: 'Air Jordan 3 Retro',
    brand: 'Nike',
    price: 200,
    image: '/api/placeholder/400/400',
    rating: 4.8,
    reviewCount: 654,
    category: 'Basketball',
    tags: ['retro', 'basketball', 'iconic', 'michael jordan']
  },
  {
    id: '5',
    name: 'Adidas Stan Smith',
    brand: 'Adidas',
    price: 80,
    image: '/api/placeholder/400/400',
    rating: 4.5,
    reviewCount: 1203,
    category: 'Lifestyle',
    tags: ['classic', 'white', 'tennis', 'minimal']
  },
  {
    id: '6',
    name: 'Nike Dunk Low',
    brand: 'Nike',
    price: 100,
    image: '/api/placeholder/400/400',
    rating: 4.6,
    reviewCount: 567,
    category: 'Lifestyle',
    tags: ['streetwear', 'basketball', 'retro'],
    isNew: true
  },
  {
    id: '7',
    name: 'Yeezy Boost 350 V2 Cream',
    brand: 'Adidas',
    price: 220,
    image: '/api/placeholder/400/400',
    rating: 4.7,
    reviewCount: 423,
    category: 'Lifestyle',
    tags: ['yeezy', 'boost', 'lifestyle', 'cream']
  },
  {
    id: '8',
    name: 'Nike Air Max 90',
    brand: 'Nike',
    price: 120,
    originalPrice: 140,
    image: '/api/placeholder/400/400',
    rating: 4.4,
    reviewCount: 789,
    category: 'Running',
    tags: ['air max', 'running', 'classic', 'retro'],
    isOnSale: true
  },
  {
    id: '9',
    name: 'Converse Chuck Taylor All Star',
    brand: 'Converse',
    price: 55,
    image: '/api/placeholder/400/400',
    rating: 4.3,
    reviewCount: 1567,
    category: 'Lifestyle',
    tags: ['classic', 'canvas', 'high-top', 'retro']
  },
  {
    id: '10',
    name: 'Nike Air Jordan 11 Retro',
    brand: 'Nike',
    price: 220,
    image: '/api/placeholder/400/400',
    rating: 4.9,
    reviewCount: 892,
    category: 'Basketball',
    tags: ['retro', 'basketball', 'premium', 'michael jordan']
  }
];

// Recommendation algorithm
const getRelatedProducts = (currentProduct: RelatedProductsProps['currentProduct'], limit = 8): Product[] => {
  return allProducts
    .filter(product => product.id !== currentProduct.id) // Exclude current product
    .map(product => {
      let score = 0;

      // Same brand bonus
      if (product.brand === currentProduct.brand) {
        score += 30;
      }

      // Same category bonus
      if (product.category === currentProduct.category) {
        score += 25;
      }

      // Price range similarity (within 30% range)
      const priceDiff = Math.abs(product.price - currentProduct.price);
      const priceRange = currentProduct.price * 0.3;
      if (priceDiff <= priceRange) {
        score += 20;
      }

      // Tag similarity
      const commonTags = product.tags.filter(tag =>
        currentProduct.tags.includes(tag)
      ).length;
      score += commonTags * 10;

      // Rating bonus (higher rated products get slight preference)
      score += product.rating * 2;

      // Popularity bonus (more reviews = more popular)
      score += Math.min(product.reviewCount / 100, 10);

      return { ...product, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

export default function RelatedProducts({ currentProduct }: RelatedProductsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addToCartWithNotification } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const relatedProducts = getRelatedProducts(currentProduct);
  const visibleProducts = 4; // Number of products visible at once

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < relatedProducts.length - visibleProducts;

  // Handle adding product to cart with default size
  const handleAddToCart = (product: Product) => {
    addToCartWithNotification({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      size: 'US 10', // Default size for quick add
      color: 'Default',
      quantity: 1,
      maxStock: 10 // Default stock
    });
  };

  // Handle wishlist toggle
  const handleWishlistToggle = (product: Product) => {
    const wishlistItem = {
      id: product.id,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      rating: product.rating,
      reviewCount: product.reviewCount,
      isNew: product.isNew,
      isOnSale: product.isOnSale,
      dateAdded: new Date().toISOString(),
      slug: product.name.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '').replace(/[^a-z0-9-]/g, '')
    };

    toggleWishlist(wishlistItem);
  };

  const scrollToIndex = (index: number) => {
    setCurrentIndex(index);
    if (scrollContainerRef.current) {
      const productWidth = scrollContainerRef.current.scrollWidth / relatedProducts.length;
      scrollContainerRef.current.scrollTo({
        left: index * productWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollLeft = () => {
    if (canScrollLeft) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      scrollToIndex(currentIndex + 1);
    }
  };

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Related Products
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              You might also like these products
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex gap-2">
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full border transition-all ${
                canScrollLeft
                  ? 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`p-2 rounded-full border transition-all ${
                canScrollRight
                  ? 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Products Carousel */}
        <div className="relative overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 transition-transform duration-300 overflow-x-auto scrollbar-hide"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {relatedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-64 group"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4 h-full hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-white dark:bg-slate-600 rounded-xl overflow-hidden mb-4">
                    {/* Badges */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                      {product.isNew && (
                        <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                          NEW
                        </span>
                      )}
                      {product.isOnSale && (
                        <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                          SALE
                        </span>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/products/${product.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
                      >
                        <Eye className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                      </Link>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleWishlistToggle(product)}
                        className="w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            isInWishlist(product.id)
                              ? 'text-red-500 fill-red-500'
                              : 'text-slate-700 dark:text-slate-300 hover:text-red-500'
                          }`}
                        />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleAddToCart(product)}
                        className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:bg-blue-700"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </motion.button>
                    </div>

                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="256px"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {product.brand}
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(product.rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        ({product.reviewCount})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <>
                          <span className="text-sm text-slate-500 dark:text-slate-400 line-through">
                            ${product.originalPrice}
                          </span>
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        {relatedProducts.length > visibleProducts && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.ceil(relatedProducts.length / visibleProducts) }).map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  Math.floor(currentIndex / visibleProducts) === index
                    ? 'bg-blue-600 w-6'
                    : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}