'use client';

import React, { useState } from 'react';
import { useLoyalty } from '@/contexts/LoyaltyContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoyaltyWidget() {
  const {
    userLoyalty,
    getPointsBalance,
    getCurrentTier,
    getNextTier,
    getTierProgress
  } = useLoyalty();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!userLoyalty) {
    return null;
  }

  const pointsBalance = getPointsBalance();
  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const progress = getTierProgress();

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-lg">{currentTier.icon}</span>
        <div className="text-left">
          <div className="text-sm font-bold">{pointsBalance}</div>
          <div className="text-xs opacity-90">points</div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{currentTier.icon}</span>
                  <div>
                    <div className="font-bold">{currentTier.name} Member</div>
                    <div className="text-sm opacity-90">{pointsBalance} points available</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Progress Bar */}
              {nextTier && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress to {nextTier.name}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-purple-500/30 rounded-full h-2">
                    <motion.div
                      className="bg-white rounded-full h-2"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {nextTier.minPoints - userLoyalty.totalPoints} points to go
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* Quick Actions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors">
                    View Rewards
                  </button>
                  <button className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                    Achievements
                  </button>
                </div>
              </div>

              {/* Current Tier Benefits */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Your Benefits</h4>
                <div className="space-y-2">
                  {currentTier.benefits.slice(0, 3).map((benefit: any) => (
                    <div key={benefit.id} className="flex items-center space-x-2 text-sm">
                      <span className="text-base">{benefit.icon}</span>
                      <span className="text-gray-700">{benefit.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral Code */}
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-900 text-sm">Referral Code</div>
                    <div className="font-mono font-bold text-green-700">{userLoyalty.referralCode}</div>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(userLoyalty.referralCode)}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Ways to Earn Points */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Earn Points</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Make purchases</span>
                    <span className="font-medium">1€ = 1 pt</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Write reviews</span>
                    <span className="font-medium">50 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refer friends</span>
                    <span className="font-medium">100 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Social sharing</span>
                    <span className="font-medium">25 pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-3">
              <button
                onClick={() => {
                  setIsExpanded(false);
                  // Navigate to full loyalty dashboard
                  window.location.href = '/loyalty';
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                View Full Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}