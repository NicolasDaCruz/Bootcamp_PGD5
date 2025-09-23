'use client';

import React, { useState, useEffect } from 'react';
import { useEco } from '@/contexts/EcoContext';
import { PackagingOption, ShippingOption } from '@/types/eco';

interface EcoFriendlyOptionsProps {
  onOptionsChange?: (options: {
    packaging: PackagingOption;
    shipping: ShippingOption;
    carbonOffset: boolean;
  }) => void;
  cartTotal?: number;
}

export default function EcoFriendlyOptions({
  onOptionsChange,
  cartTotal = 0
}: EcoFriendlyOptionsProps) {
  const { ecoFriendlyOptions, updateEcoOptions } = useEco();
  const [selectedPackaging, setSelectedPackaging] = useState<string>('standard');
  const [selectedShipping, setSelectedShipping] = useState<string>('standard');
  const [carbonOffset, setCarbonOffset] = useState(false);
  const [estimatedFootprint, setEstimatedFootprint] = useState(5.2); // kg CO2

  useEffect(() => {
    // Update parent component when options change
    const packagingOption = ecoFriendlyOptions.packaging.find(p => p.id === selectedPackaging);
    const shippingOption = ecoFriendlyOptions.shipping.find(s => s.id === selectedShipping);

    if (packagingOption && shippingOption && onOptionsChange) {
      onOptionsChange({
        packaging: packagingOption,
        shipping: shippingOption,
        carbonOffset
      });
    }

    // Update eco context
    updateEcoOptions({
      ...ecoFriendlyOptions,
      carbonOffset
    });
  }, [selectedPackaging, selectedShipping, carbonOffset]);

  const calculateTotalCost = () => {
    const packagingCost = ecoFriendlyOptions.packaging.find(p => p.id === selectedPackaging)?.additionalCost || 0;
    const shippingCost = ecoFriendlyOptions.shipping.find(s => s.id === selectedShipping)?.cost || 0;
    const offsetCost = carbonOffset ? estimatedFootprint * 0.02 : 0; // €0.02 per kg CO2

    return packagingCost + shippingCost + offsetCost;
  };

  const calculateEnvironmentalSavings = () => {
    const packagingScore = ecoFriendlyOptions.packaging.find(p => p.id === selectedPackaging)?.ecoScore || 3;
    const shippingFootprint = ecoFriendlyOptions.shipping.find(s => s.id === selectedShipping)?.carbonFootprint || 2.5;
    const totalFootprint = shippingFootprint + (carbonOffset ? 0 : estimatedFootprint);

    return {
      carbonSaved: Math.max(0, estimatedFootprint - totalFootprint),
      ecoScore: packagingScore,
      plasticReduction: selectedPackaging === 'eco-friendly' ? 85 : selectedPackaging === 'minimal' ? 95 : 0
    };
  };

  const savings = calculateEnvironmentalSavings();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Eco-Friendly Options
          </h3>
          <p className="text-sm text-gray-600">
            Make your order more sustainable
          </p>
        </div>
        <div className="text-green-600">
          <span className="text-2xl">🌱</span>
        </div>
      </div>

      {/* Packaging Options */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Packaging Options
        </h4>
        <div className="space-y-3">
          {ecoFriendlyOptions.packaging.map(option => (
            <div
              key={option.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPackaging === option.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPackaging(option.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedPackaging === option.id
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedPackaging === option.id && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">{option.name}</h5>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {option.additionalCost >= 0 ? '+' : ''}€{option.additionalCost.toFixed(2)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">Eco Score:</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${
                            i < option.ecoScore / 2 ? 'text-green-500' : 'text-gray-300'
                          }`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Materials: {option.materials.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Options */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Shipping Options
        </h4>
        <div className="space-y-3">
          {ecoFriendlyOptions.shipping.map(option => (
            <div
              key={option.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedShipping === option.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedShipping(option.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedShipping === option.id
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedShipping === option.id && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">{option.name}</h5>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <span>{option.deliveryTime}</span>
                      <span>•</span>
                      <span>{option.carrier}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-gray-500">Carbon:</span>
                      <span className={option.carbonFootprint === 0 ? 'text-green-600 font-medium' : 'text-gray-700'}>
                        {option.carbonFootprint === 0 ? 'Carbon Neutral' : `${option.carbonFootprint}kg CO₂`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {option.cost === 0 ? 'Free' : `€${option.cost.toFixed(2)}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carbon Offset */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Carbon Offset
        </h4>
        <div
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            carbonOffset
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setCarbonOffset(!carbonOffset)}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                carbonOffset
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300'
              }`}>
                {carbonOffset && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
              <div>
                <h5 className="font-medium text-gray-900">
                  Offset Carbon Emissions
                </h5>
                <p className="text-sm text-gray-600">
                  Support verified carbon removal projects
                </p>
                <div className="text-xs text-gray-500 mt-1">
                  Estimated {estimatedFootprint}kg CO₂ from manufacturing and shipping
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                +€{(estimatedFootprint * 0.02).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                €0.02 per kg CO₂
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Impact Summary */}
      <div className="bg-green-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-green-900 mb-3">
          Your Environmental Impact
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-green-700">
              {savings.carbonSaved.toFixed(1)}kg
            </div>
            <div className="text-green-600">CO₂ Saved</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-700">
              {savings.plasticReduction}%
            </div>
            <div className="text-green-600">Plastic Reduction</div>
          </div>
        </div>
        {savings.carbonSaved > 0 && (
          <div className="mt-3 text-xs text-green-700 text-center">
            Equivalent to planting {Math.round(savings.carbonSaved / 21.8)} tree(s) 🌳
          </div>
        )}
      </div>

      {/* Cost Summary */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-600">Eco options total:</span>
          <span className="font-medium">
            {calculateTotalCost() >= 0 ? '+' : ''}€{calculateTotalCost().toFixed(2)}
          </span>
        </div>
        {calculateTotalCost() < 0 && (
          <div className="text-xs text-green-600 text-right">
            You're saving money with eco-friendly choices! 💚
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 text-sm">💡</span>
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">Pro tip:</p>
            <p>
              Choosing minimal packaging and store pickup can reduce your order's carbon footprint by up to 40%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}