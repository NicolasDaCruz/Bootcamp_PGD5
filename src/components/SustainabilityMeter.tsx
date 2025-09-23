'use client';

import React, { useState, useEffect } from 'react';
import { EcoMetrics, EcoLabel } from '@/types/eco';

interface SustainabilityMeterProps {
  productId?: string;
  ecoMetrics?: EcoMetrics;
  ecoLabels?: EcoLabel[];
  showDetailed?: boolean;
}

const defaultMetrics: EcoMetrics = {
  carbonFootprint: 12.5,
  sustainabilityScore: 75,
  recycledMaterials: 35,
  waterUsage: 60,
  energyConsumption: 18
};

const sustainabilityFactors = [
  {
    id: 'materials',
    name: 'Sustainable Materials',
    weight: 0.3,
    description: 'Use of recycled, organic, or bio-based materials'
  },
  {
    id: 'manufacturing',
    name: 'Clean Manufacturing',
    weight: 0.25,
    description: 'Energy efficiency and waste reduction in production'
  },
  {
    id: 'transportation',
    name: 'Transportation',
    weight: 0.2,
    description: 'Carbon footprint from shipping and logistics'
  },
  {
    id: 'packaging',
    name: 'Eco Packaging',
    weight: 0.15,
    description: 'Recyclable and minimal packaging materials'
  },
  {
    id: 'durability',
    name: 'Product Durability',
    weight: 0.1,
    description: 'Expected lifespan and repairability'
  }
];

const certifications = [
  {
    id: 'cradle-to-cradle',
    name: 'Cradle to Cradle',
    icon: '🔄',
    description: 'Products designed for circular economy',
    color: 'green'
  },
  {
    id: 'gots',
    name: 'GOTS Certified',
    icon: '🌿',
    description: 'Global Organic Textile Standard',
    color: 'green'
  },
  {
    id: 'bluesign',
    name: 'bluesign®',
    icon: '💧',
    description: 'Chemical safety and environmental protection',
    color: 'blue'
  },
  {
    id: 'fair-trade',
    name: 'Fair Trade',
    icon: '🤝',
    description: 'Ethical labor practices and fair wages',
    color: 'orange'
  },
  {
    id: 'carbon-neutral',
    name: 'Carbon Neutral',
    icon: '🌍',
    description: 'Net zero carbon emissions',
    color: 'green'
  }
];

export default function SustainabilityMeter({
  productId,
  ecoMetrics = defaultMetrics,
  ecoLabels = [],
  showDetailed = false
}: SustainabilityMeterProps) {
  const [detailsVisible, setDetailsVisible] = useState(showDetailed);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate score counter
    const timer = setTimeout(() => {
      const increment = ecoMetrics.sustainabilityScore / 50;
      const animate = () => {
        setAnimatedScore(prev => {
          const next = prev + increment;
          if (next >= ecoMetrics.sustainabilityScore) {
            return ecoMetrics.sustainabilityScore;
          }
          requestAnimationFrame(animate);
          return next;
        });
      };
      animate();
    }, 200);

    return () => clearTimeout(timer);
  }, [ecoMetrics.sustainabilityScore]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    if (score >= 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Very Poor';
  };

  // Calculate individual factor scores (simplified)
  const factorScores = sustainabilityFactors.map(factor => {
    let score = 0;
    switch (factor.id) {
      case 'materials':
        score = ecoMetrics.recycledMaterials * 1.2;
        break;
      case 'manufacturing':
        score = Math.max(0, 100 - ecoMetrics.energyConsumption * 3);
        break;
      case 'transportation':
        score = Math.max(0, 100 - ecoMetrics.carbonFootprint * 4);
        break;
      case 'packaging':
        score = 75; // Default good score
        break;
      case 'durability':
        score = 85; // Default good score
        break;
    }
    return {
      ...factor,
      score: Math.min(100, Math.max(0, score))
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Sustainability Rating
        </h3>
        {!showDetailed && (
          <button
            onClick={() => setDetailsVisible(!detailsVisible)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {detailsVisible ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {/* Main Score Display */}
      <div className="text-center mb-6">
        <div className="relative w-32 h-32 mx-auto mb-4">
          {/* Background Circle */}
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            {/* Progress Circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={339.29} // 2 * π * 54
              strokeDashoffset={339.29 - (339.29 * animatedScore) / 100}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className={`stop-color-green-500`} />
                <stop offset="100%" className={`stop-color-green-600`} />
              </linearGradient>
            </defs>
          </svg>

          {/* Score Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(animatedScore)}`}>
                {Math.round(animatedScore)}
              </div>
              <div className="text-xs text-gray-600">out of 100</div>
            </div>
          </div>
        </div>

        <div className={`text-lg font-semibold ${getScoreColor(ecoMetrics.sustainabilityScore)} mb-2`}>
          {getScoreLabel(ecoMetrics.sustainabilityScore)}
        </div>
        <p className="text-sm text-gray-600">
          This product meets high sustainability standards
        </p>
      </div>

      {/* Eco Labels */}
      {ecoLabels.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Certifications</h4>
          <div className="flex flex-wrap gap-2">
            {ecoLabels.map(label => (
              <div
                key={label.id}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  label.color === 'green'
                    ? 'bg-green-100 text-green-800'
                    : label.color === 'blue'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                <span className="mr-1">{label.icon}</span>
                {label.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      {detailsVisible && (
        <div className="space-y-4">
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Sustainability Breakdown
            </h4>

            <div className="space-y-3">
              {factorScores.map(factor => (
                <div key={factor.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{factor.name}</span>
                    <span className="text-sm font-medium">
                      {Math.round(factor.score)}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(factor.score)}`}
                      style={{ width: `${factor.score}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Impact */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Environmental Impact
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  {ecoMetrics.carbonFootprint}kg
                </div>
                <div className="text-gray-600">CO₂ Footprint</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  {ecoMetrics.waterUsage}L
                </div>
                <div className="text-gray-600">Water Usage</div>
              </div>
            </div>
          </div>

          {/* Improvement Suggestions */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              How to Improve Impact
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Choose carbon-neutral shipping options
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Opt for minimal or eco-friendly packaging
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Consider trade-in program for old sneakers
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Offset carbon emissions with verified programs
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}