'use client';

import React, { useState, useEffect } from 'react';
import { useEco } from '@/contexts/EcoContext';
import { EcoProduct, ProductCondition } from '@/types/eco';
import Image from 'next/image';

interface SecondLifeProductsProps {
  category?: string;
  limit?: number;
}

// Mock data for second life products
const mockSecondLifeProducts: EcoProduct[] = [
  {
    id: 'sl-1',
    originalId: 'nike-air-max-90',
    condition: {
      id: 'excellent',
      name: 'Excellent',
      description: 'Minimal wear, great condition',
      priceReduction: 20,
      qualityScore: 9
    },
    ecoMetrics: {
      carbonFootprint: 8.2,
      sustainabilityScore: 85,
      recycledMaterials: 30,
      waterUsage: 45,
      energyConsumption: 12
    },
    ecoLabels: [
      {
        id: 'second-life',
        name: 'Second Life',
        description: 'Professionally refurbished',
        icon: '♻️',
        color: 'green'
      }
    ],
    reconditioning: {
      processDate: new Date('2024-01-15'),
      technician: 'Marie Dubois',
      qualityCheck: [
        { aspect: 'Sole condition', score: 9, notes: 'Excellent grip, minimal wear' },
        { aspect: 'Upper material', score: 8, notes: 'Minor scuff marks cleaned' },
        { aspect: 'Laces', score: 10, notes: 'Replaced with new laces' }
      ],
      warranty: 6
    },
    isSecondLife: true
  },
  {
    id: 'sl-2',
    originalId: 'adidas-ultraboost-22',
    condition: {
      id: 'good',
      name: 'Good',
      description: 'Some wear but well maintained',
      priceReduction: 35,
      qualityScore: 7
    },
    ecoMetrics: {
      carbonFootprint: 7.8,
      sustainabilityScore: 78,
      recycledMaterials: 45,
      waterUsage: 38,
      energyConsumption: 10
    },
    ecoLabels: [
      {
        id: 'second-life',
        name: 'Second Life',
        description: 'Professionally refurbished',
        icon: '♻️',
        color: 'green'
      },
      {
        id: 'eco-clean',
        name: 'Eco Cleaning',
        description: 'Cleaned with eco-friendly products',
        icon: '🌿',
        color: 'green'
      }
    ],
    reconditioning: {
      processDate: new Date('2024-01-20'),
      technician: 'Pierre Martin',
      qualityCheck: [
        { aspect: 'Boost technology', score: 8, notes: 'Responsive cushioning maintained' },
        { aspect: 'Primeknit upper', score: 7, notes: 'Some pilling, but structure intact' },
        { aspect: 'Continental sole', score: 8, notes: 'Good tread remaining' }
      ],
      warranty: 3
    },
    isSecondLife: true
  }
];

export default function SecondLifeProducts({ category, limit = 10 }: SecondLifeProductsProps) {
  const [products, setProducts] = useState<EcoProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('price-low');

  useEffect(() => {
    // Simulate API call
    const fetchProducts = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProducts(mockSecondLifeProducts.slice(0, limit));
      setLoading(false);
    };

    fetchProducts();
  }, [category, limit]);

  const filteredProducts = products.filter(product => {
    if (selectedConditions.length === 0) return true;
    return selectedConditions.includes(product.condition.id);
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.condition.priceReduction - b.condition.priceReduction;
      case 'price-high':
        return b.condition.priceReduction - a.condition.priceReduction;
      case 'condition':
        return b.condition.qualityScore - a.condition.qualityScore;
      case 'sustainability':
        return b.ecoMetrics.sustainabilityScore - a.ecoMetrics.sustainabilityScore;
      default:
        return 0;
    }
  });

  const conditionOptions = [
    { id: 'mint', name: 'Mint', count: 12 },
    { id: 'excellent', name: 'Excellent', count: 24 },
    { id: 'good', name: 'Good', count: 18 },
    { id: 'fair', name: 'Fair', count: 8 }
  ];

  const handleConditionFilter = (conditionId: string) => {
    setSelectedConditions(prev =>
      prev.includes(conditionId)
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Seconde Vie Collection
          </h2>
          <p className="text-gray-600">
            Professionally refurbished sneakers with reduced environmental impact
          </p>
        </div>
        <div className="flex items-center space-x-2 text-green-600">
          <span className="text-2xl">♻️</span>
          <span className="text-sm font-medium">Eco-Friendly</span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Condition:</span>
          {conditionOptions.map(condition => (
            <button
              key={condition.id}
              onClick={() => handleConditionFilter(condition.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedConditions.includes(condition.id)
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {condition.name} ({condition.count})
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="condition">Best Condition</option>
            <option value="sustainability">Sustainability Score</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProducts.map(product => (
          <SecondLifeProductCard key={product.id} product={product} />
        ))}
      </div>

      {sortedProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👟</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters to see more options
          </p>
        </div>
      )}
    </div>
  );
}

function SecondLifeProductCard({ product }: { product: EcoProduct }) {
  const originalPrice = 180; // This would come from the original product data
  const discountedPrice = originalPrice * (1 - product.condition.priceReduction / 100);
  const savings = originalPrice - discountedPrice;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="relative mb-4">
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-4xl">👟</span>
        </div>
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {product.ecoLabels.map(label => (
            <span
              key={label.id}
              className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
            >
              {label.icon} {label.name}
            </span>
          ))}
        </div>
        <div className="absolute top-2 right-2">
          <div className="bg-white rounded-full px-2 py-1 shadow-sm">
            <span className="text-xs font-medium text-gray-700">
              {product.condition.name}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-medium text-gray-900 mb-1">
            Air Max 90 - Second Life
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              €{discountedPrice.toFixed(0)}
            </span>
            <span className="text-sm text-gray-500 line-through">
              €{originalPrice}
            </span>
            <span className="text-sm text-green-600 font-medium">
              Save €{savings.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Sustainability Score</span>
            <span className="font-medium text-green-600">
              {product.ecoMetrics.sustainabilityScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{
                width: `${product.ecoMetrics.sustainabilityScore}%`
              }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">Carbon:</span> {product.ecoMetrics.carbonFootprint}kg
          </div>
          <div>
            <span className="font-medium">Warranty:</span> {product.reconditioning.warranty}mo
          </div>
        </div>

        <div className="pt-3 border-t">
          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}