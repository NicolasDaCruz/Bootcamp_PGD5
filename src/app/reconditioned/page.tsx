'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckBadgeIcon,
  SparklesIcon,
  StarIcon,
  HeartIcon,
  TruckIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

export default function ReconditionedPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('condition');

  // Mock reconditioned sneakers data
  const reconditionedSneakers = [
    {
      id: '1',
      brand: 'Nike',
      model: 'Air Jordan 1 Retro High',
      colorway: 'Bred',
      size: '9.5',
      originalPrice: 170,
      price: 125,
      condition: 'excellent',
      conditionScore: 88,
      images: ['https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop&crop=center', 'https://images.unsplash.com/photo-1578662015004-bfcd704d9569?w=400&h=400&fit=crop&crop=center'],
      reconditioning: {
        processCompleted: true,
        authenticityVerified: true,
        cleaningLevel: 'deep',
        restorationWork: ['Upper cleaning', 'Sole whitening', 'Lace replacement'],
        qualityChecks: 15
      },
      sustainability: {
        carbonSaved: 14.2,
        waterSaved: 520,
        wastePrevented: 0.9
      },
      story: 'Originally owned by a collector who wore them twice. Fully restored to near-mint condition.',
      features: ['Original box included', 'Authentication certificate', 'Care instructions']
    },
    {
      id: '2',
      brand: 'Adidas',
      model: 'Yeezy Boost 350 V2',
      colorway: 'Zebra',
      size: '10',
      originalPrice: 220,
      price: 189,
      condition: 'like_new',
      conditionScore: 95,
      images: ['https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=400&h=400&fit=crop&crop=center'],
      reconditioning: {
        processCompleted: true,
        authenticityVerified: true,
        cleaningLevel: 'standard',
        restorationWork: ['Primeknit cleaning', 'Boost midsole restoration'],
        qualityChecks: 12
      },
      sustainability: {
        carbonSaved: 16.8,
        waterSaved: 640,
        wastePrevented: 1.1
      },
      story: 'Worn only indoors by previous owner. Minimal wear with professional restoration.',
      features: ['Original packaging', 'Authenticity guaranteed', '30-day warranty']
    },
    {
      id: '3',
      brand: 'Nike',
      model: 'Air Force 1 Low',
      colorway: 'White',
      size: '8.5',
      originalPrice: 90,
      price: 65,
      condition: 'good',
      conditionScore: 75,
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&crop=center', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop&crop=center', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center'],
      reconditioning: {
        processCompleted: true,
        authenticityVerified: true,
        cleaningLevel: 'deep',
        restorationWork: ['Leather conditioning', 'Sole restoration', 'Deep cleaning', 'Deodorizing'],
        qualityChecks: 18
      },
      sustainability: {
        carbonSaved: 8.5,
        waterSaved: 320,
        wastePrevented: 0.6
      },
      story: 'Well-loved pair with character. Expertly restored to extend lifespan.',
      features: ['Professional restoration', 'Quality guarantee', 'Sustainable choice']
    },
    {
      id: '4',
      brand: 'New Balance',
      model: '550',
      colorway: 'White/Green',
      size: '9',
      originalPrice: 110,
      price: 85,
      condition: 'excellent',
      conditionScore: 82,
      images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop&crop=center'],
      reconditioning: {
        processCompleted: true,
        authenticityVerified: true,
        cleaningLevel: 'standard',
        restorationWork: ['Leather cleaning', 'Sole whitening'],
        qualityChecks: 10
      },
      sustainability: {
        carbonSaved: 10.3,
        waterSaved: 410,
        wastePrevented: 0.7
      },
      story: 'Gently used with minimal signs of wear. Restored to excellent condition.',
      features: ['Original tags', 'Verified authentic', 'Eco-friendly choice']
    }
  ];

  const getConditionColor = (condition: string) => {
    const colors = {
      like_new: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      excellent: 'bg-green-100 text-green-800 border-green-200',
      good: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      fair: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[condition as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getConditionLabel = (condition: string) => {
    const labels = {
      like_new: 'Like New',
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair'
    };
    return labels[condition as keyof typeof labels] || condition;
  };

  const filteredSneakers = reconditionedSneakers.filter(sneaker => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'like_new') return sneaker.condition === 'like_new';
    if (selectedFilter === 'under_100') return sneaker.price < 100;
    if (selectedFilter === 'nike') return sneaker.brand.toLowerCase() === 'nike';
    if (selectedFilter === 'adidas') return sneaker.brand.toLowerCase() === 'adidas';
    return true;
  });

  const sortedSneakers = [...filteredSneakers].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    if (sortBy === 'condition') return b.conditionScore - a.conditionScore;
    if (sortBy === 'sustainability') return b.sustainability.carbonSaved - a.sustainability.carbonSaved;
    return 0;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Homepage
            </Link>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <SparklesIcon className="w-8 h-8 text-blue-600" />
              <span className="text-lg font-semibold text-blue-600 uppercase tracking-wider">
                Reconditioned Collection
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Premium Reconditioned Sneakers
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Expertly restored pre-loved sneakers that combine sustainability with style.
              Each pair undergoes our rigorous reconditioning process to ensure premium quality.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <CheckBadgeIcon className="w-8 h-8 text-green-600" />, value: '99.8%', label: 'Authentication Rate' },
              { icon: <SparklesIcon className="w-8 h-8 text-blue-600" />, value: '18', label: 'Quality Checks' },
              { icon: <TruckIcon className="w-8 h-8 text-purple-600" />, value: '72h', label: 'Processing Time' },
              { icon: <ShieldCheckIcon className="w-8 h-8 text-emerald-600" />, value: '30', label: 'Day Warranty' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-3">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters and Collection */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Filters */}
          <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-700">Filter:</span>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Sneakers</option>
                    <option value="like_new">Like New</option>
                    <option value="under_100">Under $100</option>
                    <option value="nike">Nike</option>
                    <option value="adidas">Adidas</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="condition">Best Condition</option>
                    <option value="price_low">Price (Low to High)</option>
                    <option value="price_high">Price (High to Low)</option>
                    <option value="sustainability">Most Sustainable</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {sortedSneakers.length} reconditioned pairs available
              </div>
            </div>
          </div>

          {/* Sneakers Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedSneakers.map((sneaker, index) => (
              <motion.div
                key={sneaker.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={sneaker.images[0]}
                    alt={`${sneaker.brand} ${sneaker.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Condition Badge */}
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium border ${getConditionColor(sneaker.condition)}`}>
                    {getConditionLabel(sneaker.condition)}
                  </div>

                  {/* Authenticity Badge */}
                  <div className="absolute top-3 right-3 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <CheckBadgeIcon className="h-3 w-3" />
                    Verified
                  </div>

                  {/* Image Count */}
                  {sneaker.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                      +{sneaker.images.length - 1} photos
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Brand and Model */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Brand Logo */}
                      {sneaker.brand === 'Nike' && sneaker.model.includes('Jordan') ? (
                        <img
                          src="https://logoeps.com/wp-content/uploads/2013/03/jordan-vector-logo.png"
                          alt="Jordan Brand"
                          className="w-6 h-6 object-contain"
                        />
                      ) : sneaker.brand === 'Nike' ? (
                        <img
                          src="https://logoeps.com/wp-content/uploads/2013/03/nike-vector-logo.png"
                          alt="Nike"
                          className="w-6 h-6 object-contain"
                        />
                      ) : sneaker.brand === 'Adidas' ? (
                        <img
                          src="https://logoeps.com/wp-content/uploads/2013/03/adidas-vector-logo.png"
                          alt="Adidas"
                          className="w-6 h-6 object-contain"
                        />
                      ) : sneaker.brand === 'New Balance' ? (
                        <img
                          src="https://logos-world.net/wp-content/uploads/2020/09/New-Balance-Logo.png"
                          alt="New Balance"
                          className="w-8 h-6 object-contain"
                        />
                      ) : null}
                      <h3 className="font-bold text-lg text-gray-900">{sneaker.brand}</h3>
                    </div>
                    <p className="text-gray-600">{sneaker.model} - {sneaker.colorway}</p>
                    <p className="text-sm text-gray-500">Size {sneaker.size}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">${sneaker.price}</span>
                      <span className="text-sm text-gray-500 line-through">${sneaker.originalPrice}</span>
                      <span className="text-sm text-green-600 font-medium">
                        {Math.round(((sneaker.originalPrice - sneaker.price) / sneaker.originalPrice) * 100)}% off
                      </span>
                    </div>
                  </div>

                  {/* Condition Score */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Condition Score</span>
                    <div className="flex items-center gap-1">
                      <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-bold">{sneaker.conditionScore}/100</span>
                    </div>
                  </div>

                  {/* Reconditioning Info */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-xs font-medium text-blue-900 mb-2">Reconditioning Completed:</h4>
                    <div className="space-y-1 text-xs text-blue-700">
                      {sneaker.reconditioning.restorationWork.slice(0, 2).map((work, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <CheckBadgeIcon className="h-3 w-3" />
                          {work}
                        </div>
                      ))}
                      {sneaker.reconditioning.restorationWork.length > 2 && (
                        <div className="text-blue-600">
                          +{sneaker.reconditioning.restorationWork.length - 2} more processes
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Environmental Impact */}
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <h4 className="text-xs font-medium text-green-900 mb-2">Environmental Impact:</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs text-green-700">
                      <div className="text-center">
                        <div className="font-bold">{sneaker.sustainability.carbonSaved}kg</div>
                        <div>CO₂ Saved</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{sneaker.sustainability.waterSaved}L</div>
                        <div>Water</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{sneaker.sustainability.wastePrevented}kg</div>
                        <div>Waste</div>
                      </div>
                    </div>
                  </div>

                  {/* Story */}
                  <div className="mb-4 text-xs text-gray-600 italic">
                    "{sneaker.story}"
                  </div>

                  {/* Features */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {sneaker.features.map((feature, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2">
                    <CurrencyDollarIcon className="h-4 w-4" />
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reconditioning Process Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Reconditioning Process</h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Every sneaker goes through our comprehensive restoration process to ensure premium quality and authenticity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Authentication & Assessment',
                description: 'Expert verification and detailed condition scoring',
                icon: <CheckBadgeIcon className="w-8 h-8" />
              },
              {
                step: '02',
                title: 'Professional Restoration',
                description: 'Deep cleaning, repair work, and quality enhancement',
                icon: <SparklesIcon className="w-8 h-8" />
              },
              {
                step: '03',
                title: 'Quality Assurance',
                description: 'Final inspection and certification for resale',
                icon: <ShieldCheckIcon className="w-8 h-8" />
              }
            ].map((process, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  {process.icon}
                </div>
                <div className="text-sm font-bold opacity-75 mb-2">STEP {process.step}</div>
                <h3 className="text-xl font-bold mb-3">{process.title}</h3>
                <p className="opacity-90">{process.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Why Choose Reconditioned?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="text-3xl mb-3">💚</div>
                <h3 className="font-bold text-lg mb-2">Eco-Friendly</h3>
                <p className="text-gray-600">Reduce waste and environmental impact</p>
              </div>
              <div>
                <div className="text-3xl mb-3">✨</div>
                <h3 className="font-bold text-lg mb-2">Premium Quality</h3>
                <p className="text-gray-600">Professional restoration to like-new condition</p>
              </div>
              <div>
                <div className="text-3xl mb-3">💰</div>
                <h3 className="font-bold text-lg mb-2">Great Value</h3>
                <p className="text-gray-600">Premium sneakers at accessible prices</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200"
              >
                Browse All Sneakers
              </Link>
              <Link
                href="/sustainability"
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors duration-200"
              >
                Learn About Our Process
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}