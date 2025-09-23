'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Users, Baby, Zap, Heart, Sparkles } from 'lucide-react';

const collections = [
  {
    id: 'men',
    title: "Men's Collection",
    subtitle: "Premium Athletic Footwear",
    description: "Discover premium sneakers for men from iconic brands like Jordan, Nike, and adidas.",
    image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&h=400&fit=crop", // Men's collection
    gradient: "from-slate-800 to-slate-900",
    icon: Users,
    href: "/collections/men",
    stats: { products: "50+", brands: "5+" }
  },
  {
    id: 'women',
    title: "Women's Collection",
    subtitle: "Style & Performance",
    description: "Elegant and comfortable sneakers designed for the modern woman's lifestyle.",
    image: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&h=400&fit=crop", // Women's collection
    gradient: "from-rose-500 to-purple-600",
    icon: Sparkles,
    href: "/collections/women",
    stats: { products: "45+", brands: "5+" }
  },
  {
    id: 'kids',
    title: "Kids Collection",
    subtitle: "Fun & Comfortable",
    description: "Colorful, comfortable sneakers designed for active kids and growing feet.",
    image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=400&fit=crop", // Kids collection
    gradient: "from-purple-500 to-pink-500",
    icon: Baby,
    href: "/collections/kids",
    stats: { products: "25+", brands: "4+" }
  },
  {
    id: 'sneakers',
    title: "Athletic Sneakers",
    subtitle: "Performance & Sport",
    description: "High-performance athletic sneakers for serious athletes and sport enthusiasts.",
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=400&fit=crop", // Sneakers collection
    gradient: "from-blue-600 to-purple-700",
    icon: Zap,
    href: "/collections/sneakers",
    stats: { products: "75+", brands: "6+" }
  },
  {
    id: 'lifestyle',
    title: "Lifestyle Collection",
    subtitle: "Casual & Street Style",
    description: "Effortlessly cool sneakers for everyday wear and street style.",
    image: "https://images.unsplash.com/photo-1584735175097-719d848f8449?w=600&h=400&fit=crop", // Lifestyle collection
    gradient: "from-emerald-600 to-teal-600",
    icon: Heart,
    href: "/collections/lifestyle",
    stats: { products: "40+", brands: "5+" }
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.95
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

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Our Collections
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Explore our carefully curated collections of premium sneakers, each designed for different lifestyles and preferences.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-slate-400">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">200+</div>
                <div>Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10+</div>
                <div>Brands</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">5</div>
                <div>Collections</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {collections.map((collection) => {
            const IconComponent = collection.icon;
            return (
              <motion.div
                key={collection.id}
                variants={cardVariants}
                whileHover={{
                  y: -12,
                  scale: 1.02,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
                }}
                className="group"
              >
                <Link href={collection.href} className="block">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-200/50 dark:border-slate-700/50">
                    {/* Image Section */}
                    <div className="relative h-64 overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${collection.gradient} opacity-90`} />
                      <Image
                        src={collection.image}
                        alt={collection.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />

                      {/* Overlay Content */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white">
                          <IconComponent className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
                          <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">
                            {collection.title}
                          </h3>
                          <p className="text-white/90 font-medium drop-shadow">
                            {collection.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Arrow Icon */}
                      <div className="absolute top-6 right-6">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                          <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8">
                      <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                        {collection.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                              {collection.stats.products}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                              Products
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                              {collection.stats.brands}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                              Brands
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                          <span>Explore</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center mt-20"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Browse our complete product catalog or use our smart search to find the perfect sneakers for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <span>View All Products</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/products?search=true"
                className="bg-blue-700/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700/70 transition-colors flex items-center justify-center gap-2 border border-blue-400/30"
              >
                <span>Smart Search</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

