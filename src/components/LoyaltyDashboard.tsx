'use client';

import React, { useState } from 'react';
import { useLoyalty } from '@/contexts/LoyaltyContext';
import { Achievement, Reward } from '@/types/loyalty';
import { motion } from 'framer-motion';

export default function LoyaltyDashboard() {
  const {
    userLoyalty,
    availableRewards,
    userAchievements,
    redeemReward,
    getPointsBalance,
    getCurrentTier,
    getNextTier,
    getTierProgress
  } = useLoyalty();

  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'achievements' | 'history'>('overview');
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);

  if (!userLoyalty) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">👤</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Join Our Loyalty Program
        </h3>
        <p className="text-gray-600">
          Earn points with every purchase and unlock exclusive rewards
        </p>
      </div>
    );
  }

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const progress = getTierProgress();
  const pointsBalance = getPointsBalance();

  const handleRedemption = async (rewardId: string) => {
    setIsRedeeming(rewardId);
    try {
      const redemption = await redeemReward(rewardId);
      if (redemption) {
        // Show success message
        console.log('Reward redeemed successfully!', redemption);
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
    } finally {
      setIsRedeeming(null);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'rewards', name: 'Rewards', icon: '🎁' },
    { id: 'achievements', name: 'Achievements', icon: '🏆' },
    { id: 'history', name: 'History', icon: '📜' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Loyalty Dashboard</h2>
            <p className="text-purple-100">
              Track your points, tier status, and exclusive rewards
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{pointsBalance}</div>
            <div className="text-purple-100 text-sm">Available Points</div>
          </div>
        </div>

        {/* Tier Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{currentTier.icon}</span>
              <span className="font-semibold">{currentTier.name} Member</span>
            </div>
            {nextTier && (
              <div className="flex items-center space-x-2 text-purple-100">
                <span className="text-sm">Next: {nextTier.name}</span>
                <span className="text-lg">{nextTier.icon}</span>
              </div>
            )}
          </div>
          <div className="w-full bg-purple-500/30 rounded-full h-3 mb-2">
            <motion.div
              className="bg-white rounded-full h-3"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="text-xs text-purple-100">
            {nextTier
              ? `${Math.round(progress)}% to ${nextTier.name} (${nextTier.minPoints - userLoyalty.totalPoints} points needed)`
              : 'Maximum tier reached!'
            }
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            userLoyalty={userLoyalty}
            currentTier={currentTier}
            nextTier={nextTier}
            userAchievements={userAchievements}
          />
        )}

        {activeTab === 'rewards' && (
          <RewardsTab
            rewards={availableRewards}
            pointsBalance={pointsBalance}
            currentTier={currentTier}
            onRedeem={handleRedemption}
            isRedeeming={isRedeeming}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsTab achievements={userAchievements} />
        )}

        {activeTab === 'history' && (
          <HistoryTab userId={userLoyalty.userId} />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ userLoyalty, currentTier, nextTier, userAchievements }: any) {
  const recentAchievements = userAchievements.slice(-3);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{userLoyalty.totalPoints}</div>
          <div className="text-sm text-blue-600">Total Points</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{userLoyalty.availablePoints}</div>
          <div className="text-sm text-green-600">Available</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{userAchievements.length}</div>
          <div className="text-sm text-purple-600">Achievements</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{userLoyalty.referredUsers.length}</div>
          <div className="text-sm text-orange-600">Referrals</div>
        </div>
      </div>

      {/* Current Tier Benefits */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {currentTier.name} Member Benefits
        </h3>
        <div className="space-y-3">
          {currentTier.benefits.map((benefit: any) => (
            <div key={benefit.id} className="flex items-center space-x-3">
              <span className="text-xl">{benefit.icon}</span>
              <div>
                <div className="font-medium text-gray-900">{benefit.title}</div>
                <div className="text-sm text-gray-600">{benefit.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
          <div className="space-y-3">
            {recentAchievements.map((achievement: Achievement) => (
              <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <span className="text-2xl">{achievement.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{achievement.title}</div>
                  <div className="text-sm text-gray-600">{achievement.description}</div>
                </div>
                <div className="text-sm font-medium text-yellow-600">
                  +{achievement.pointsReward} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral Code */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Share & Earn</h3>
        <p className="text-gray-600 mb-4">
          Invite friends and earn 100 points for each successful referral!
        </p>
        <div className="flex items-center space-x-3">
          <div className="flex-1 px-3 py-2 bg-white rounded border text-center font-mono font-bold">
            {userLoyalty.referralCode}
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Copy Code
          </button>
        </div>
      </div>
    </div>
  );
}

function RewardsTab({ rewards, pointsBalance, currentTier, onRedeem, isRedeeming }: any) {
  const availableRewards = rewards.filter((reward: Reward) =>
    !reward.tierRequirement || reward.tierRequirement === currentTier.id
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Available Rewards</h3>
        <div className="text-sm text-gray-600">
          You have {pointsBalance} points to spend
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableRewards.map((reward: Reward) => (
          <div key={reward.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{reward.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{reward.title}</h4>
                  <p className="text-sm text-gray-600">{reward.description}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-purple-600">
                {reward.pointsCost} points
              </div>
              <button
                onClick={() => onRedeem(reward.id)}
                disabled={pointsBalance < reward.pointsCost || isRedeeming === reward.id}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRedeeming === reward.id ? 'Redeeming...' : 'Redeem'}
              </button>
            </div>

            {reward.terms && (
              <div className="mt-2 text-xs text-gray-500">
                {reward.terms}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsTab({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Your Achievements</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">{achievement.icon}</span>
              <div>
                <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                <p className="text-sm text-gray-600">{achievement.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-green-600 font-medium">
                +{achievement.pointsReward} points earned
              </div>
              {achievement.unlockedAt && (
                <div className="text-xs text-gray-500">
                  Unlocked {achievement.unlockedAt.toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTab({ userId }: { userId: string }) {
  // Mock transaction history
  const transactions = [
    {
      id: '1',
      type: 'earned',
      description: 'Purchase reward',
      amount: 150,
      date: new Date('2024-01-15')
    },
    {
      id: '2',
      type: 'redeemed',
      description: 'Free shipping coupon',
      amount: -100,
      date: new Date('2024-01-10')
    },
    {
      id: '3',
      type: 'earned',
      description: 'Product review',
      amount: 50,
      date: new Date('2024-01-05')
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Points History</h3>

      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium text-gray-900">{transaction.description}</div>
              <div className="text-sm text-gray-600">{transaction.date.toLocaleDateString()}</div>
            </div>
            <div className={`font-bold ${
              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.amount > 0 ? '+' : ''}{transaction.amount} pts
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}