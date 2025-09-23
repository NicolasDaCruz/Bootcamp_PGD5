'use client';

import { useProfile } from '@/hooks/useAuth';
import { getLoyaltyTier, getLoyaltyProgress, LOYALTY_TIERS, getTierStyling } from '@/lib/loyalty';

export function LoyaltyDashboard() {
  const profile = useProfile();

  if (!profile) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const loyaltyTier = getLoyaltyTier(profile.loyalty_points);
  const loyaltyProgress = getLoyaltyProgress(profile.loyalty_points);
  const tierStyling = getTierStyling(loyaltyTier.id);

  return (
    <div className="p-6">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loyalty Dashboard</h2>
          <p className="text-gray-600">
            Track your loyalty points and tier benefits
          </p>
        </div>

        {/* Current Tier Status */}
        <div className={`${tierStyling.bgColor} ${tierStyling.borderColor} border-2 rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 ${tierStyling.bgColor} rounded-full`}>
                <svg className={`h-8 w-8 ${tierStyling.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${tierStyling.textColor}`}>
                  {loyaltyTier.name} Member
                </h3>
                <p className={`text-sm ${tierStyling.textColor} opacity-75`}>
                  {profile.loyalty_points} loyalty points
                </p>
              </div>
            </div>
            <div className={`text-right`}>
              <p className={`text-sm ${tierStyling.textColor} opacity-75`}>Points Multiplier</p>
              <p className={`text-xl font-bold ${tierStyling.textColor}`}>
                {loyaltyTier.multiplier}x
              </p>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {loyaltyProgress.nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={`${tierStyling.textColor} opacity-75`}>
                  Progress to {loyaltyProgress.nextTier.name}
                </span>
                <span className={`font-medium ${tierStyling.textColor}`}>
                  {loyaltyProgress.pointsNeeded} points needed
                </span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
                <div
                  className={`bg-white bg-opacity-80 h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${loyaltyProgress.progressPercentage}%` }}
                ></div>
              </div>
              <p className={`text-xs ${tierStyling.textColor} opacity-75`}>
                {loyaltyProgress.progressPercentage}% complete
              </p>
            </div>
          )}
        </div>

        {/* Current Tier Benefits */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your {loyaltyTier.name} Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loyaltyTier.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All Tiers Overview */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Loyalty Tiers</h3>
          <div className="space-y-4">
            {LOYALTY_TIERS.map((tier) => {
              const isCurrentTier = tier.id === loyaltyTier.id;
              const isAchieved = profile.loyalty_points >= tier.minPoints;
              const styling = getTierStyling(tier.id);

              return (
                <div
                  key={tier.id}
                  className={`relative border-2 rounded-lg p-4 transition-all ${
                    isCurrentTier
                      ? `${styling.borderColor} ${styling.bgColor}`
                      : isAchieved
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        isCurrentTier
                          ? styling.bgColor
                          : isAchieved
                          ? 'bg-green-100'
                          : 'bg-gray-200'
                      }`}>
                        <svg className={`h-5 w-5 ${
                          isCurrentTier
                            ? styling.iconColor
                            : isAchieved
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className={`font-medium ${
                          isCurrentTier
                            ? styling.textColor
                            : isAchieved
                            ? 'text-green-800'
                            : 'text-gray-700'
                        }`}>
                          {tier.name}
                          {isCurrentTier && <span className="ml-2 text-xs">(Current)</span>}
                        </h4>
                        <p className={`text-sm ${
                          isCurrentTier
                            ? `${styling.textColor} opacity-75`
                            : isAchieved
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`}>
                          {tier.minPoints === 0 ? 'No minimum' : `${tier.minPoints}+ points`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${
                        isCurrentTier
                          ? `${styling.textColor} opacity-75`
                          : isAchieved
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}>
                        Points Multiplier
                      </p>
                      <p className={`font-bold ${
                        isCurrentTier
                          ? styling.textColor
                          : isAchieved
                          ? 'text-green-800'
                          : 'text-gray-700'
                      }`}>
                        {tier.multiplier}x
                      </p>
                    </div>
                  </div>

                  {/* Tier Benefits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {tier.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="flex-shrink-0">
                          <svg className={`h-4 w-4 ${
                            isCurrentTier
                              ? styling.iconColor
                              : isAchieved
                              ? 'text-green-500'
                              : 'text-gray-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className={`text-xs ${
                          isCurrentTier
                            ? `${styling.textColor} opacity-75`
                            : isAchieved
                            ? 'text-green-700'
                            : 'text-gray-500'
                        }`}>
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How to Earn Points */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">How to Earn Points</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Make Purchases</p>
                <p className="text-xs text-blue-700">1 point per $1 spent</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Write Reviews</p>
                <p className="text-xs text-blue-700">50 points per review</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Refer Friends</p>
                <p className="text-xs text-blue-700">200 points per referral</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 0h-8m0 0v1a3 3 0 003 3h4a3 3 0 003-3v-1m-4 0V7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Birthday Bonus</p>
                <p className="text-xs text-blue-700">100 points annually</p>
              </div>
            </div>
          </div>
        </div>

        {/* Points History Placeholder */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Points History</h3>
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No points history</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your points transactions will appear here as you earn and redeem points.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}