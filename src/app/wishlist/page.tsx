'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Star,
  ShoppingCart,
  Trash2,
  X,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  Search,
  Share2,
  ArrowRight,
  Calendar,
  TrendingUp,
  Tag
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'name';
type ViewMode = 'grid' | 'list';

export default function WishlistPage() {
  const { state: wishlistState, removeItem, clearWishlist } = useWishlist();
  const { addToCartWithNotification } = useCart();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter and sort wishlist items
  const filteredItems = wishlistState.items
    .filter(item => {
      const matchesSearch = searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case 'oldest':
          return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(wishlistState.items.map(item => item.category)))];

  const handleRemoveItem = (productId: string, itemName: string) => {
    removeItem(productId);
  };

  const handleAddToCart = (item: any) => {
    // For wishlist items, we need to provide default values since they don't have size/color info
    addToCartWithNotification({
      productId: item.productId,
      name: item.name,
      brand: item.brand,
      price: item.price,
      image: item.image,
      size: 'US 10', // Default size - user can change in cart
      color: 'Default', // Default color - user can change in cart
      quantity: 1,
      maxStock: 10 // Default stock
    });
  };

  const handleClearWishlist = () => {
    clearWishlist();
    setShowClearConfirm(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    },
    exit: {
      opacity: 0,
      x: -100,
      transition: { duration: 0.3 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                    My Wishlist
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {wishlistState.itemCount} {wishlistState.itemCount === 1 ? 'item' : 'items'} saved
                  </p>
                </div>
              </div>

              {wishlistState.itemCount > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              )}
            </div>

            {/* Search and Filters */}
            {wishlistState.itemCount > 0 && (
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search wishlist..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <SortAsc className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="name">Name A-Z</option>
                    </select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {wishlistState.itemCount === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Start adding products to your wishlist by clicking the heart icon on any product you love.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Browse Products
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        ) : (
          // Wishlist Items
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Results Info */}
            <motion.div
              variants={itemVariants}
              className="mb-6 text-sm text-slate-600 dark:text-slate-400"
            >
              Showing {filteredItems.length} of {wishlistState.itemCount} items
              {searchQuery && ` for "${searchQuery}"`}
              {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            </motion.div>

            {/* Items Grid/List */}
            <AnimatePresence mode="popLayout">
              <div className={`${
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }`}>
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.productId}
                    variants={viewMode === 'grid' ? cardVariants : itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className={`${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group'
                        : 'bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group'
                    }`}
                  >
                    {viewMode === 'grid' ? (
                      // Grid View
                      <>
                        <div className="relative aspect-square overflow-hidden">
                          {/* Product Badges */}
                          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                            {item.isNew && (
                              <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                NEW
                              </span>
                            )}
                            {item.isOnSale && (
                              <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                SALE
                              </span>
                            )}
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.productId, item.name)}
                            className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 dark:bg-slate-800/80 rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </button>

                          <Link href={`/products/${item.slug}`}>
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                          </Link>
                        </div>

                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {item.brand}
                            </span>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {item.rating}
                              </span>
                            </div>
                          </div>

                          <Link href={`/products/${item.slug}`}>
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                              {item.name}
                            </h3>
                          </Link>

                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">
                              ${item.price}
                            </span>
                            {item.originalPrice && (
                              <>
                                <span className="text-sm text-slate-500 dark:text-slate-400 line-through">
                                  ${item.originalPrice}
                                </span>
                                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                  -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                            <Calendar className="w-3 h-3" />
                            Added {new Date(item.dateAdded).toLocaleDateString()}
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAddToCart(item)}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </motion.button>
                        </div>
                      </>
                    ) : (
                      // List View
                      <div className="flex gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                          <Link href={`/products/${item.slug}`}>
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </Link>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  {item.brand}
                                </span>
                                {item.isNew && (
                                  <span className="bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                    NEW
                                  </span>
                                )}
                                {item.isOnSale && (
                                  <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                    SALE
                                  </span>
                                )}
                              </div>

                              <Link href={`/products/${item.slug}`}>
                                <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                  {item.name}
                                </h3>
                              </Link>

                              <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                                    ${item.price}
                                  </span>
                                  {item.originalPrice && (
                                    <span className="text-sm text-slate-500 dark:text-slate-400 line-through">
                                      ${item.originalPrice}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center">
                                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                                  <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {item.rating} ({item.reviewCount})
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(item.dateAdded).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleAddToCart(item)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                Add to Cart
                              </motion.button>

                              <button
                                onClick={() => handleRemoveItem(item.productId, item.name)}
                                className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            {filteredItems.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No items found
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Try adjusting your search or filter criteria.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Clear Wishlist
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Are you sure you want to remove all items from your wishlist? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearWishlist}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}