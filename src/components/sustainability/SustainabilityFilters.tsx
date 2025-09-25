'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SustainabilityFilter } from '@/types/sustainability';

interface SustainabilityFiltersProps {
  filters: SustainabilityFilter;
  onFiltersChange: (filters: SustainabilityFilter) => void;
  availableCertifications: string[];
  className?: string;
}

export function SustainabilityFilters({
  filters,
  onFiltersChange,
  availableCertifications,
  className = ''
}: SustainabilityFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const updateFilter = (key: keyof SustainabilityFilter, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
    updateActiveFilters(newFilters);
  };

  const updateActiveFilters = (currentFilters: SustainabilityFilter) => {
    const active: string[] = [];

    if (currentFilters.min_environmental_score && currentFilters.min_environmental_score > 0) {
      active.push(`Environmental Score: ${currentFilters.min_environmental_score}+`);
    }
    if (currentFilters.max_carbon_footprint && currentFilters.max_carbon_footprint < 100) {
      active.push(`Max Carbon: ${currentFilters.max_carbon_footprint}kg`);
    }
    if (currentFilters.vegan_only) {
      active.push('Vegan Only');
    }
    if (currentFilters.recycled_materials_only) {
      active.push('Recycled Materials');
    }
    if (currentFilters.fair_trade_only) {
      active.push('Fair Trade');
    }
    if (currentFilters.local_manufacturing_only) {
      active.push('Local Manufacturing');
    }
    if (currentFilters.repair_service_required) {
      active.push('Repair Service');
    }
    if (currentFilters.required_certifications?.length) {
      currentFilters.required_certifications.forEach(cert => {
        active.push(`Certified: ${cert}`);
      });
    }

    setActiveFilters(active);
  };

  const clearAllFilters = () => {
    const emptyFilters: SustainabilityFilter = {};
    onFiltersChange(emptyFilters);
    setActiveFilters([]);
  };

  const removeFilter = (filterToRemove: string) => {
    const newFilters = { ...filters };

    if (filterToRemove.includes('Environmental Score')) {
      delete newFilters.min_environmental_score;
    } else if (filterToRemove.includes('Max Carbon')) {
      delete newFilters.max_carbon_footprint;
    } else if (filterToRemove === 'Vegan Only') {
      delete newFilters.vegan_only;
    } else if (filterToRemove === 'Recycled Materials') {
      delete newFilters.recycled_materials_only;
    } else if (filterToRemove === 'Fair Trade') {
      delete newFilters.fair_trade_only;
    } else if (filterToRemove === 'Local Manufacturing') {
      delete newFilters.local_manufacturing_only;
    } else if (filterToRemove === 'Repair Service') {
      delete newFilters.repair_service_required;
    } else if (filterToRemove.includes('Certified:')) {
      const certName = filterToRemove.replace('Certified: ', '');
      newFilters.required_certifications = newFilters.required_certifications?.filter(
        cert => cert !== certName
      );
      if (newFilters.required_certifications?.length === 0) {
        delete newFilters.required_certifications;
      }
    }

    onFiltersChange(newFilters);
    updateActiveFilters(newFilters);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">🌱 Sustainability Filters</span>
            {activeFilters.length > 0 && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                {activeFilters.length} active
              </span>
            )}
          </div>
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full border border-green-200"
              >
                <span>{filter}</span>
                <button
                  onClick={() => removeFilter(filter)}
                  className="hover:bg-green-100 rounded-full p-0.5"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-600 hover:text-red-800 font-medium underline"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Filters Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-6">
              {/* Score Ranges */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Minimum Scores</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Environmental Score: {filters.min_environmental_score || 0}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.min_environmental_score || 0}
                      onChange={(e) => updateFilter('min_environmental_score', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                    />
                  </div>
                </div>
              </div>

              {/* Carbon Footprint */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Maximum Impact</h4>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Carbon Footprint: {filters.max_carbon_footprint || 100}kg CO₂
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={filters.max_carbon_footprint || 100}
                    onChange={(e) => updateFilter('max_carbon_footprint', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
                  />
                </div>
              </div>

              {/* Boolean Filters */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Sustainability Features</h4>
                <div className="space-y-2">
                  {[
                    { key: 'vegan_only', label: 'Vegan Friendly', icon: '🌱' },
                    { key: 'recycled_materials_only', label: 'Made from Recycled Materials', icon: '♻️' },
                    { key: 'fair_trade_only', label: 'Fair Trade Certified', icon: '🤝' },
                    { key: 'local_manufacturing_only', label: 'Locally Manufactured', icon: '🏠' },
                    { key: 'repair_service_required', label: 'Repair Service Available', icon: '🔧' }
                  ].map(({ key, label, icon }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters[key as keyof SustainabilityFilter] || false}
                        onChange={(e) => updateFilter(key as keyof SustainabilityFilter, e.target.checked || undefined)}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 flex items-center gap-2">
                        <span>{icon}</span>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              {availableCertifications.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Required Certifications</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableCertifications.map((cert) => (
                      <label key={cert} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.required_certifications?.includes(cert) || false}
                          onChange={(e) => {
                            const current = filters.required_certifications || [];
                            const updated = e.target.checked
                              ? [...current, cert]
                              : current.filter(c => c !== cert);
                            updateFilter('required_certifications', updated.length > 0 ? updated : undefined);
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                          {cert}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .slider-green::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
        }

        .slider-blue::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .slider-green::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: none;
        }

        .slider-blue::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}