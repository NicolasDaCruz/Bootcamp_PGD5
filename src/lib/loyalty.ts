// Loyalty system utilities for managing user loyalty points and tiers

export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  color: 'bronze' | 'silver' | 'gold';
  benefits: string[];
  multiplier: number; // Points multiplier for purchases
}

export interface LoyaltyProgress {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsNeeded: number;
  progressPercentage: number;
}

// Define loyalty tiers
export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    color: 'bronze',
    benefits: [
      'Standard shipping',
      'Member-only promotions',
      'Birthday discount',
    ],
    multiplier: 1,
  },
  {
    id: 'silver',
    name: 'Silver',
    minPoints: 1000,
    color: 'silver',
    benefits: [
      'Free standard shipping',
      'Early access to sales',
      'Priority customer support',
      'Extended return window',
    ],
    multiplier: 1.25,
  },
  {
    id: 'gold',
    name: 'Gold',
    minPoints: 5000,
    color: 'gold',
    benefits: [
      'Free express shipping',
      'Exclusive product access',
      'Personal shopping assistant',
      'VIP customer support',
      'Special member events',
    ],
    multiplier: 1.5,
  },
];

// Points earning rates
export const POINTS_EARNING = {
  PURCHASE: 1, // 1 point per dollar spent
  REVIEW: 50, // Points for writing a review
  REFERRAL: 200, // Points for successful referral
  BIRTHDAY: 100, // Birthday bonus
  REGISTRATION: 100, // Welcome bonus
};

/**
 * Get the current loyalty tier based on points
 */
export function getLoyaltyTier(points: number): LoyaltyTier {
  // Find the highest tier the user qualifies for
  const qualifiedTiers = LOYALTY_TIERS.filter(tier => points >= tier.minPoints);
  return qualifiedTiers[qualifiedTiers.length - 1] || LOYALTY_TIERS[0];
}

/**
 * Get loyalty progress information
 */
export function getLoyaltyProgress(points: number): LoyaltyProgress {
  const currentTier = getLoyaltyTier(points);
  const currentTierIndex = LOYALTY_TIERS.findIndex(tier => tier.id === currentTier.id);
  const nextTier = currentTierIndex < LOYALTY_TIERS.length - 1
    ? LOYALTY_TIERS[currentTierIndex + 1]
    : null;

  let pointsNeeded = 0;
  let progressPercentage = 100;

  if (nextTier) {
    pointsNeeded = nextTier.minPoints - points;
    const pointsInCurrentTier = points - currentTier.minPoints;
    const pointsRequiredForCurrentTier = nextTier.minPoints - currentTier.minPoints;
    progressPercentage = Math.round((pointsInCurrentTier / pointsRequiredForCurrentTier) * 100);
  }

  return {
    currentTier,
    nextTier,
    pointsNeeded,
    progressPercentage,
  };
}

/**
 * Calculate points earned from a purchase
 */
export function calculatePurchasePoints(
  amount: number,
  userTier: LoyaltyTier,
  isPromotion: boolean = false,
  promotionMultiplier: number = 1
): number {
  const basePoints = Math.floor(amount * POINTS_EARNING.PURCHASE);
  const tierPoints = Math.floor(basePoints * userTier.multiplier);
  const finalPoints = isPromotion ? Math.floor(tierPoints * promotionMultiplier) : tierPoints;

  return finalPoints;
}

/**
 * Get all benefits for a specific tier
 */
export function getTierBenefits(tierId: string): string[] {
  const tier = LOYALTY_TIERS.find(t => t.id === tierId);
  return tier?.benefits || [];
}

/**
 * Check if user qualifies for free shipping based on tier
 */
export function qualifiesForFreeShipping(points: number): boolean {
  const tier = getLoyaltyTier(points);
  return tier.id === 'silver' || tier.id === 'gold';
}

/**
 * Check if user qualifies for express shipping based on tier
 */
export function qualifiesForExpressShipping(points: number): boolean {
  const tier = getLoyaltyTier(points);
  return tier.id === 'gold';
}

/**
 * Get shipping discount percentage based on tier
 */
export function getShippingDiscount(points: number): number {
  const tier = getLoyaltyTier(points);

  switch (tier.id) {
    case 'silver':
      return 100; // Free standard shipping
    case 'gold':
      return 100; // Free express shipping
    default:
      return 0;
  }
}

/**
 * Award points to user (utility function for backend operations)
 */
export interface PointsTransaction {
  userId: string;
  points: number;
  reason: 'purchase' | 'review' | 'referral' | 'birthday' | 'bonus' | 'adjustment';
  orderId?: string;
  description?: string;
  createdAt: Date;
}

/**
 * Create a points transaction record
 */
export function createPointsTransaction(
  userId: string,
  points: number,
  reason: PointsTransaction['reason'],
  options: {
    orderId?: string;
    description?: string;
  } = {}
): PointsTransaction {
  return {
    userId,
    points,
    reason,
    orderId: options.orderId,
    description: options.description || getDefaultDescription(reason, points),
    createdAt: new Date(),
  };
}

/**
 * Get default description for points transaction
 */
function getDefaultDescription(reason: PointsTransaction['reason'], points: number): string {
  switch (reason) {
    case 'purchase':
      return `Earned ${points} points from purchase`;
    case 'review':
      return `Earned ${points} points for product review`;
    case 'referral':
      return `Earned ${points} points for successful referral`;
    case 'birthday':
      return `Birthday bonus: ${points} points`;
    case 'bonus':
      return `Bonus points: ${points}`;
    case 'adjustment':
      return `Points adjustment: ${points > 0 ? '+' : ''}${points}`;
    default:
      return `Points transaction: ${points > 0 ? '+' : ''}${points}`;
  }
}

/**
 * Calculate loyalty tier upgrade notifications
 */
export function checkTierUpgrade(oldPoints: number, newPoints: number): {
  hasUpgrade: boolean;
  newTier?: LoyaltyTier;
  oldTier?: LoyaltyTier;
} {
  const oldTier = getLoyaltyTier(oldPoints);
  const newTier = getLoyaltyTier(newPoints);

  return {
    hasUpgrade: newTier.minPoints > oldTier.minPoints,
    newTier: newTier.minPoints > oldTier.minPoints ? newTier : undefined,
    oldTier: newTier.minPoints > oldTier.minPoints ? oldTier : undefined,
  };
}

/**
 * Get tier-specific styling classes
 */
export function getTierStyling(tierId: string): {
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
} {
  switch (tierId) {
    case 'silver':
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-300',
        iconColor: 'text-gray-600',
      };
    case 'gold':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-300',
        iconColor: 'text-yellow-600',
      };
    default: // bronze
      return {
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-800',
        borderColor: 'border-amber-300',
        iconColor: 'text-amber-600',
      };
  }
}