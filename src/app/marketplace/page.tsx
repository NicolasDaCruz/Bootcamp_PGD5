'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RecyclingPrograms } from '@/components/sustainability/RecyclingPrograms';
import { SecondHandMarketplace } from '@/components/sustainability/SecondHandMarketplace';
import { SustainabilityScore } from '@/components/sustainability/SustainabilityScore';

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'recycling'>('marketplace');
  const [userImpactStats, setUserImpactStats] = useState({
    totalCarbonSaved: 45.7,
    totalWaterSaved: 1850,
    itemsRecycled: 3,
    secondHandPurchases: 7,
    moneysSaved: 234.50,
    treesPlantedEquivalent: 12
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const handlePurchaseSecondHand = (listingId: string) => {
    console.log(`Purchasing second-hand item: ${listingId}`);
    // Handle purchase logic
  };

  const handleJoinRecyclingProgram = (programId: string) => {
    console.log(`Joining recycling program: ${programId}`);
    // Handle program joining logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            🌱 Sustainable Marketplace
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Give sneakers a second life through our recycling programs and pre-loved marketplace
          </p>
        </motion.div>

        {/* Impact Statistics */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12"
        >
          {[
            {
              value: `${userImpactStats.totalCarbonSaved.toLocaleString()}kg`,
              label: 'CO₂ Saved',
              icon: '🌱',
              color: 'text-green-600',
              bg: 'bg-green-50'
            },
            {
              value: `${userImpactStats.totalWaterSaved.toLocaleString()}L`,
              label: 'Water Saved',
              icon: '💧',
              color: 'text-blue-600',
              bg: 'bg-blue-50'
            },
            {
              value: userImpactStats.itemsRecycled.toString(),
              label: 'Items Recycled',
              icon: '♻️',
              color: 'text-purple-600',
              bg: 'bg-purple-50'
            },
            {
              value: userImpactStats.secondHandPurchases.toString(),
              label: 'Second-Hand Buys',
              icon: '👟',
              color: 'text-indigo-600',
              bg: 'bg-indigo-50'
            },
            {
              value: `$${userImpactStats.moneysSaved.toLocaleString()}`,
              label: 'Money Saved',
              icon: '💰',
              color: 'text-yellow-600',
              bg: 'bg-yellow-50'
            },
            {
              value: userImpactStats.treesPlantedEquivalent.toString(),
              label: 'Trees Planted',
              icon: '🌳',
              color: 'text-emerald-600',
              bg: 'bg-emerald-50'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`${stat.bg} rounded-xl p-4 text-center border border-gray-200 hover:shadow-lg transition-all duration-300 group`}
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                {stat.icon}
              </div>
              <div className={`text-lg font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-xs font-medium text-gray-600">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'marketplace'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Second-Hand Marketplace
            </button>
            <button
              onClick={() => setActiveTab('recycling')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'recycling'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Recycling Programs
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          {activeTab === 'marketplace' ? (
            <SecondHandMarketplace
              onPurchase={handlePurchaseSecondHand}
              showCreateListing={true}
            />
          ) : (
            <RecyclingPrograms
              onJoinProgram={handleJoinRecyclingProgram}
            />
          )}
        </motion.div>

        {/* Additional Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-2 gap-8 mb-12"
        >
          {/* Personal Sustainability Score */}
          <motion.div variants={itemVariants}>
            <SustainabilityScore
              overallScore={78}
              environmentalImpact={82}
              socialResponsibility={75}
              durabilityRating={80}
              recyclabilityScore={76}
              carbonFootprintKg={8.5}
              waterUsageLiters={380}
              showDetails={true}
              size="full"
              animated={true}
            />
          </motion.div>

          {/* Community Challenge */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🏆 Community Challenge</h3>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                15 days left
              </span>
            </div>

            <h4 className="font-semibold text-gray-900 mb-2">Circular Fashion Month</h4>
            <p className="text-sm text-gray-600 mb-4">
              Join thousands of users in reducing fashion waste. Recycle, buy second-hand, and earn rewards!
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Community Progress</span>
                <span className="font-medium">2,847 / 5,000 items</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '57%' }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
              </div>
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl mb-1">🌟</div>
                <div className="text-xs font-medium text-gray-700">Bronze Badge</div>
                <div className="text-xs text-gray-500">5 items</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">🥈</div>
                <div className="text-xs font-medium text-gray-700">Silver Badge</div>
                <div className="text-xs text-gray-500">15 items</div>
              </div>
              <div className="text-center p-3 bg-yellow-100 rounded-lg border-2 border-yellow-400">
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-xs font-medium text-yellow-700">Gold Badge</div>
                <div className="text-xs text-yellow-600">30 items</div>
              </div>
            </div>

            <button className="w-full py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200">
              Join Challenge
            </button>
          </motion.div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl p-8"
        >
          <h2 className="text-3xl font-bold mb-4">Make Every Step Count</h2>
          <p className="text-xl opacity-90 mb-6 max-w-2xl mx-auto">
            Your sustainable choices create real environmental impact. Join our community of conscious consumers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-white text-green-600 hover:bg-gray-50 rounded-lg font-semibold transition-all duration-200"
            >
              Start Your Journey
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 border-2 border-white text-white hover:bg-white/10 rounded-lg font-semibold transition-all duration-200"
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}