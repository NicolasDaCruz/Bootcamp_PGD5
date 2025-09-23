'use client';

import { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Leaf, Recycle, Package, Globe, Award, ArrowRight, CheckCircle } from 'lucide-react';
import { useRef } from 'react';
import ProductImage from './ProductImage';

interface EcoProduct {
  id: string;
  name: string;
  brand: string;
  originalPrice: number;
  ecoPrice: number;
  condition: 'Excellent' | 'Very Good' | 'Good';
  conditionScore: number;
  image: string;
  carbonSaved: number; // in kg CO2
  materialsRecycled: string[];
  certification?: string;
}

interface EcoSectionProps {
  title?: string;
  subtitle?: string;
}

export default function EcoSection({
  title = "Second Life Sneakers",
  subtitle = "Give sneakers a second chance while reducing your carbon footprint"
}: EcoSectionProps) {
  const [sustainabilityProgress, setSustainabilityProgress] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Mock eco-friendly products
  const ecoProducts: EcoProduct[] = [
    {
      id: 'eco-1',
      name: 'Air Jordan 1 Retro High',
      brand: 'Nike',
      originalPrice: 170,
      ecoPrice: 120,
      condition: 'Excellent',
      conditionScore: 95,
      image: '/api/placeholder/400/400',
      carbonSaved: 12.5,
      materialsRecycled: ['Rubber Sole', 'Synthetic Leather'],
      certification: 'Renewed'
    },
    {
      id: 'eco-2',
      name: 'Stan Smith',
      brand: 'Adidas',
      originalPrice: 100,
      ecoPrice: 75,
      condition: 'Very Good',
      conditionScore: 85,
      image: '/api/placeholder/400/400',
      carbonSaved: 8.3,
      materialsRecycled: ['Organic Cotton', 'Recycled Rubber'],
      certification: 'Eco-Certified'
    },
    {
      id: 'eco-3',
      name: 'Chuck Taylor All Star',
      brand: 'Converse',
      originalPrice: 65,
      ecoPrice: 45,
      condition: 'Good',
      conditionScore: 78,
      image: '/api/placeholder/400/400',
      carbonSaved: 6.7,
      materialsRecycled: ['Canvas', 'Recycled Rubber'],
      certification: 'Refurbished'
    }
  ];

  // Sustainability stats
  const sustainabilityStats = [
    { icon: Recycle, value: '2.5M', label: 'Pairs Renewed', description: 'Sneakers given second life' },
    { icon: Leaf, value: '45%', label: 'Carbon Reduced', description: 'Less environmental impact' },
    { icon: Package, value: '100%', label: 'Eco Packaging', description: 'Biodegradable materials only' },
    { icon: Globe, value: '15K', label: 'Trees Saved', description: 'Through our recycling program' }
  ];

  // Animate progress when in view
  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        setSustainabilityProgress(78); // 78% sustainability score
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Very Good': return 'text-blue-600 bg-blue-100';
      case 'Good': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <Leaf className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Sustainability Meter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-8 mb-16 shadow-xl border border-green-100 dark:border-green-900"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Our Sustainability Impact
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Every purchase contributes to a greener planet
            </p>
          </div>

          {/* Circular Progress */}
          <div className="flex justify-center mb-8">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  className="text-green-500"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                  animate={{
                    strokeDashoffset: isInView
                      ? 2 * Math.PI * 45 * (1 - sustainabilityProgress / 100)
                      : 2 * Math.PI * 45
                  }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: isInView ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    className="text-4xl font-bold text-green-600 dark:text-green-400"
                  >
                    {sustainabilityProgress}%
                  </motion.div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Sustainability Score
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {sustainabilityStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="text-center"
              >
                <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Eco Products Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-16"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Renewed Sneakers Collection
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Premium sneakers carefully restored to like-new condition, at better prices
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ecoProducts.map((product, index) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-green-100 dark:border-green-900"
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden">
                  {/* Eco Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Leaf className="w-4 h-4" />
                      ECO
                    </div>
                  </div>

                  {/* Condition Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className={`${getConditionColor(product.condition)} px-3 py-1 rounded-full text-sm font-semibold`}>
                      {product.condition}
                    </div>
                  </div>

                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {product.brand}
                    </span>
                    {product.certification && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Award className="w-3 h-3" />
                        {product.certification}
                      </div>
                    )}
                  </div>

                  <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-3">
                    {product.name}
                  </h4>

                  {/* Condition Score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Condition Score
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {product.conditionScore}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="bg-green-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${product.conditionScore}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                      />
                    </div>
                  </div>

                  {/* Environmental Impact */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                        Environmental Impact
                      </span>
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-400">
                      {product.carbonSaved}kg CO₂ saved vs. new
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Materials: {product.materialsRecycled.join(', ')}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        ${product.ecoPrice}
                      </span>
                      <span className="text-lg text-slate-500 dark:text-slate-400 line-through">
                        ${product.originalPrice}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      Save ${product.originalPrice - product.ecoPrice}
                    </div>
                  </div>

                  {/* Action Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <span>Shop Renewed</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-3xl p-12"
        >
          <h3 className="text-3xl font-bold mb-4">
            Join Our Sustainability Mission
          </h3>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Every renewed sneaker purchase helps reduce waste and carbon emissions.
            Together, we're building a more sustainable future for fashion.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-green-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Recycle className="w-5 h-5" />
              Learn More About Our Program
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-green-600 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              View All Renewed Products
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}