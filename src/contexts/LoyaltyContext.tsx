'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserLoyalty,
  LoyaltyTier,
  PointTransaction,
  Achievement,
  Reward,
  RedeemedReward,
  SocialAction,
  ReferralProgram,
  LoyaltyConfiguration
} from '@/types/loyalty';

interface LoyaltyContextType {
  // State
  userLoyalty: UserLoyalty | null;
  configuration: LoyaltyConfiguration;
  availableRewards: Reward[];
  pointHistory: PointTransaction[];
  userAchievements: Achievement[];

  // Actions
  earnPoints: (source: any, amount: number) => Promise<PointTransaction>;
  redeemReward: (rewardId: string) => Promise<RedeemedReward | null>;
  submitSocialAction: (action: Omit<SocialAction, 'id' | 'userId' | 'createdAt' | 'verified'>) => Promise<SocialAction>;
  createReferral: (referredEmail: string) => Promise<ReferralProgram>;
  checkAchievements: () => Promise<Achievement[]>;
  updateProgress: (activityType: string, metadata?: any) => Promise<void>;

  // Getters
  getPointsBalance: () => number;
  getCurrentTier: () => LoyaltyTier;
  getNextTier: () => LoyaltyTier | null;
  getTierProgress: () => number;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

// Default configuration
const defaultConfiguration: LoyaltyConfiguration = {
  pointsPerEuro: 1,
  pointsExpiration: 365, // 1 year
  referralPoints: 100,
  reviewPoints: 50,
  socialSharePoints: 25,
  birthdayPoints: 200,
  signupPoints: 100,
  tiers: [
    {
      id: 'bronze',
      name: 'Bronze',
      minPoints: 0,
      maxPoints: 499,
      color: '#CD7F32',
      icon: '🥉',
      badgeIcon: '🏆',
      benefits: [
        {
          id: 'bronze-shipping',
          type: 'shipping',
          title: 'Free Shipping',
          description: 'Free shipping on orders over €75',
          value: 75,
          icon: '🚚'
        },
        {
          id: 'bronze-birthday',
          type: 'birthday',
          title: 'Birthday Bonus',
          description: '200 bonus points on your birthday',
          value: 200,
          icon: '🎂'
        }
      ]
    },
    {
      id: 'silver',
      name: 'Silver',
      minPoints: 500,
      maxPoints: 999,
      color: '#C0C0C0',
      icon: '🥈',
      badgeIcon: '🏆',
      benefits: [
        {
          id: 'silver-shipping',
          type: 'shipping',
          title: 'Free Shipping',
          description: 'Free shipping on orders over €50',
          value: 50,
          icon: '🚚'
        },
        {
          id: 'silver-discount',
          type: 'discount',
          title: 'Member Discount',
          description: '5% discount on all orders',
          value: 5,
          icon: '💰'
        },
        {
          id: 'silver-early',
          type: 'early_access',
          title: 'Early Access',
          description: '24 hours early access to new releases',
          value: 24,
          icon: '⏰'
        }
      ]
    },
    {
      id: 'gold',
      name: 'Gold',
      minPoints: 1000,
      maxPoints: null,
      color: '#FFD700',
      icon: '🥇',
      badgeIcon: '👑',
      benefits: [
        {
          id: 'gold-shipping',
          type: 'shipping',
          title: 'Free Shipping',
          description: 'Free shipping on all orders',
          value: 0,
          icon: '🚚'
        },
        {
          id: 'gold-discount',
          type: 'discount',
          title: 'VIP Discount',
          description: '10% discount on all orders',
          value: 10,
          icon: '💎'
        },
        {
          id: 'gold-early',
          type: 'early_access',
          title: 'VIP Early Access',
          description: '48 hours early access to new releases',
          value: 48,
          icon: '⭐'
        },
        {
          id: 'gold-exclusive',
          type: 'exclusive',
          title: 'Exclusive Products',
          description: 'Access to limited edition and exclusive products',
          value: 1,
          icon: '🔥'
        }
      ]
    }
  ],
  achievements: [
    {
      id: 'first-purchase',
      title: 'First Steps',
      description: 'Make your first purchase',
      icon: '👟',
      category: 'purchase',
      pointsReward: 50,
      requirements: {
        type: 'purchase_count',
        target: 1
      }
    },
    {
      id: 'big-spender',
      title: 'Big Spender',
      description: 'Spend over €500 in total',
      icon: '💳',
      category: 'purchase',
      pointsReward: 200,
      requirements: {
        type: 'total_spent',
        target: 500
      }
    },
    {
      id: 'reviewer',
      title: 'Product Reviewer',
      description: 'Write 5 product reviews',
      icon: '⭐',
      category: 'social',
      pointsReward: 100,
      requirements: {
        type: 'reviews_written',
        target: 5
      }
    },
    {
      id: 'social-butterfly',
      title: 'Social Butterfly',
      description: 'Share 10 products on social media',
      icon: '🦋',
      category: 'social',
      pointsReward: 150,
      requirements: {
        type: 'social_shares',
        target: 10
      }
    },
    {
      id: 'brand-loyalist',
      title: 'Nike Enthusiast',
      description: 'Purchase 5 Nike products',
      icon: '✔️',
      category: 'loyalty',
      pointsReward: 100,
      requirements: {
        type: 'brand_loyalty',
        target: 5,
        metadata: {
          brandId: 'nike'
        }
      }
    }
  ],
  rewards: [
    {
      id: 'free-shipping-coupon',
      title: 'Free Shipping Coupon',
      description: 'Free shipping on your next order',
      type: 'free_shipping',
      pointsCost: 100,
      value: 0,
      icon: '📦',
      isActive: true,
      terms: 'Valid for 30 days'
    },
    {
      id: 'discount-5',
      title: '5€ Discount',
      description: '5€ off your next order',
      type: 'discount',
      pointsCost: 250,
      value: 5,
      icon: '💰',
      isActive: true,
      terms: 'Minimum order value €50'
    },
    {
      id: 'discount-10',
      title: '10€ Discount',
      description: '10€ off your next order',
      type: 'discount',
      pointsCost: 500,
      value: 10,
      icon: '💎',
      isActive: true,
      terms: 'Minimum order value €100'
    },
    {
      id: 'early-access-pass',
      title: 'Early Access Pass',
      description: '48h early access to new releases',
      type: 'exclusive_access',
      pointsCost: 300,
      value: 48,
      icon: '🎫',
      isActive: true,
      terms: 'Valid for next release only'
    }
  ]
};

// Mock user loyalty data
const mockUserLoyalty: UserLoyalty = {
  userId: 'user-123',
  totalPoints: 750,
  availablePoints: 650,
  tier: defaultConfiguration.tiers[1], // Silver tier
  tierProgress: 65, // 65% to Gold
  joinDate: new Date('2023-06-15'),
  lastActivity: new Date(),
  achievements: [
    {
      ...defaultConfiguration.achievements[0],
      unlockedAt: new Date('2023-06-15')
    },
    {
      ...defaultConfiguration.achievements[2],
      unlockedAt: new Date('2023-08-20')
    }
  ],
  referralCode: 'SNEAKER750',
  referredUsers: ['user-456', 'user-789']
};

export function LoyaltyProvider({ children }: { children: React.ReactNode }) {
  const [userLoyalty, setUserLoyalty] = useState<UserLoyalty | null>(mockUserLoyalty);
  const [configuration] = useState<LoyaltyConfiguration>(defaultConfiguration);
  const [availableRewards] = useState<Reward[]>(defaultConfiguration.rewards);
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>([]);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>(mockUserLoyalty.achievements);

  const earnPoints = async (source: any, amount: number): Promise<PointTransaction> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const transaction: PointTransaction = {
      id: `tx-${Date.now()}`,
      userId: userLoyalty?.userId || 'user-123',
      type: 'earned',
      source,
      amount,
      description: `Earned ${amount} points`,
      createdAt: new Date()
    };

    setPointHistory(prev => [transaction, ...prev]);

    if (userLoyalty) {
      const newTotal = userLoyalty.totalPoints + amount;
      const newAvailable = userLoyalty.availablePoints + amount;
      const newTier = getTierByPoints(newTotal);

      setUserLoyalty({
        ...userLoyalty,
        totalPoints: newTotal,
        availablePoints: newAvailable,
        tier: newTier,
        tierProgress: calculateTierProgress(newTotal, newTier),
        lastActivity: new Date()
      });
    }

    return transaction;
  };

  const redeemReward = async (rewardId: string): Promise<RedeemedReward | null> => {
    const reward = availableRewards.find(r => r.id === rewardId);
    if (!reward || !userLoyalty || userLoyalty.availablePoints < reward.pointsCost) {
      return null;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const redemption: RedeemedReward = {
      id: `redemption-${Date.now()}`,
      userId: userLoyalty.userId,
      rewardId,
      reward,
      pointsUsed: reward.pointsCost,
      redeemedAt: new Date(),
      code: generateRedemptionCode(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    // Deduct points
    const transaction: PointTransaction = {
      id: `tx-${Date.now()}`,
      userId: userLoyalty.userId,
      type: 'redeemed',
      source: { type: 'purchase' },
      amount: -reward.pointsCost,
      description: `Redeemed: ${reward.title}`,
      createdAt: new Date()
    };

    setPointHistory(prev => [transaction, ...prev]);
    setUserLoyalty({
      ...userLoyalty,
      availablePoints: userLoyalty.availablePoints - reward.pointsCost,
      lastActivity: new Date()
    });

    return redemption;
  };

  const submitSocialAction = async (action: Omit<SocialAction, 'id' | 'userId' | 'createdAt' | 'verified'>): Promise<SocialAction> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const socialAction: SocialAction = {
      id: `social-${Date.now()}`,
      userId: userLoyalty?.userId || 'user-123',
      createdAt: new Date(),
      verified: true,
      moderationStatus: 'approved',
      ...action
    };

    // Award points for social action
    await earnPoints({ type: 'social_share', metadata: { socialPlatform: action.platform } }, action.pointsEarned);

    return socialAction;
  };

  const createReferral = async (referredEmail: string): Promise<ReferralProgram> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const referral: ReferralProgram = {
      referrerUserId: userLoyalty?.userId || 'user-123',
      referredUserId: `user-${Date.now()}`,
      referralCode: userLoyalty?.referralCode || 'SNEAKER750',
      status: 'pending',
      referrerReward: configuration.referralPoints,
      referredReward: 50 // Welcome bonus for new user
    };

    return referral;
  };

  const checkAchievements = async (): Promise<Achievement[]> => {
    // Simulate checking for new achievements
    await new Promise(resolve => setTimeout(resolve, 500));

    // This would normally check user's activity against achievement requirements
    return userAchievements;
  };

  const updateProgress = async (activityType: string, metadata?: any): Promise<void> => {
    // Simulate updating user progress for achievements
    await new Promise(resolve => setTimeout(resolve, 300));

    // This would update progress towards achievements and check for completions
    console.log('Updating progress for:', activityType, metadata);
  };

  const getTierByPoints = (points: number): LoyaltyTier => {
    return configuration.tiers.find(tier =>
      points >= tier.minPoints && (tier.maxPoints === null || points <= tier.maxPoints)
    ) || configuration.tiers[0];
  };

  const calculateTierProgress = (points: number, tier: LoyaltyTier): number => {
    if (tier.maxPoints === null) return 100; // Max tier reached

    const tierRange = tier.maxPoints - tier.minPoints;
    const pointsInTier = points - tier.minPoints;
    return Math.min(100, (pointsInTier / tierRange) * 100);
  };

  const generateRedemptionCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const getPointsBalance = (): number => userLoyalty?.availablePoints || 0;

  const getCurrentTier = (): LoyaltyTier => userLoyalty?.tier || configuration.tiers[0];

  const getNextTier = (): LoyaltyTier | null => {
    if (!userLoyalty) return configuration.tiers[1];

    const currentTierIndex = configuration.tiers.findIndex(t => t.id === userLoyalty.tier.id);
    return currentTierIndex < configuration.tiers.length - 1
      ? configuration.tiers[currentTierIndex + 1]
      : null;
  };

  const getTierProgress = (): number => userLoyalty?.tierProgress || 0;

  return (
    <LoyaltyContext.Provider
      value={{
        userLoyalty,
        configuration,
        availableRewards,
        pointHistory,
        userAchievements,
        earnPoints,
        redeemReward,
        submitSocialAction,
        createReferral,
        checkAchievements,
        updateProgress,
        getPointsBalance,
        getCurrentTier,
        getNextTier,
        getTierProgress
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
}

export function useLoyalty() {
  const context = useContext(LoyaltyContext);
  if (context === undefined) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
}