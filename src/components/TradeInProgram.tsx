'use client';

import React, { useState } from 'react';
import { useEco } from '@/contexts/EcoContext';
import { TradeInEstimate } from '@/types/eco';

interface TradeInProgramProps {
  onTradeInSubmitted?: (estimate: TradeInEstimate) => void;
}

const brandOptions = [
  { id: 'nike', name: 'Nike', multiplier: 0.8 },
  { id: 'adidas', name: 'Adidas', multiplier: 0.75 },
  { id: 'jordan', name: 'Air Jordan', multiplier: 0.9 },
  { id: 'new-balance', name: 'New Balance', multiplier: 0.7 },
  { id: 'converse', name: 'Converse', multiplier: 0.6 },
  { id: 'vans', name: 'Vans', multiplier: 0.65 },
  { id: 'other', name: 'Other', multiplier: 0.5 }
];

const conditionOptions = [
  {
    id: 'mint',
    name: 'Mint',
    description: 'Like new, no visible wear, original box',
    example: 'Worn 1-2 times, pristine condition',
    multiplier: 0.9
  },
  {
    id: 'excellent',
    name: 'Excellent',
    description: 'Minimal wear, very good condition',
    example: 'Light use, minor creasing',
    multiplier: 0.8
  },
  {
    id: 'good',
    name: 'Good',
    description: 'Some wear but well maintained',
    example: 'Regular use, visible wear but structurally sound',
    multiplier: 0.65
  },
  {
    id: 'fair',
    name: 'Fair',
    description: 'Noticeable wear but functional',
    example: 'Heavy use, significant wear but no major damage',
    multiplier: 0.5
  },
  {
    id: 'poor',
    name: 'Poor',
    description: 'Heavy wear, may need repair',
    example: 'Sole separation, significant damage',
    multiplier: 0.3
  }
];

export default function TradeInProgram({ onTradeInSubmitted }: TradeInProgramProps) {
  const { getTradeInEstimate } = useEco();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    size: '',
    condition: '',
    purchasePrice: '',
    purchaseYear: '',
    hasBox: false,
    hasReceipt: false
  });
  const [estimate, setEstimate] = useState<TradeInEstimate | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<'estimate' | 'photos' | 'shipping' | 'complete'>('estimate');

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateEstimate = async () => {
    if (!formData.brand || !formData.condition) return;

    setIsCalculating(true);
    try {
      const result = await getTradeInEstimate('dummy-product-id', formData.condition);

      // Apply brand and condition multipliers
      const brandMultiplier = brandOptions.find(b => b.id === formData.brand)?.multiplier || 0.5;
      const conditionMultiplier = conditionOptions.find(c => c.id === formData.condition)?.multiplier || 0.5;
      const ageMultiplier = formData.purchaseYear ?
        Math.max(0.3, 1 - (currentYear - parseInt(formData.purchaseYear)) * 0.1) : 0.7;

      const basePrice = formData.purchasePrice ? parseInt(formData.purchasePrice) : 150;
      const adjustedValue = basePrice * brandMultiplier * conditionMultiplier * ageMultiplier;

      // Additional bonuses
      let bonus = 0;
      if (formData.hasBox) bonus += 10;
      if (formData.hasReceipt) bonus += 5;

      const finalEstimate = {
        ...result,
        originalPrice: basePrice,
        estimatedValue: Math.max(10, adjustedValue + bonus),
        factors: {
          brand: brandMultiplier,
          age: ageMultiplier,
          condition: conditionMultiplier,
          marketDemand: 0.8
        }
      };

      setEstimate(finalEstimate);
      setStep(2);
    } catch (error) {
      console.error('Error calculating estimate:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const submitTradeIn = () => {
    if (estimate) {
      onTradeInSubmitted?.(estimate);
      setSubmissionStep('photos');
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      brand: '',
      model: '',
      size: '',
      condition: '',
      purchasePrice: '',
      purchaseYear: '',
      hasBox: false,
      hasReceipt: false
    });
    setEstimate(null);
    setSubmissionStep('estimate');
  };

  if (step === 1) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Trade-In Your Sneakers
          </h2>
          <p className="text-gray-600">
            Get an instant estimate for your used sneakers and give them a second life
          </p>
        </div>

        <div className="space-y-6">
          {/* Brand Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand *
            </label>
            <select
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select a brand</option>
              {brandOptions.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model and Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="e.g., Air Max 90"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size (EU)
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
                placeholder="e.g., 42"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Condition *
            </label>
            <div className="space-y-3">
              {conditionOptions.map(condition => (
                <div
                  key={condition.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.condition === condition.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('condition', condition.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-900">{condition.name}</h4>
                    <span className="text-sm text-gray-500">
                      {Math.round(condition.multiplier * 100)}% of value
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{condition.description}</p>
                  <p className="text-xs text-gray-500">{condition.example}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Purchase Price (€)
              </label>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                placeholder="150"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Year
              </label>
              <select
                value={formData.purchaseYear}
                onChange={(e) => handleInputChange('purchaseYear', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select year</option>
                {yearOptions.map(year => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bonus Items */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Bonus Items (increases value)</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hasBox}
                  onChange={(e) => handleInputChange('hasBox', e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Original box (+€10)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hasReceipt}
                  onChange={(e) => handleInputChange('hasReceipt', e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Original receipt (+€5)
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={calculateEstimate}
            disabled={!formData.brand || !formData.condition || isCalculating}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isCalculating ? 'Calculating...' : 'Get Trade-In Estimate'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 2 && estimate) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💰</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your Trade-In Estimate
          </h2>
          <div className="text-4xl font-bold text-green-600 mb-2">
            €{estimate.estimatedValue.toFixed(0)}
          </div>
          <p className="text-gray-600">
            Based on current market conditions
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Valuation Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Base value ({formData.brand})</span>
              <span>€{(estimate.originalPrice * estimate.factors.brand).toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Condition adjustment</span>
              <span>×{estimate.factors.condition.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Age factor</span>
              <span>×{estimate.factors.age.toFixed(1)}</span>
            </div>
            {formData.hasBox && (
              <div className="flex justify-between text-green-600">
                <span>Original box bonus</span>
                <span>+€10</span>
              </div>
            )}
            {formData.hasReceipt && (
              <div className="flex justify-between text-green-600">
                <span>Receipt bonus</span>
                <span>+€5</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Final estimate</span>
              <span>€{estimate.estimatedValue.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Submit photos for verification</li>
              <li>• Get free shipping label</li>
              <li>• Receive payment within 2-3 days of verification</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={resetForm}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={submitTradeIn}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Proceed with Trade-In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}