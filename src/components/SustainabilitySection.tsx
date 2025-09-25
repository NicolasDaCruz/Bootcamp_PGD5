'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckBadgeIcon,
  HeartIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function SustainabilitySection() {
  const sustainabilityFeatures = [
    {
      icon: <CheckBadgeIcon className="w-8 h-8 text-green-600" />,
      title: "100% Authenticated",
      description: "Every pair verified by our expert team for complete authenticity guarantee.",
      stat: "99.8% accuracy rate"
    },
    {
      icon: <span className="text-3xl">🌱</span>,
      title: "Eco-Friendly Impact",
      description: "Choosing pre-loved sneakers reduces CO₂ emissions and water waste significantly.",
      stat: "46kg CO₂ saved per pair"
    },
    {
      icon: <HeartIcon className="w-8 h-8 text-red-500" />,
      title: "Stories Worth Continuing",
      description: "Each pair has a unique history and deserves a second chance to shine.",
      stat: "Thousands of stories shared"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <SparklesIcon className="w-6 h-6 text-green-600" />
            <span className="text-sm font-semibold text-green-600 uppercase tracking-wider">
              Sustainability Focused
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Every Purchase Makes a Difference
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We're committed to sustainable fashion through authenticated pre-loved sneakers,
            reducing waste while maintaining style and quality.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {sustainabilityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                {feature.description}
              </p>
              <div className="text-sm font-semibold text-green-600 bg-green-100 px-4 py-2 rounded-full inline-block">
                {feature.stat}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Environmental Impact Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              🌍 Our Environmental Impact
            </h3>
            <p className="text-gray-600">
              Together we're making a positive difference for our planet
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '1,250', label: 'kg CO₂ Saved', color: 'text-green-600' },
              { value: '847', label: 'Pairs Recycled', color: 'text-blue-600' },
              { value: '312', label: 'Second-Hand Sales', color: 'text-purple-600' },
              { value: '89', label: 'Trees Planted', color: 'text-emerald-600' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-3xl font-black ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Make Sustainable Choices?
            </h3>
            <p className="text-gray-600 mb-6">
              Browse our collection of authenticated pre-loved sneakers and join the sustainable fashion movement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/reconditioned"
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-200 inline-block text-center"
              >
                🌱 Browse Reconditioned Sneakers
              </a>
              <a
                href="/sustainability"
                className="px-8 py-3 border-2 border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-semibold transition-colors duration-200 inline-block text-center"
              >
                ♻️ Learn About Our Process
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}