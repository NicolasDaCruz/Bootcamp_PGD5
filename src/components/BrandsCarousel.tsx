'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Brand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
}

interface BrandsCarouselProps {
  title?: string;
  subtitle?: string;
  speed?: number; // Duration in seconds for one complete scroll
}

export default function BrandsCarousel({
  title = "Trusted by Top Brands",
  subtitle = "Discover sneakers from the world's most iconic brands",
  speed = 20
}: BrandsCarouselProps) {
  const [isPaused, setIsPaused] = useState(false);

  // Mock brand data - replace with actual API data
  const brands: Brand[] = [
    { id: '1', name: 'Nike', description: 'Just Do It' },
    { id: '2', name: 'Adidas', description: 'Impossible is Nothing' },
    { id: '3', name: 'Jordan', description: 'Jumpman' },
    { id: '4', name: 'Converse', description: 'All Star' },
    { id: '5', name: 'Vans', description: 'Off The Wall' },
    { id: '6', name: 'New Balance', description: 'Made in USA' },
    { id: '7', name: 'Puma', description: 'Forever Faster' },
    { id: '8', name: 'Reebok', description: 'Be More Human' },
    { id: '9', name: 'ASICS', description: 'Sound Mind, Sound Body' },
    { id: '10', name: 'Under Armour', description: 'I Will' },
    { id: '11', name: 'Fila', description: 'Forward Moving' },
    { id: '12', name: 'Balenciaga', description: 'Luxury Streetwear' }
  ];

  // Duplicate brands for seamless infinite scroll
  const duplicatedBrands = [...brands, ...brands];

  // Generate brand logo placeholder with consistent styling
  const generateBrandLogo = (brandName: string) => {
    const brandColors: { [key: string]: string } = {
      'Nike': 'from-gray-900 to-black',
      'Adidas': 'from-blue-600 to-blue-800',
      'Jordan': 'from-red-600 to-red-800',
      'Converse': 'from-indigo-600 to-purple-600',
      'Vans': 'from-orange-500 to-red-600',
      'New Balance': 'from-green-600 to-emerald-600',
      'Puma': 'from-yellow-500 to-orange-500',
      'Reebok': 'from-red-500 to-pink-600',
      'ASICS': 'from-blue-500 to-cyan-500',
      'Under Armour': 'from-gray-700 to-gray-900',
      'Fila': 'from-red-600 to-blue-600',
      'Balenciaga': 'from-black to-gray-800'
    };

    return brandColors[brandName] || 'from-gray-500 to-gray-700';
  };

  const BrandCard = ({ brand, index }: { brand: Brand; index: number }) => (
    <motion.div
      className="flex-shrink-0 w-48 md:w-56 lg:w-64 mx-4"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-700 group">
        {/* Brand Logo Area */}
        <div className={`w-full h-24 bg-gradient-to-r ${generateBrandLogo(brand.name)} rounded-xl mb-4 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
          <div className="text-white font-bold text-xl md:text-2xl text-center">
            {brand.name}
          </div>
          {/* Shine effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
          />
        </div>

        {/* Brand Info */}
        <div className="text-center">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
            {brand.name}
          </h3>
          {brand.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {brand.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Brands Carousel */}
        <div className="relative">
          {/* Gradient Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 dark:from-slate-800 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 dark:from-slate-800 to-transparent z-10 pointer-events-none" />

          {/* Scrolling Container */}
          <motion.div
            className="flex"
            animate={{
              x: isPaused ? 0 : `-${(brands.length * 256)}px` // 256px = w-64 + margins
            }}
            transition={{
              duration: isPaused ? 0 : speed,
              repeat: isPaused ? 0 : Infinity,
              ease: "linear"
            }}
            onHoverStart={() => setIsPaused(true)}
            onHoverEnd={() => setIsPaused(false)}
          >
            {duplicatedBrands.map((brand, index) => (
              <BrandCard
                key={`${brand.id}-${index}`}
                brand={brand}
                index={index}
              />
            ))}
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {[
            { number: '50+', label: 'Premium Brands', description: 'Curated selection' },
            { number: '10K+', label: 'Products Available', description: 'Latest collections' },
            { number: '24/7', label: 'Customer Support', description: 'Always here to help' },
            { number: '100%', label: 'Authentic Guarantee', description: 'Verified products' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.4 + index * 0.1
              }}
              whileHover={{ scale: 1.05 }}
              className="text-center bg-white dark:bg-slate-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.5 + index * 0.1,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15
                }}
                className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2"
              >
                {stat.number}
              </motion.div>
              <div className="font-semibold text-slate-900 dark:text-white mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Explore All Brands
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}