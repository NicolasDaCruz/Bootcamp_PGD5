'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Heart,
  Filter,
  Grid3X3,
  List,
  X,
  ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import SmartSearch from '@/components/SmartSearch';

// Product interface
interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isOnSale?: boolean;
  category: string;
  colors: string[];
  sizes: string[];
  description: string;
  tags: string[];
}

// Filter state interface
interface Filters {
  brands: string[];
  sizes: string[];
  colors: string[];
  priceRange: [number, number];
  sortBy: string;
}

interface CollectionPageProps {
  title: string;
  subtitle: string;
  description: string;
  heroGradient: string;
  brandFilter?: string[];
  genderFilter?: string[];
  ageGroupFilter?: string[];
  categoryFilter?: string[];
  performanceCategoryFilter?: string[];
  tagFilter?: string[];
  heroImage?: string;
}

// Utility function to create clean slugs
const createSlug = (brand: string, model: string, sku: string): string => {
  return `${brand}-${model}-${sku}`
    .toLowerCase()
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

export default function CollectionPage({
  title,
  subtitle,
  description,
  heroGradient,
  brandFilter,
  genderFilter,
  ageGroupFilter,
  categoryFilter,
  performanceCategoryFilter,
  tagFilter,
  heroImage
}: CollectionPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSizeModal, setShowSizeModal] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Context hooks
  const { addToCartWithNotification } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    brands: [],
    sizes: [],
    colors: [],
    priceRange: [0, 500],
    sortBy: 'newest'
  });

  // Real product data from database
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        // Build query based on filters
        let query = supabase
          .from('sneakers')
          .select('*')
          .eq('in_stock', true);

        // Apply brand filter if specified
        if (brandFilter && brandFilter.length > 0) {
          query = query.in('brand', brandFilter);
        }

        // Use collection field for filtering based on page type
        const collectionName = title.toLowerCase().replace(/['']/g, '').replace(' collection', '').replace('athletic sneakers', 'sneakers').trim();
        if (collectionName === 'mens' || collectionName === 'men') {
          query = query.contains('collection', ['men']);
        } else if (collectionName === 'womens' || collectionName === 'women') {
          query = query.contains('collection', ['women']);
        } else if (collectionName === 'kids') {
          query = query.contains('collection', ['kids']);
        } else if (collectionName === 'sneakers') {
          query = query.contains('collection', ['sneakers']);
        } else if (collectionName === 'lifestyle') {
          query = query.contains('collection', ['lifestyle']);
        }

        // Apply category filter if specified
        if (categoryFilter && categoryFilter.length > 0) {
          query = query.in('category', categoryFilter);
        }

        const { data: sneakers, error } = await query.limit(100);

        if (error) {
          console.error('Database error:', error);
          setProducts([]);
          return;
        }

        if (!sneakers || sneakers.length === 0) {
          console.log('No sneakers found for this collection');
          setProducts([]);
          return;
        }

        // Transform to Product format
        const productList: Product[] = sneakers.map((sneaker: any) => ({
            id: sneaker.id,
            name: `${sneaker.brand} ${sneaker.model}`,
            brand: sneaker.brand,
            price: parseFloat(sneaker.price) || 0,
            originalPrice: undefined,
            image: sneaker.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
            rating: 4.5,
            reviewCount: Math.floor(Math.random() * 200) + 50,
            isNew: Math.random() > 0.8,
            isOnSale: Math.random() > 0.85,
            category: getCategoriesForProduct(sneaker)[0] || 'Sneakers',
            colors: [sneaker.colorway || 'Default'],
            sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'],
            description: sneaker.description || `${sneaker.brand} ${sneaker.model} sneakers`,
            tags: getTagsForProduct(sneaker),
            slug: createSlug(sneaker.brand, sneaker.model, sneaker.sku)
          }));

        setProducts(productList);
        console.log(`Loaded ${productList.length} products for ${title} collection`);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [brandFilter, genderFilter, ageGroupFilter, categoryFilter, performanceCategoryFilter, tagFilter, title]);

  // Helper function to determine categories for a product
  const getCategoriesForProduct = (sneaker: any): string[] => {
    const brand = sneaker.brand?.toLowerCase() || '';
    const model = sneaker.model?.toLowerCase() || '';
    const categories = ['Sneakers'];

    // Basketball shoes
    if (brand === 'jordan' || model.includes('jordan') ||
        model.includes('basketball') || model.includes('dunk')) {
      categories.push('Basketball', 'Men');
    }

    // Running shoes
    if (model.includes('air max') || model.includes('pegasus') ||
        model.includes('ultraboost') || brand === 'asics') {
      categories.push('Running', 'Men', 'Lifestyle');
    }

    // Lifestyle shoes
    if (model.includes('air force') || model.includes('stan smith') ||
        model.includes('chuck taylor') || brand === 'crocs') {
      categories.push('Lifestyle', 'Men');
    }

    // Kids shoes (based on model names or sizes)
    if (model.includes('ps') || model.includes('td') || model.includes('kids')) {
      categories.push('Children');
    }

    return categories;
  };

  // Helper function to determine tags for a product
  const getTagsForProduct = (sneaker: any): string[] => {
    const brand = sneaker.brand?.toLowerCase() || '';
    const model = sneaker.model?.toLowerCase() || '';
    const tags = [brand, 'sneakers'];

    if (model.includes('retro')) tags.push('retro', 'classic');
    if (model.includes('high')) tags.push('high-top');
    if (model.includes('low')) tags.push('low-top');
    if (brand === 'jordan') tags.push('basketball', 'premium');
    if (brand === 'nike') tags.push('athletic', 'performance');
    if (brand === 'adidas') tags.push('sport', 'comfort');

    return tags;
  };

  // Cart and wishlist handlers
  const handleAddToCart = (product: Product) => {
    if (product.sizes.length > 1) {
      setShowSizeModal(product.id);
      return;
    }

    const cartItem = {
      productId: product.id,
      variantId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      size: product.sizes[0] || 'EU 43',
      color: product.colors[0] || 'Default',
      quantity: 1,
      maxStock: 10
    };

    addToCartWithNotification(cartItem);
  };

  const handleAddToCartWithSize = (product: Product, size: string) => {
    const cartItem = {
      productId: product.id,
      variantId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      size: size,
      color: product.colors[0] || 'Default',
      quantity: 1,
      maxStock: 10
    };

    addToCartWithNotification(cartItem);
    setShowSizeModal(null);
  };

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
      slug: product.slug
    };

    toggleWishlist(wishlistItem);
  };

  // Filter and search logic
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.tags.some(tag => tag.includes(query));

        if (!matchesSearch) return false;
      }

      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        return false;
      }

      // Price range filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }

      return true;
    });

    // Sort products
    if (filters.sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === 'newest') {
      filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return filtered;
  }, [products, filters, searchQuery]);

  // Filter manipulation functions
  const updateFilter = (filterType: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleBrandFilter = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand]
    }));
  };

  const clearFilters = () => {
    setFilters({
      brands: [],
      sizes: [],
      colors: [],
      priceRange: [0, 500],
      sortBy: 'newest'
    });
    setSearchQuery('');
  };

  const handleFilterSuggestion = (type: string, value: string) => {
    if (type === 'brand') {
      toggleBrandFilter(value);
    }
  };

  // Get unique brands for filter
  const uniqueBrands = [...new Set(products.map(p => p.brand))];

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

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Hero Section */}
      <div className={`${heroGradient} text-white relative overflow-hidden`}>
        {heroImage && (
          <div className="absolute inset-0 opacity-20">
            <Image
              src={heroImage}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to All Products
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {title}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-2">
              {subtitle}
            </p>
            <p className="text-white/70 max-w-3xl mx-auto">
              {description}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className={`lg:w-80 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Clear All
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Search
                </label>
                <SmartSearch
                  products={products}
                  onSearch={setSearchQuery}
                  onFilterSuggestion={handleFilterSuggestion}
                  placeholder="Search this collection..."
                />
              </div>

              {/* Brand Filter */}
              {uniqueBrands.length > 1 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Brands
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {uniqueBrands.map(brand => (
                      <label key={brand} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.brands.includes(brand)}
                          onChange={() => toggleBrandFilter(brand)}
                          className="rounded border-slate-300 text-blue-600 mr-2"
                        />
                        <span className="text-slate-700 dark:text-slate-300">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Price Range: €{filters.priceRange[0]} - €{filters.priceRange[1]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={filters.priceRange[1]}
                  onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Controls Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700 mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>

                  <span className="text-slate-600 dark:text-slate-400">
                    Showing {filteredProducts.length} of {products.length} products
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Sort Dropdown */}
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {filteredProducts.length > 0 && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8'
                    : 'space-y-6'
                }
              >
                <AnimatePresence>
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      variants={cardVariants}
                      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
                      whileHover={{
                        y: -16,
                        boxShadow: "0 40px 80px -12px rgba(0, 0, 0, 0.3)",
                        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
                      }}
                      className={`group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 hover:border-slate-300/50 dark:hover:border-slate-600/50 ${
                        viewMode === 'list' ? 'flex' : ''
                      }`}
                    >
                      <Link href={`/products/${product.slug}`} className="block h-full">
                        {/* Product Image */}
                        <div className={`relative overflow-hidden bg-slate-50 dark:bg-slate-700 ${
                          viewMode === 'list' ? 'w-48 h-48' : 'aspect-square'
                        }`}>
                          {/* Badges */}
                          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                            {product.isNew && (
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm border border-white/20"
                              >
                                NEW
                              </motion.span>
                            )}
                            {product.isOnSale && (
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm border border-white/20"
                              >
                                SALE
                              </motion.span>
                            )}
                          </div>

                          {/* Wishlist Button */}
                          <motion.button
                            onClick={(e) => {
                              e.preventDefault();
                              handleWishlistToggle(product);
                            }}
                            whileHover={{ scale: 1.15, y: -2 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/40 dark:border-slate-700/40 hover:bg-white dark:hover:bg-slate-800"
                          >
                            <Heart
                              className={`w-5 h-5 transition-all duration-300 ${
                                isInWishlist(product.id)
                                  ? 'text-red-500 fill-red-500 drop-shadow-lg'
                                  : 'text-slate-500 hover:text-red-500 dark:text-slate-400'
                              }`}
                            />
                          </motion.button>

                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes={viewMode === 'list' ? '200px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
                          />
                        </div>

                        {/* Product Info */}
                        <div className={`p-7 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                          {/* Brand & Category */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              {product.brand}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                              {product.category}
                            </span>
                          </div>

                          {/* Product Name */}
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight">
                            {product.name}
                          </h3>

                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(product.rating)
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-slate-300 dark:text-slate-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {product.rating.toFixed(1)} ({product.reviewCount})
                            </span>
                          </div>

                          {/* Price */}
                          <div className="flex items-baseline gap-3 mt-auto">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                              €{product.price}
                            </span>
                            {product.originalPrice && (
                              <span className="text-lg text-slate-500 dark:text-slate-400 line-through">
                                €{product.originalPrice}
                              </span>
                            )}
                            {product.isOnSale && product.originalPrice && (
                              <span className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                                -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* No Results */}
            {filteredProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="text-6xl mb-4">👟</div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                  No products found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Size Selection Modal */}
      <AnimatePresence>
        {showSizeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowSizeModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const product = products.find(p => p.id === showSizeModal);
                if (!product) return null;

                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Select Size
                      </h3>
                      <button
                        onClick={() => setShowSizeModal(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-slate-900 dark:text-white">{product.name}</h4>
                      <p className="text-slate-600 dark:text-slate-400">€{product.price}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {product.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => handleAddToCartWithSize(product, size)}
                          className="p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-center hover:border-blue-600 hover:text-blue-600 transition-colors"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}