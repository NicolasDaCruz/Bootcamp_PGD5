'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, ArrowRight, Package, TrendingUp, Star, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Brand {
  brand: string;
  product_count: number;
}

interface Product {
  id: string;
  brand: string;
  model: string;
  price: number;
  image_url: string;
  sku: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'count'>('count');

  useEffect(() => {
    const fetchBrandsAndProducts = async () => {
      try {
        console.log('Fetching brands with product counts...');

        // Fetch all sneakers with brands - more efficient than counting client-side
        const { data: brandsData, error: brandsError } = await supabase
          .from('sneakers')
          .select('brand')
          .not('brand', 'is', null);

        console.log('Raw brands data:', brandsData);
        console.log('Brands error:', brandsError);

        if (brandsError) throw brandsError;

        // Count products per brand
        const brandCounts = (brandsData || []).reduce((acc: Record<string, number>, product: any) => {
          acc[product.brand] = (acc[product.brand] || 0) + 1;
          return acc;
        }, {});

        console.log('Brand counts object:', brandCounts);

        const brandsWithCounts = Object.entries(brandCounts).map(([brand, count]) => ({
          brand,
          product_count: count as number
        }));

        console.log('Final brands with counts:', brandsWithCounts);
        setBrands(brandsWithCounts);

        // Fetch featured products from top brands (with or without images)
        const { data: productsData, error: productsError } = await supabase
          .from('sneakers')
          .select(`
            id,
            brand,
            model,
            price,
            image_url,
            sku
          `)
          .in('brand', ['Nike', 'Jordan', 'adidas'])
          .eq('in_stock', true)
          .limit(6);

        if (productsError) throw productsError;

        setFeaturedProducts(productsData || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandsAndProducts();
  }, []);

  const filteredBrands = brands
    .filter(brand =>
      brand.brand.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.brand.localeCompare(b.brand);
      }
      return b.product_count - a.product_count;
    });

  const getBrandLogo = (brandName: string) => {
    const brandLogos: Record<string, string> = {
      'Nike': '✓',
      'adidas': '⚡',
      'Jordan': '🏀',
      'ASICS': 'A',
      'New Balance': 'N',
      'Maison Mihara Yasuhiro': 'M',
      'Crocs': '🐊',
      'Supreme': 'S',
      'Timberland': '🌲'
    };
    return brandLogos[brandName] || brandName.charAt(0);
  };

  const getBrandColor = (brandName: string) => {
    const brandColors: Record<string, string> = {
      'Nike': 'from-orange-500 to-red-600',
      'adidas': 'from-blue-600 to-indigo-700',
      'Jordan': 'from-red-600 to-black',
      'ASICS': 'from-blue-500 to-cyan-600',
      'New Balance': 'from-gray-600 to-slate-700',
      'Maison Mihara Yasuhiro': 'from-purple-600 to-indigo-700',
      'Crocs': 'from-green-500 to-emerald-600',
      'Supreme': 'from-red-700 to-red-900',
      'Timberland': 'from-amber-600 to-yellow-700'
    };
    return brandColors[brandName] || 'from-slate-600 to-slate-700';
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  const sectionVariants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: 0.2 }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading brands...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
    >
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6"
          >
            Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Brands</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8"
          >
            Discover sneakers from the world's most iconic brands. From classic heritage to cutting-edge innovation.
          </motion.p>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'count')}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="count">Sort by Popularity</option>
              <option value="name">Sort by Name</option>
            </select>
          </motion.div>
        </div>
      </section>

      {/* Brands Grid */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="py-16 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              All Brands ({filteredBrands.length})
            </h2>
            <div className="flex items-center text-slate-600 dark:text-slate-300">
              <Filter className="w-5 h-5 mr-2" />
              <span className="text-sm">
                {filteredBrands.reduce((sum, brand) => sum + brand.product_count, 0)} products
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBrands.map((brand, index) => (
              <motion.div
                key={brand.brand}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="group"
              >
                <Link href={`/products?brand=${encodeURIComponent(brand.brand)}`}>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className={`h-24 bg-gradient-to-r ${getBrandColor(brand.brand)} flex items-center justify-center`}>
                      <div className="text-4xl font-black text-white">
                        {getBrandLogo(brand.brand)}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                        {brand.brand}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-slate-600 dark:text-slate-300">
                          <Package className="w-4 h-4 mr-1" />
                          <span className="text-sm">{brand.product_count} products</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {filteredBrands.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
                No brands found
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Try adjusting your search terms
              </p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <motion.section
          variants={sectionVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="py-16 px-6 bg-white dark:bg-slate-800"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Featured Products
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Popular sneakers from top brands
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.03 }}
                  className="group"
                >
                  <Link href={`/products/${product.brand}-${product.model}-${product.sku}`.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')}>
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className="aspect-square bg-white dark:bg-slate-600 p-8">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={`${product.brand} ${product.model}`}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                            <Package className="w-16 h-16 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {product.brand}
                          </span>
                          <div className="flex items-center text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm text-slate-600 dark:text-slate-300 ml-1">4.8</span>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {product.brand} {product.model}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            €{product.price}
                          </span>
                          <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/products"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                View All Products <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </motion.section>
      )}

      {/* Brand Stats */}
      <motion.section
        variants={sectionVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="py-16 px-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Brand Statistics</h2>
              <p className="text-blue-100">
                Discover the numbers behind our brand collection
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div className="text-3xl font-bold mb-2">{brands.length}</div>
                <div className="text-blue-100">Total Brands</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Package className="w-8 h-8" />
                </div>
                <div className="text-3xl font-bold mb-2">
                  {brands.reduce((sum, brand) => sum + brand.product_count, 0)}
                </div>
                <div className="text-blue-100">Total Products</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Star className="w-8 h-8" />
                </div>
                <div className="text-3xl font-bold mb-2">4.8</div>
                <div className="text-blue-100">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}