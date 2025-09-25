'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { RecyclingProgram } from '@/types/sustainability';

interface RecyclingProgramsProps {
  programs?: RecyclingProgram[];
  onJoinProgram?: (programId: string) => void;
  className?: string;
}

export function RecyclingPrograms({
  programs = [],
  onJoinProgram,
  className = ''
}: RecyclingProgramsProps) {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [mockPrograms] = useState<RecyclingProgram[]>([
    {
      id: '1',
      brand: 'Nike',
      program_name: 'Nike Grind',
      description: 'Transform your old Nike shoes into new products and playground surfaces',
      accepted_products: ['Athletic shoes', 'Running shoes', 'Basketball shoes'],
      incentives: {
        discount_percentage: 20,
        store_credit_amount: 15,
        tree_planting: 1
      },
      process_description: [
        'Drop off shoes at any Nike store',
        'Shoes are ground into Nike Grind material',
        'Material is used for new products and surfaces',
        'Receive rewards and environmental impact report'
      ],
      environmental_impact: 'Each pair recycled saves 2.5kg of CO₂ and prevents 1.2kg of waste'
    },
    {
      id: '2',
      brand: 'Adidas',
      program_name: 'FUTURECRAFT.LOOP',
      description: 'Circular shoe program - return your shoes to be remade into new ones',
      accepted_products: ['Adidas shoes', 'Ultraboost series', 'Stan Smith'],
      incentives: {
        discount_percentage: 25,
        store_credit_amount: 20,
        tree_planting: 2
      },
      process_description: [
        'Register shoes in the app',
        'Send shoes via prepaid shipping',
        'Shoes are broken down and remade',
        'Receive new shoes at 25% discount'
      ],
      environmental_impact: 'Closed-loop recycling saves 3.2kg CO₂ and 850L of water per pair'
    },
    {
      id: '3',
      brand: 'Allbirds',
      program_name: 'ReRun',
      description: 'Give your Allbirds a second life through our sustainable recycling program',
      accepted_products: ['Tree Runners', 'Wool Runners', 'Tree Breezers'],
      incentives: {
        discount_percentage: 15,
        store_credit_amount: 10,
        tree_planting: 3
      },
      process_description: [
        'Schedule pickup from your home',
        'Shoes are composted or recycled',
        'Materials feed back into production',
        'Track your environmental impact'
      ],
      environmental_impact: 'Natural materials composted, saving 1.8kg CO₂ per pair'
    }
  ]);

  const displayPrograms = programs.length > 0 ? programs : mockPrograms;

  const handleJoinProgram = (programId: string) => {
    setSelectedProgram(programId);
    onJoinProgram?.(programId);
  };

  const getBrandColor = (brand: string) => {
    const colors: Record<string, string> = {
      'Nike': '#FF6600',
      'Adidas': '#000000',
      'Allbirds': '#78C2AD'
    };
    return colors[brand] || '#4F46E5';
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          ♻️ Recycling Programs
        </h3>
        <p className="text-gray-600 mt-2">
          Give your old sneakers a new life and earn rewards for sustainable choices
        </p>
      </div>

      <div className="space-y-4">
        {displayPrograms.map((program, index) => (
          <motion.div
            key={program.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: getBrandColor(program.brand) }}
                >
                  {program.brand.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{program.program_name}</h4>
                  <p className="text-sm text-gray-600">{program.brand}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {program.incentives.discount_percentage && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    {program.incentives.discount_percentage}% discount
                  </span>
                )}
                {program.incentives.tree_planting && (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                    +{program.incentives.tree_planting} trees
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-700 mb-4">{program.description}</p>

            {/* Accepted Products */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Accepted Products:</p>
              <div className="flex flex-wrap gap-2">
                {program.accepted_products.map((product, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                  >
                    {product}
                  </span>
                ))}
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800">
                <strong>Environmental Impact:</strong> {program.environmental_impact}
              </p>
            </div>

            {/* Process Steps (collapsible) */}
            <div className="mb-4">
              <details className="group/details">
                <summary className="cursor-pointer text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  Process Overview
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-open/details:rotate-90" />
                </summary>
                <ol className="text-sm text-gray-600 space-y-1 ml-4">
                  {program.process_description.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">{idx + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </details>
            </div>

            {/* Rewards Summary */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {program.incentives.store_credit_amount && (
                  <div className="flex items-center gap-1">
                    <span className="text-blue-600">💰</span>
                    ${program.incentives.store_credit_amount} credit
                  </div>
                )}
                {program.incentives.discount_percentage && (
                  <div className="flex items-center gap-1">
                    <span className="text-purple-600">🎟️</span>
                    {program.incentives.discount_percentage}% off next purchase
                  </div>
                )}
                {program.incentives.tree_planting && (
                  <div className="flex items-center gap-1">
                    <span className="text-green-600">🌳</span>
                    {program.incentives.tree_planting} trees planted
                  </div>
                )}
              </div>

              <button
                onClick={() => handleJoinProgram(program.id)}
                disabled={selectedProgram === program.id}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {selectedProgram === program.id ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Joined
                  </>
                ) : (
                  <>
                    Join Program
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Ready to Recycle?</h4>
        <p className="text-sm text-blue-800 mb-3">
          Start your sustainability journey today. Each pair you recycle makes a real environmental impact.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            Find Nearby Drop-off Location
          </button>
          <button className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors">
            Schedule Pickup
          </button>
        </div>
      </div>
    </div>
  );
}