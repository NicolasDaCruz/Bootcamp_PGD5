'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Zap,
  MapPin,
  Clock,
  Package,
  CheckCircle,
  Search,
  Navigation,
  Info
} from 'lucide-react';
import Image from 'next/image';
import {
  ShippingMethod,
  PickupPoint,
  getShippingMethods,
  searchPickupPoints
} from '@/lib/shipping';

interface ShippingOptionsSelectorProps {
  subtotal: number;
  selectedMethod: string;
  onMethodChange: (methodId: string, pickupPoint?: PickupPoint) => void;
  countryCode: string;
  postalCode?: string;
}

export default function ShippingOptionsSelector({
  subtotal,
  selectedMethod,
  onMethodChange,
  countryCode,
  postalCode
}: ShippingOptionsSelectorProps) {
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [isLoadingPickupPoints, setIsLoadingPickupPoints] = useState(false);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<PickupPoint | null>(null);
  const [showPickupPoints, setShowPickupPoints] = useState(false);

  const shippingMethods = getShippingMethods(subtotal, countryCode);

  // Load pickup points when Point Relais is selected and postal code is available
  useEffect(() => {
    if (selectedMethod === 'point_relais' && postalCode && countryCode) {
      loadPickupPoints();
    }
  }, [selectedMethod, postalCode, countryCode]);

  const loadPickupPoints = async () => {
    if (!postalCode) return;

    setIsLoadingPickupPoints(true);
    try {
      const points = await searchPickupPoints(postalCode, countryCode);
      setPickupPoints(points);
      if (points.length > 0) {
        setShowPickupPoints(true);
      }
    } catch (error) {
      console.error('Failed to load pickup points:', error);
    } finally {
      setIsLoadingPickupPoints(false);
    }
  };

  const handleMethodChange = (methodId: string) => {
    onMethodChange(methodId);

    if (methodId === 'point_relais') {
      if (postalCode) {
        loadPickupPoints();
      } else {
        setShowPickupPoints(true);
      }
    } else {
      setShowPickupPoints(false);
      setSelectedPickupPoint(null);
    }
  };

  const handlePickupPointSelect = (point: PickupPoint) => {
    setSelectedPickupPoint(point);
    onMethodChange('point_relais', point);
  };

  const getMethodIcon = (methodId: string) => {
    switch (methodId) {
      case 'standard':
        return Truck;
      case 'express':
        return Zap;
      case 'point_relais':
        return MapPin;
      default:
        return Package;
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Shipping Method
      </h3>

      {/* Shipping Methods */}
      <div className="space-y-3">
        {shippingMethods.map((method) => {
          const Icon = getMethodIcon(method.id);
          const isSelected = selectedMethod === method.id;

          return (
            <div key={method.id}>
              <label
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : method.available
                    ? 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    : 'border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed'
                }`}
              >
                <input
                  type="radio"
                  name="shippingMethod"
                  value={method.id}
                  checked={isSelected}
                  onChange={(e) => handleMethodChange(e.target.value)}
                  disabled={!method.available}
                  className="sr-only"
                />

                <div className="flex items-center flex-1">
                  <div className="w-8 h-8 mr-4 text-slate-600 dark:text-slate-400">
                    <Icon className="w-full h-full" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {method.name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {method.description}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {method.price === 0 ? 'Free' : `$${method.price.toFixed(2)}`}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {method.deliveryTime}
                        </div>
                      </div>
                    </div>

                    {/* Free shipping indicator */}
                    {method.id === 'standard' && method.price === 0 && subtotal >= 50 && (
                      <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>You qualify for free shipping!</span>
                      </div>
                    )}

                    {/* Free shipping progress */}
                    {method.id === 'standard' && method.price > 0 && subtotal < 50 && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">
                          Add ${(50 - subtotal).toFixed(2)} more for free shipping
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1">
                          <div
                            className="bg-blue-600 h-1 rounded-full transition-all"
                            style={{ width: `${Math.min((subtotal / 50) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`w-4 h-4 border-2 rounded-full ml-4 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {isSelected && (
                      <div className="w-full h-full rounded-full bg-white transform scale-50" />
                    )}
                  </div>
                </div>
              </label>
            </div>
          );
        })}
      </div>

      {/* Pickup Points Selection for Point Relais */}
      <AnimatePresence>
        {selectedMethod === 'point_relais' && showPickupPoints && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-slate-900 dark:text-white">
                  Select Pickup Point
                </h4>

                {postalCode && (
                  <button
                    onClick={loadPickupPoints}
                    disabled={isLoadingPickupPoints}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                    {isLoadingPickupPoints ? 'Searching...' : 'Search Again'}
                  </button>
                )}
              </div>

              {!postalCode && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg mb-4">
                  <Info className="w-4 h-4" />
                  <span className="text-sm">
                    Please enter your postal code in the shipping address to see available pickup points.
                  </span>
                </div>
              )}

              {isLoadingPickupPoints && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {!isLoadingPickupPoints && pickupPoints.length === 0 && postalCode && (
                <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No pickup points found in your area.</p>
                  <p className="text-sm mt-1">Try searching with a different postal code.</p>
                </div>
              )}

              {pickupPoints.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pickupPoints.map((point) => (
                    <label
                      key={point.id}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedPickupPoint?.id === point.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pickupPoint"
                        value={point.id}
                        checked={selectedPickupPoint?.id === point.id}
                        onChange={() => handlePickupPointSelect(point)}
                        className="sr-only"
                      />

                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {point.name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {point.address}, {point.city} {point.postalCode}
                        </div>

                        {point.distance && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <Navigation className="w-3 h-3" />
                            {point.distance} km away
                          </div>
                        )}

                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          <strong>Opening Hours:</strong>
                          {point.openingHours.map((hours, index) => (
                            <div key={index}>{hours}</div>
                          ))}
                        </div>
                      </div>

                      <div className={`w-4 h-4 border-2 rounded-full mt-1 ${
                        selectedPickupPoint?.id === point.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {selectedPickupPoint?.id === point.id && (
                          <div className="w-full h-full rounded-full bg-white transform scale-50" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}