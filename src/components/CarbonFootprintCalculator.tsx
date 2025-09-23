'use client';

import React, { useState, useEffect } from 'react';
import { useEco } from '@/contexts/EcoContext';
import { CarbonFootprintData } from '@/types/eco';

interface CarbonFootprintCalculatorProps {
  productIds: string[];
  shippingDistance?: number;
  onFootprintCalculated?: (footprint: CarbonFootprintData) => void;
}

export default function CarbonFootprintCalculator({
  productIds,
  shippingDistance = 50,
  onFootprintCalculated
}: CarbonFootprintCalculatorProps) {
  const { calculateCarbonFootprint, offsetCarbon } = useEco();
  const [footprint, setFootprint] = useState<CarbonFootprintData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isOffsetting, setIsOffsetting] = useState(false);
  const [selectedOffset, setSelectedOffset] = useState<string>('');
  const [showOffsetOptions, setShowOffsetOptions] = useState(false);

  useEffect(() => {
    if (productIds.length > 0) {
      handleCalculate();
    }
  }, [productIds, shippingDistance]);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const result = await calculateCarbonFootprint(productIds, shippingDistance);
      setFootprint(result);
      onFootprintCalculated?.(result);
    } catch (error) {
      console.error('Error calculating carbon footprint:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleOffset = async () => {
    if (!footprint || !selectedOffset) return;

    setIsOffsetting(true);
    try {
      const success = await offsetCarbon(footprint.total, selectedOffset);
      if (success) {
        setShowOffsetOptions(false);
        // Show success message
      }
    } catch (error) {
      console.error('Error offsetting carbon:', error);
    } finally {
      setIsOffsetting(false);
    }
  };

  const getCarbonLevel = (amount: number) => {
    if (amount < 5) return { level: 'low', color: 'text-green-600', bg: 'bg-green-50' };
    if (amount < 15) return { level: 'medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'high', color: 'text-red-600', bg: 'bg-red-50' };
  };

  if (isCalculating) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <span className="text-gray-600">Calculating carbon footprint...</span>
        </div>
      </div>
    );
  }

  if (!footprint) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <button
          onClick={handleCalculate}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Calculate Carbon Footprint
        </button>
      </div>
    );
  }

  const carbonLevel = getCarbonLevel(footprint.total);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Carbon Footprint</h3>
        <div className={`px-3 py-1 rounded-full ${carbonLevel.bg}`}>
          <span className={`text-sm font-medium ${carbonLevel.color}`}>
            {carbonLevel.level.toUpperCase()}
          </span>
        </div>
      </div>

      <div className={`p-4 rounded-lg ${carbonLevel.bg} mb-4`}>
        <div className="text-center">
          <div className={`text-3xl font-bold ${carbonLevel.color} mb-1`}>
            {footprint.total.toFixed(1)} kg
          </div>
          <div className="text-sm text-gray-600">CO₂ equivalent</div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Manufacturing</span>
          <span className="text-sm font-medium">{footprint.manufacturing.toFixed(1)} kg</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Transportation</span>
          <span className="text-sm font-medium">{footprint.transportation.toFixed(1)} kg</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Packaging</span>
          <span className="text-sm font-medium">{footprint.packaging.toFixed(1)} kg</span>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-900">Carbon Offset</span>
          <button
            onClick={() => setShowOffsetOptions(!showOffsetOptions)}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            {showOffsetOptions ? 'Hide Options' : 'View Options'}
          </button>
        </div>

        {showOffsetOptions && (
          <div className="space-y-3">
            {footprint.offsetOptions.map((option) => (
              <div
                key={option.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedOffset === option.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedOffset(option.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-medium text-gray-900">{option.name}</h4>
                  <span className="text-sm font-medium text-gray-900">
                    €{(option.pricePerKg * footprint.total).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{option.description}</p>
                <p className="text-xs text-gray-500">Verified by {option.verificationBody}</p>
              </div>
            ))}

            {selectedOffset && (
              <button
                onClick={handleOffset}
                disabled={isOffsetting}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOffsetting ? 'Processing...' : 'Offset Carbon Emissions'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 text-sm">💡</span>
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">Reduce your impact:</p>
            <ul className="space-y-1">
              <li>• Choose eco-friendly packaging</li>
              <li>• Select carbon-neutral shipping</li>
              <li>• Consider store pickup</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}