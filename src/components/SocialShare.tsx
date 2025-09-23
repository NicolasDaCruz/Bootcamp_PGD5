'use client';

import React, { useState } from 'react';
import { useLoyalty } from '@/contexts/LoyaltyContext';
import { SocialAction } from '@/types/loyalty';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialShareProps {
  productId?: string;
  productName?: string;
  productImage?: string;
  onShare?: (platform: string) => void;
}

const socialPlatforms = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    points: 25,
    description: 'Share a photo or story'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '👍',
    color: 'bg-blue-600',
    points: 25,
    description: 'Share with friends'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: '🐦',
    color: 'bg-sky-500',
    points: 25,
    description: 'Tweet about it'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-black',
    points: 50,
    description: 'Create a video'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '📺',
    color: 'bg-red-600',
    points: 100,
    description: 'Make a review video'
  }
];

export default function SocialShare({ productId, productName, productImage, onShare }: SocialShareProps) {
  const { submitSocialAction, configuration } = useLoyalty();
  const [isSharing, setIsSharing] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [shareContent, setShareContent] = useState('');
  const [shareType, setShareType] = useState<'share' | 'review' | 'photo_upload'>('share');

  const handleShare = async (platformId: string) => {
    setIsSharing(platformId);

    try {
      const platform = socialPlatforms.find(p => p.id === platformId);
      if (!platform) return;

      // For demo purposes, we'll simulate the share action
      const action: Omit<SocialAction, 'id' | 'userId' | 'createdAt' | 'verified'> = {
        type: shareType,
        platform: platformId as any,
        content: shareContent || `Check out this amazing sneaker: ${productName}!`,
        productId,
        pointsEarned: platform.points,
        moderationStatus: 'approved'
      };

      const result = await submitSocialAction(action);

      // Show success message
      console.log('Share successful!', result);
      onShare?.(platformId);
      setShowModal(false);
      setShareContent('');

    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(null);
    }
  };

  const openShareModal = (platformId: string) => {
    setSelectedPlatform(platformId);
    setShowModal(true);

    // Pre-fill content based on product
    if (productName) {
      setShareContent(`Just discovered these amazing ${productName} sneakers! 👟✨ #SneakerVault #Sneakers #Fashion`);
    }
  };

  const generateShareUrl = (platformId: string) => {
    const baseUrl = window.location.origin;
    const productUrl = `${baseUrl}/products/${productId}`;
    const text = encodeURIComponent(`Check out these amazing ${productName} sneakers!`);

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(productUrl)}`,
      instagram: '', // Instagram doesn't support direct URL sharing
      tiktok: '', // TikTok doesn't support direct URL sharing
      youtube: '' // YouTube doesn't support direct URL sharing
    };

    return urls[platformId as keyof typeof urls] || '';
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Share & Earn Points</h3>
          <div className="text-sm text-gray-600">Earn up to 100 points!</div>
        </div>

        <p className="text-gray-600 mb-6">
          Share your favorite sneakers on social media and earn loyalty points for each post!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {socialPlatforms.map((platform) => (
            <motion.button
              key={platform.id}
              onClick={() => openShareModal(platform.id)}
              disabled={isSharing === platform.id}
              className={`${platform.color} text-white rounded-lg p-4 hover:opacity-90 transition-all duration-200 disabled:opacity-50`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{platform.icon}</div>
                <div className="font-semibold mb-1">{platform.name}</div>
                <div className="text-sm opacity-90 mb-2">{platform.description}</div>
                <div className="text-xs font-bold bg-white/20 rounded-full px-2 py-1">
                  +{platform.points} points
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Quick Share Tips */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use hashtags like #SneakerVault #Sneakers for maximum visibility</li>
            <li>• Tag friends to spread the love and earn bonus points</li>
            <li>• Video reviews on TikTok and YouTube earn the most points</li>
            <li>• Share authentic experiences for better engagement</li>
          </ul>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showModal && selectedPlatform && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const platform = socialPlatforms.find(p => p.id === selectedPlatform)!;

                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{platform.icon}</span>
                        <h3 className="text-lg font-semibold">Share on {platform.name}</h3>
                      </div>
                      <button
                        onClick={() => setShowModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Share Type Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Share Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setShareType('share')}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            shareType === 'share'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Share Post
                        </button>
                        <button
                          onClick={() => setShareType('review')}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            shareType === 'review'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Review
                        </button>
                        <button
                          onClick={() => setShareType('photo_upload')}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            shareType === 'photo_upload'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Photo/Video
                        </button>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content Preview
                      </label>
                      <textarea
                        value={shareContent}
                        onChange={(e) => setShareContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Write your post content..."
                      />
                    </div>

                    {/* Product Preview */}
                    {productName && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">👟</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{productName}</div>
                            <div className="text-sm text-gray-600">SneakerVault</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Points Reward */}
                    <div className="bg-green-50 rounded-lg p-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-green-800 font-medium">Points Reward</span>
                        <span className="text-green-600 font-bold">+{platform.points} points</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>

                      {platform.id === 'instagram' || platform.id === 'tiktok' || platform.id === 'youtube' ? (
                        <button
                          onClick={() => handleShare(platform.id)}
                          disabled={isSharing === platform.id}
                          className={`flex-1 px-4 py-2 ${platform.color} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50`}
                        >
                          {isSharing === platform.id ? 'Confirming...' : 'Confirm Share'}
                        </button>
                      ) : (
                        <a
                          href={generateShareUrl(platform.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleShare(platform.id)}
                          className={`flex-1 px-4 py-2 ${platform.color} text-white rounded-lg hover:opacity-90 transition-opacity text-center inline-block`}
                        >
                          Share Now
                        </a>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}