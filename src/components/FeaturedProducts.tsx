'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, Eye, ShoppingCart } from 'lucide-react';
import ProductImage from './ProductImage';
import { useWishlist } from '@/contexts/WishlistContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: string;
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
  slug: string;
  sale_price?: number;
}

interface FeaturedProductsProps {
  title?: string;
  subtitle?: string;
  maxProducts?: number;
}

export default function FeaturedProducts({
  title = "Featured Sneakers",
  subtitle = "Discover the most popular and trending sneakers",
  maxProducts = 8
}: FeaturedProductsProps) {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Use REAL KicksDB scraped data instead of placeholder data
        const { data: productsData, error } = await supabase
          .from('sneakers')
          .select(`
            id,
            brand,
            model,
            colorway,
            price,
            sku,
            image_url,
            in_stock,
            description
          `)
          .eq('in_stock', true)
          .limit(maxProducts);

        if (error) {
          console.error('Error fetching products:', error);
          return;
        }

        // Map REAL KicksDB data to frontend Product format
        const formattedProducts: Product[] = productsData?.map(sneaker => ({
          id: sneaker.id,
          name: `${sneaker.brand} ${sneaker.model}`,
          brand: sneaker.brand,
          price: parseFloat(sneaker.price),
          originalPrice: undefined, // KicksDB doesn't have sale prices
          image: sneaker.image_url || '/api/placeholder/400/400',
          rating: 4.5 + Math.random() * 0.5, // Mock rating for now
          reviewCount: Math.floor(Math.random() * 500) + 50, // Mock review count
          isNew: Math.random() > 0.8, // Fewer "new" items
          isOnSale: false, // No sales in KicksDB data
          category: 'Sneakers',
          colors: [sneaker.colorway || 'Default'],
          slug: `${sneaker.brand.toLowerCase()}-${sneaker.model.toLowerCase()}-${sneaker.sku}`.replace(/\s+/g, '-'),
          sale_price: undefined
        })) || [];

        setProducts(formattedProducts);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [maxProducts]);

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

  const handleAddToCart = (product: Product) => {
    const cartItem = {
      id: `${product.id}-default`,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      size: 'US 9', // Default size for now
      quantity: 1,
      category: product.category,
      slug: product.slug
    };

    addToCart(cartItem);
  };

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

  const imageVariants = {
    hover: {
      scale: 1.1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const overlayVariants = {
    hover: {
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Featured Collection
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
            {title}
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-700 animate-pulse">
                <div className="aspect-square bg-slate-200 dark:bg-slate-700"></div>
                <div className="p-6">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {products.map((product) => (
            <motion.div
              key={product.id}
              variants={cardVariants}
              whileHover={{
                y: -16,
                boxShadow: "0 40px 80px -12px rgba(0, 0, 0, 0.3)",
                transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
              }}
              onHoverStart={() => setHoveredProduct(product.id)}
              onHoverEnd={() => setHoveredProduct(null)}
              className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 hover:border-slate-300/50 dark:hover:border-slate-600/50"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-700">
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
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: hoveredProduct === product.id || isInWishlist(product.id) ? 1 : 0,
                    scale: hoveredProduct === product.id || isInWishlist(product.id) ? 1 : 0.8
                  }}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleWishlistToggle(product)}
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

                {/* Product Image */}
                <Link href={`/products/${product.slug}`}>
                  <motion.div
                    variants={imageVariants}
                    whileHover="hover"
                    className="w-full h-full relative cursor-pointer"
                  >
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </motion.div>
                </Link>

                {/* Hover Overlay */}
                <motion.div
                  variants={overlayVariants}
                  initial={{ opacity: 0 }}
                  whileHover="hover"
                  className="absolute inset-0 bg-black/20 flex items-center justify-center"
                >
                  <div className="flex gap-4">
                    <Link href={`/products/${product.slug}`}>
                      <motion.button
                        initial={{ y: 30, opacity: 0 }}
                        animate={{
                          y: hoveredProduct === product.id ? 0 : 30,
                          opacity: hoveredProduct === product.id ? 1 : 0
                        }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                        className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl text-slate-900 dark:text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 border border-white/40 dark:border-slate-700/40 hover:-translate-y-1"
                      >
                        <Eye className="w-5 h-5" />
                      </motion.button>
                    </Link>
                    <motion.button
                      initial={{ y: 30, opacity: 0 }}
                      animate={{
                        y: hoveredProduct === product.id ? 0 : 30,
                        opacity: hoveredProduct === product.id ? 1 : 0
                      }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                      onClick={() => handleAddToCart(product)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 hover:from-blue-700 hover:to-indigo-700 border border-blue-500/20 hover:-translate-y-1"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* Product Info */}
              <div className="p-7">
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
                <Link href={`/products/${product.slug}`}>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 cursor-pointer leading-tight">
                    {product.name}
                  </h3>
                </Link>

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
                    {product.rating} ({product.reviewCount})
                  </span>
                </div>

                {/* Colors */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Colors:</span>
                  <div className="flex gap-1">
                    {product.colors.slice(0, 3).map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-600"
                        style={{
                          backgroundColor: color.includes('Black') ? '#000' :
                                         color.includes('White') ? '#fff' :
                                         color.includes('Red') ? '#ef4444' :
                                         color.includes('Blue') ? '#3b82f6' :
                                         color.includes('Green') ? '#22c55e' :
                                         '#6b7280'
                        }}
                      />
                    ))}
                    {product.colors.length > 3 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        +{product.colors.length - 3}
                      </span>
                    )}
                  </div>
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
                  {product.isOnSale && (
                    <span className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                      -{Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          </motion.div>
        )}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-20"
        >
          <Link href="/products">
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-gray-100 text-white dark:text-slate-900 px-12 py-5 rounded-2xl text-lg font-bold hover:from-slate-800 hover:to-slate-700 dark:hover:from-gray-100 dark:hover:to-gray-200 transition-all duration-500 shadow-2xl hover:shadow-3xl border border-slate-700/20 dark:border-gray-300/20 backdrop-blur-sm"
            >
              View All Products
              <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}