export interface UserLoyalty {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  tier: LoyaltyTier;
  tierProgress: number; // percentage to next tier
  joinDate: Date;
  lastActivity: Date;
  achievements: Achievement[];
  referralCode: string;
  referredUsers: string[];
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  maxPoints: number | null;
  color: string;
  icon: string;
  benefits: TierBenefit[];
  badgeIcon?: string;
}

export interface TierBenefit {
  id: string;
  type: 'discount' | 'shipping' | 'early_access' | 'exclusive' | 'birthday' | 'points_multiplier';
  title: string;
  description: string;
  value: number; // percentage for discounts, days for early access, etc.
  icon: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  source: PointSource;
  amount: number;
  description: string;
  orderId?: string;
  referralId?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface PointSource {
  type: 'purchase' | 'review' | 'social_share' | 'referral' | 'birthday' | 'signup' | 'achievement' | 'bonus';
  metadata?: {
    productId?: string;
    orderId?: string;
    socialPlatform?: string;
    achievementId?: string;
    referredUserId?: string;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'purchase' | 'social' | 'loyalty' | 'special';
  pointsReward: number;
  unlockedAt?: Date;
  progress?: number; // 0-100 for partially completed achievements
  requirements: AchievementRequirement;
}

export interface AchievementRequirement {
  type: 'purchase_count' | 'total_spent' | 'reviews_written' | 'social_shares' | 'referrals' | 'consecutive_orders' | 'brand_loyalty';
  target: number;
  timeframe?: number; // days, for time-based achievements
  metadata?: {
    brandId?: string;
    productCategory?: string;
    minOrderValue?: number;
  };
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'free_shipping' | 'product' | 'exclusive_access' | 'experience';
  pointsCost: number;
  value: number; // discount percentage or product value
  icon: string;
  isActive: boolean;
  expiresAt?: Date;
  stock?: number;
  tierRequirement?: string; // minimum tier needed
  terms?: string;
}

export interface RedeemedReward {
  id: string;
  userId: string;
  rewardId: string;
  reward: Reward;
  pointsUsed: number;
  redeemedAt: Date;
  usedAt?: Date;
  orderId?: string;
  code?: string; // discount code or access code
  expiresAt?: Date;
}

export interface SocialAction {
  id: string;
  userId: string;
  type: 'share' | 'review' | 'photo_upload' | 'wishlist_share' | 'tag_friend';
  platform?: 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'youtube';
  content: string;
  productId?: string;
  orderId?: string;
  pointsEarned: number;
  createdAt: Date;
  verified: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
}

export interface UserGeneratedContent {
  id: string;
  userId: string;
  type: 'photo' | 'video' | 'review';
  content: string;
  mediaUrls: string[];
  productId: string;
  orderId?: string;
  hashtags: string[];
  likes: number;
  shares: number;
  featured: boolean;
  createdAt: Date;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  pointsEarned: number;
}

export interface ReferralProgram {
  referrerUserId: string;
  referredUserId: string;
  referralCode: string;
  status: 'pending' | 'qualified' | 'completed';
  referrerReward: number; // points
  referredReward: number; // points or discount
  qualificationDate?: Date; // when referred user made first purchase
  completedAt?: Date;
  orderId?: string;
}

export interface LoyaltyStats {
  totalUsers: number;
  activeUsers: number; // last 30 days
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  averagePointsPerUser: number;
  tierDistribution: {
    bronze: number;
    silver: number;
    gold: number;
  };
  topEarners: UserLoyalty[];
  mostPopularRewards: Reward[];
}

export interface LoyaltyConfiguration {
  pointsPerEuro: number; // 1 euro = X points
  pointsExpiration: number; // days until points expire
  referralPoints: number;
  reviewPoints: number;
  socialSharePoints: number;
  birthdayPoints: number;
  signupPoints: number;
  tiers: LoyaltyTier[];
  achievements: Achievement[];
  rewards: Reward[];
}