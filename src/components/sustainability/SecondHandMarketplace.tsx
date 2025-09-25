'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StarIcon,
  PhotoIcon,
  CheckBadgeIcon,
  ClockIcon,
  ArrowRightIcon,
  FunnelIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { SecondHandListing } from '@/types/sustainability';
import { CreateListingForm } from './CreateListingForm';

interface SecondHandMarketplaceProps {
  listings?: SecondHandListing[];
  onPurchase?: (listingId: string) => void;
  showCreateListing?: boolean;
  className?: string;
}

export function SecondHandMarketplace({
  listings = [],
  onPurchase,
  showCreateListing = true,
  className = ''
}: SecondHandMarketplaceProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price' | 'condition' | 'sustainability'>('sustainability');
  const [favoriteListings, setFavoriteListings] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateListing = (listingData: any) => {
    console.log('Creating new listing:', listingData);
    // Handle new listing submission
    setShowCreateForm(false);
  };

  // Mock listings for demonstration
  const [mockListings] = useState<SecondHandListing[]>([
    {
      id: '1',
      original_product_id: '1',
      seller_id: 'user1',
      condition: 'excellent',
      condition_assessment: {
        overall_score: 85,
        upper_condition: 90,
        sole_condition: 80,
        interior_condition: 85,
        box_included: true,
        original_accessories: true
      },
      price: 89.99,
      original_price: 120.00,
      sustainability_impact_saved: {
        carbon_kg: 12.4,
        water_liters: 450,
        waste_prevented_kg: 0.8
      },
      verification_status: 'verified',
      images: ['/api/placeholder/400/400', '/api/placeholder/400/400'],
      size: '9.5',
      purchase_date: '2023-08-15'
    },
    {
      id: '2',
      original_product_id: '2',
      seller_id: 'user2',
      condition: 'good',
      condition_assessment: {
        overall_score: 75,
        upper_condition: 80,
        sole_condition: 70,
        interior_condition: 75,
        box_included: false,
        original_accessories: false
      },
      price: 65.99,
      original_price: 95.00,
      sustainability_impact_saved: {
        carbon_kg: 11.2,
        water_liters: 380,
        waste_prevented_kg: 0.7
      },
      verification_status: 'verified',
      images: ['/api/placeholder/400/400'],
      size: '10',
      purchase_date: '2023-06-20'
    },
    {
      id: '3',
      original_product_id: '3',
      seller_id: 'user3',
      condition: 'like_new',
      condition_assessment: {
        overall_score: 95,
        upper_condition: 95,
        sole_condition: 95,
        interior_condition: 95,
        box_included: true,
        original_accessories: true
      },
      price: 135.99,
      original_price: 160.00,
      sustainability_impact_saved: {
        carbon_kg: 14.1,
        water_liters: 520,
        waste_prevented_kg: 0.9
      },
      verification_status: 'verified',
      images: ['/api/placeholder/400/400', '/api/placeholder/400/400', '/api/placeholder/400/400'],
      size: '8.5'
    }
  ]);

  const displayListings = listings.length > 0 ? listings : mockListings;

  const getConditionColor = (condition: string) => {
    const colors = {
      like_new: '#10b981', // green
      excellent: '#059669', // darker green
      good: '#f59e0b', // yellow
      fair: '#ef4444', // red
      poor: '#6b7280' // gray
    };
    return colors[condition as keyof typeof colors] || '#6b7280';
  };

  const getConditionLabel = (condition: string) => {
    const labels = {
      like_new: 'Like New',
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor'
    };
    return labels[condition as keyof typeof labels] || condition;
  };

  const toggleFavorite = (listingId: string) => {
    const newFavorites = new Set(favoriteListings);
    if (newFavorites.has(listingId)) {
      newFavorites.delete(listingId);
    } else {
      newFavorites.add(listingId);
    }
    setFavoriteListings(newFavorites);
  };

  const filteredListings = displayListings.filter(listing => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'like_new') return listing.condition === 'like_new';
    if (selectedFilter === 'box_included') return listing.condition_assessment.box_included;
    if (selectedFilter === 'under_100') return listing.price < 100;
    return true;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'condition') return b.condition_assessment.overall_score - a.condition_assessment.overall_score;
    if (sortBy === 'sustainability') return b.sustainability_impact_saved.carbon_kg - a.sustainability_impact_saved.carbon_kg;
    return 0;
  });

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              👟 Second-Hand Marketplace
            </h3>
            <p className="text-gray-600 mt-1">
              Find pre-loved sneakers and give them a second life
            </p>
          </div>

          {showCreateListing && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              List Your Sneakers
            </button>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Items</option>
              <option value="like_new">Like New</option>
              <option value="box_included">With Box</option>
              <option value="under_100">Under $100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'price' | 'condition' | 'sustainability')}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="sustainability">Environmental Impact</option>
              <option value="price">Price (Low to High)</option>
              <option value="condition">Condition</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {sortedListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-100">
                  {listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt="Sneaker"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}

                  {/* Verification Badge */}
                  {listing.verification_status === 'verified' && (
                    <div className="absolute top-2 left-2 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckBadgeIcon className="h-3 w-3" />
                      Verified
                    </div>
                  )}

                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(listing.id)}
                    className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-all duration-200"
                  >
                    {favoriteListings.has(listing.id) ? (
                      <HeartSolidIcon className="h-4 w-4 text-red-500" />
                    ) : (
                      <HeartIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  {/* Image Count */}
                  {listing.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                      +{listing.images.length - 1} photos
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Condition and Size */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getConditionColor(listing.condition) }}
                      >
                        {getConditionLabel(listing.condition)}
                      </span>
                      <span className="text-sm text-gray-600">Size {listing.size}</span>
                    </div>

                    {/* Condition Score */}
                    <div className="flex items-center gap-1">
                      <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium">{listing.condition_assessment.overall_score}/100</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">${listing.price}</span>
                      <span className="text-sm text-gray-500 line-through">${listing.original_price}</span>
                      <span className="text-sm text-green-600 font-medium">
                        {Math.round(((listing.original_price - listing.price) / listing.original_price) * 100)}% off
                      </span>
                    </div>
                  </div>

                  {/* Sustainability Impact */}
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <div className="text-xs font-medium text-green-900 mb-2">Environmental Impact Saved:</div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-green-700">
                      <div className="text-center">
                        <div className="font-bold">{listing.sustainability_impact_saved.carbon_kg.toFixed(1)}kg</div>
                        <div>CO₂</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{listing.sustainability_impact_saved.water_liters}L</div>
                        <div>Water</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{listing.sustainability_impact_saved.waste_prevented_kg.toFixed(1)}kg</div>
                        <div>Waste</div>
                      </div>
                    </div>
                  </div>

                  {/* Condition Details */}
                  <div className="mb-4 text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Upper:</span>
                      <span>{listing.condition_assessment.upper_condition}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sole:</span>
                      <span>{listing.condition_assessment.sole_condition}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span>Box:</span>
                        <span className={listing.condition_assessment.box_included ? 'text-green-600' : 'text-red-600'}>
                          {listing.condition_assessment.box_included ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Accessories:</span>
                        <span className={listing.condition_assessment.original_accessories ? 'text-green-600' : 'text-red-600'}>
                          {listing.condition_assessment.original_accessories ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <button
                    onClick={() => onPurchase?.(listing.id)}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    Buy Now
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {sortedListings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👟</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>

      {/* Benefits Section */}
      <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3 text-center">Why Choose Second-Hand?</h4>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-2">🌍</div>
            <div className="text-sm font-medium text-gray-900">Reduce Environmental Impact</div>
            <div className="text-xs text-gray-600">Save CO₂ and water resources</div>
          </div>
          <div>
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm font-medium text-gray-900">Save Money</div>
            <div className="text-xs text-gray-600">Get quality sneakers at lower prices</div>
          </div>
          <div>
            <div className="text-2xl mb-2">✨</div>
            <div className="text-sm font-medium text-gray-900">Verified Quality</div>
            <div className="text-xs text-gray-600">All items professionally assessed</div>
          </div>
        </div>
      </div>

      {/* Create Listing Form Modal */}
      <CreateListingForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateListing}
      />
    </div>
  );
}