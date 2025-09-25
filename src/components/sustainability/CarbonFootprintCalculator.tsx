'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CarbonFootprint } from '@/types/sustainability';

interface CarbonFootprintCalculatorProps {
  productId?: string;
  initialFootprint?: CarbonFootprint;
  onCalculationComplete?: (footprint: CarbonFootprint) => void;
  showComparison?: boolean;
  className?: string;
}

export function CarbonFootprintCalculator({
  productId,
  initialFootprint,
  onCalculationComplete,
  showComparison = true,
  className = ''
}: CarbonFootprintCalculatorProps) {
  const [footprint, setFootprint] = useState<CarbonFootprint>(
    initialFootprint || {
      materials_extraction_kg: 0,
      manufacturing_kg: 0,
      transportation_kg: 0,
      packaging_kg: 0,
      end_of_life_kg: 0,
      total_kg: 0,
      offset_programs: []
    }
  );

  const [isCalculating, setIsCalculating] = useState(false);
  const [comparisonData, setComparisonData] = useState({
    industry_average: 15.2,
    best_in_class: 8.5,
    worst_in_class: 28.7
  });

  useEffect(() => {
    const total =
      footprint.materials_extraction_kg +
      footprint.manufacturing_kg +
      footprint.transportation_kg +
      footprint.packaging_kg +
      footprint.end_of_life_kg;

    setFootprint(prev => ({ ...prev, total_kg: total }));
  }, [
    footprint.materials_extraction_kg,
    footprint.manufacturing_kg,
    footprint.transportation_kg,
    footprint.packaging_kg,
    footprint.end_of_life_kg
  ]);

  const calculateFootprint = async () => {
    setIsCalculating(true);

    // Simulate API call for calculation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock calculation based on typical sneaker values
    const mockFootprint: CarbonFootprint = {
      materials_extraction_kg: 4.2,
      manufacturing_kg: 6.8,
      transportation_kg: 2.1,
      packaging_kg: 0.8,
      end_of_life_kg: 1.3,
      total_kg: 15.2,
      offset_programs: ['Forest Carbon Offset', 'Renewable Energy Credits']
    };

    setFootprint(mockFootprint);
    onCalculationComplete?.(mockFootprint);
    setIsCalculating(false);
  };

  const getImpactColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage <= 33) return '#10b981'; // green
    if (percentage <= 66) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getComparisonStatus = () => {
    if (footprint.total_kg <= comparisonData.best_in_class) return {
      status: 'excellent',
      color: '#10b981',
      text: 'Excellent - Below best in class'
    };
    if (footprint.total_kg <= comparisonData.industry_average) return {
      status: 'good',
      color: '#f59e0b',
      text: 'Good - Below industry average'
    };
    return {
      status: 'needs_improvement',
      color: '#ef4444',
      text: 'Needs improvement - Above average'
    };
  };

  const FootprintBar = ({
    label,
    value,
    max,
    icon,
    description
  }: {
    label: string;
    value: number;
    max: number;
    icon: string;
    description: string;
  }) => {
    const percentage = (value / max) * 100;
    const color = getImpactColor(value, max);

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
          <span className="text-sm font-bold" style={{ color }}>
            {value.toFixed(1)} kg CO₂
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
          <motion.div
            className="h-3 rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    );
  };

  const comparison = getComparisonStatus();

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            🌍 Carbon Footprint Calculator
          </h3>
          <p className="text-sm text-gray-600">Calculate and understand the environmental impact</p>
        </div>

        {!initialFootprint && (
          <button
            onClick={calculateFootprint}
            disabled={isCalculating}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
          >
            {isCalculating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Calculating...
              </div>
            ) : (
              'Calculate Footprint'
            )}
          </button>
        )}
      </div>

      {(footprint.total_kg > 0 || isCalculating) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Total Impact */}
          <div className="text-center mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {isCalculating ? '...' : footprint.total_kg.toFixed(1)} kg CO₂
            </div>
            <div className="text-sm text-gray-600 mb-2">Total Carbon Footprint</div>
            {showComparison && !isCalculating && (
              <div
                className="text-sm font-medium px-3 py-1 rounded-full inline-block"
                style={{
                  backgroundColor: `${comparison.color}15`,
                  color: comparison.color
                }}
              >
                {comparison.text}
              </div>
            )}
          </div>

          {!isCalculating && (
            <>
              {/* Breakdown */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Impact Breakdown</h4>
                <FootprintBar
                  label="Materials Extraction"
                  value={footprint.materials_extraction_kg}
                  max={10}
                  icon="⛏️"
                  description="Raw material sourcing and processing"
                />
                <FootprintBar
                  label="Manufacturing"
                  value={footprint.manufacturing_kg}
                  max={10}
                  icon="🏭"
                  description="Production and assembly processes"
                />
                <FootprintBar
                  label="Transportation"
                  value={footprint.transportation_kg}
                  max={5}
                  icon="🚛"
                  description="Shipping and distribution"
                />
                <FootprintBar
                  label="Packaging"
                  value={footprint.packaging_kg}
                  max={2}
                  icon="📦"
                  description="Packaging materials and disposal"
                />
                <FootprintBar
                  label="End of Life"
                  value={footprint.end_of_life_kg}
                  max={3}
                  icon="🗑️"
                  description="Disposal and recycling processes"
                />
              </div>

              {/* Offset Programs */}
              {footprint.offset_programs.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Carbon Offset Programs</h4>
                  <div className="space-y-2">
                    {footprint.offset_programs.map((program, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                        <span className="text-green-600">🌳</span>
                        {program}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparison Chart */}
              {showComparison && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Industry Comparison</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Best in Class</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-green-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(comparisonData.best_in_class / 30) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          {comparisonData.best_in_class} kg
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">This Product</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${(footprint.total_kg / 30) * 100}%`,
                              backgroundColor: comparison.color
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold" style={{ color: comparison.color }}>
                          {footprint.total_kg.toFixed(1)} kg
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Industry Average</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-yellow-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${(comparisonData.industry_average / 30) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-yellow-600">
                          {comparisonData.industry_average} kg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Improvement Suggestions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Sustainability Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Choose locally manufactured products to reduce transportation impact</li>
                  <li>• Look for products made with recycled materials</li>
                  <li>• Consider the product's durability and repairability</li>
                  <li>• Participate in recycling programs at end-of-life</li>
                </ul>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}