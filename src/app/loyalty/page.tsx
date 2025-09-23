'use client';

import React from 'react';
import { LoyaltyProvider } from '@/contexts/LoyaltyContext';
import LoyaltyDashboard from '@/components/LoyaltyDashboard';
import SocialShare from '@/components/SocialShare';

export default function LoyaltyPage() {
  return (
    <LoyaltyProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">
                SneakerVault Loyalty Program
              </h1>
              <p className="text-xl text-purple-100 max-w-3xl mx-auto">
                Earn points with every purchase, unlock exclusive rewards, and join a community of sneaker enthusiasts.
              </p>
            </div>

            {/* Program Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Earn Points</h3>
                <p className="text-purple-100 text-sm">
                  Get 1 point for every €1 spent, plus bonus points for reviews, social shares, and referrals
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎁</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Exclusive Rewards</h3>
                <p className="text-purple-100 text-sm">
                  Redeem points for discounts, free shipping, early access to drops, and exclusive products
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👑</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">VIP Status</h3>
                <p className="text-purple-100 text-sm">
                  Progress through Bronze, Silver, and Gold tiers to unlock increasingly valuable benefits
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Dashboard */}
            <div className="lg:col-span-2">
              <LoyaltyDashboard />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* How to Earn Points */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  How to Earn Points
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🛒</span>
                      <span className="text-gray-700">Make purchases</span>
                    </div>
                    <span className="font-medium text-purple-600">1€ = 1pt</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">⭐</span>
                      <span className="text-gray-700">Write reviews</span>
                    </div>
                    <span className="font-medium text-purple-600">50pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📱</span>
                      <span className="text-gray-700">Social shares</span>
                    </div>
                    <span className="font-medium text-purple-600">25pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">👥</span>
                      <span className="text-gray-700">Refer friends</span>
                    </div>
                    <span className="font-medium text-purple-600">100pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🎂</span>
                      <span className="text-gray-700">Birthday bonus</span>
                    </div>
                    <span className="font-medium text-purple-600">200pts</span>
                  </div>
                </div>
              </div>

              {/* Tier Benefits */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Membership Tiers
                </h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xl">🥉</span>
                      <span className="font-semibold text-gray-900">Bronze</span>
                      <span className="text-sm text-gray-600">(0-499 pts)</span>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Free shipping on orders €75+</li>
                      <li>• Birthday bonus points</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-gray-400 pl-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xl">🥈</span>
                      <span className="font-semibold text-gray-900">Silver</span>
                      <span className="text-sm text-gray-600">(500-999 pts)</span>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Free shipping on orders €50+</li>
                      <li>• 5% member discount</li>
                      <li>• 24h early access to releases</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-yellow-400 pl-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xl">🥇</span>
                      <span className="font-semibold text-gray-900">Gold</span>
                      <span className="text-sm text-gray-600">(1000+ pts)</span>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Free shipping on all orders</li>
                      <li>• 10% VIP discount</li>
                      <li>• 48h early access to releases</li>
                      <li>• Exclusive products access</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Social Share Component */}
              <SocialShare
                productName="Featured Sneakers"
                productId="featured"
              />
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                Ready to Start Earning?
              </h2>
              <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                Join thousands of sneaker enthusiasts earning points and unlocking exclusive rewards.
                Your loyalty journey starts with your first purchase!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/products'}
                  className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Shop Now & Earn Points
                </button>
                <button
                  onClick={() => window.location.href = '/auth/signup'}
                  className="px-6 py-3 border border-white text-white rounded-lg hover:bg-white/10 transition-colors font-medium"
                >
                  Join Loyalty Program
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LoyaltyProvider>
  );
}