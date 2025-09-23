'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  EcoMetrics,
  EcoLabel,
  ProductCondition,
  TradeInEstimate,
  CarbonFootprintData,
  EcoFriendlyOptions,
  PackagingOption,
  ShippingOption
} from '@/types/eco';

interface EcoContextType {
  // State
  carbonFootprint: CarbonFootprintData | null;
  ecoFriendlyOptions: EcoFriendlyOptions;
  sustainabilityGoals: {
    carbonNeutral: boolean;
    wasteReduction: number;
    recyclingTarget: number;
  };

  // Actions
  calculateCarbonFootprint: (productIds: string[], shippingDistance: number) => Promise<CarbonFootprintData>;
  getTradeInEstimate: (productId: string, condition: string) => Promise<TradeInEstimate>;
  getEcoLabels: (productId: string) => Promise<EcoLabel[]>;
  updateEcoOptions: (options: Partial<EcoFriendlyOptions>) => void;
  offsetCarbon: (amount: number, offsetId: string) => Promise<boolean>;
}

const EcoContext = createContext<EcoContextType | undefined>(undefined);

// Default eco-friendly options
const defaultEcoOptions: EcoFriendlyOptions = {
  packaging: [
    {
      id: 'standard',
      name: 'Standard Packaging',
      description: 'Regular cardboard box with plastic protection',
      ecoScore: 3,
      additionalCost: 0,
      materials: ['Cardboard', 'Plastic wrap']
    },
    {
      id: 'eco-friendly',
      name: 'Eco-Friendly Packaging',
      description: 'Recycled cardboard with biodegradable protection',
      ecoScore: 8,
      additionalCost: 2.50,
      materials: ['Recycled cardboard', 'Biodegradable wrap']
    },
    {
      id: 'minimal',
      name: 'Minimal Packaging',
      description: 'Just the original box with minimal protection',
      ecoScore: 9,
      additionalCost: -1.00,
      materials: ['Original box only']
    }
  ],
  shipping: [
    {
      id: 'standard',
      name: 'Standard Shipping',
      carbonFootprint: 2.5,
      deliveryTime: '3-5 days',
      cost: 5.99,
      carrier: 'PostNL'
    },
    {
      id: 'eco-shipping',
      name: 'Carbon Neutral Shipping',
      carbonFootprint: 0,
      deliveryTime: '4-6 days',
      cost: 7.99,
      carrier: 'DHL Green'
    },
    {
      id: 'pickup',
      name: 'Store Pickup',
      carbonFootprint: 0,
      deliveryTime: 'Same day',
      cost: 0,
      carrier: 'Self pickup'
    }
  ],
  carbonOffset: false
};

// Product condition ratings
const productConditions: ProductCondition[] = [
  {
    id: 'mint',
    name: 'Mint',
    description: 'Like new, no visible wear',
    priceReduction: 10,
    qualityScore: 10
  },
  {
    id: 'excellent',
    name: 'Excellent',
    description: 'Minimal wear, great condition',
    priceReduction: 20,
    qualityScore: 9
  },
  {
    id: 'good',
    name: 'Good',
    description: 'Some wear but well maintained',
    priceReduction: 35,
    qualityScore: 7
  },
  {
    id: 'fair',
    name: 'Fair',
    description: 'Noticeable wear but functional',
    priceReduction: 50,
    qualityScore: 5
  }
];

export function EcoProvider({ children }: { children: React.ReactNode }) {
  const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprintData | null>(null);
  const [ecoFriendlyOptions, setEcoFriendlyOptions] = useState<EcoFriendlyOptions>(defaultEcoOptions);
  const [sustainabilityGoals] = useState({
    carbonNeutral: true,
    wasteReduction: 75, // percentage
    recyclingTarget: 80 // percentage
  });

  const calculateCarbonFootprint = async (
    productIds: string[],
    shippingDistance: number
  ): Promise<CarbonFootprintData> => {
    // Simulate API call for carbon footprint calculation
    await new Promise(resolve => setTimeout(resolve, 1000));

    const manufacturing = productIds.length * 12.5; // kg CO2 per product
    const transportation = shippingDistance * 0.21; // kg CO2 per km
    const packaging = productIds.length * 0.8; // kg CO2 per package
    const total = manufacturing + transportation + packaging;

    const footprint: CarbonFootprintData = {
      manufacturing,
      transportation,
      packaging,
      total,
      offsetOptions: [
        {
          id: 'forest',
          name: 'Forest Protection',
          description: 'Support forest conservation projects',
          pricePerKg: 0.02,
          verificationBody: 'Gold Standard'
        },
        {
          id: 'renewable',
          name: 'Renewable Energy',
          description: 'Fund solar and wind energy projects',
          pricePerKg: 0.025,
          verificationBody: 'VCS'
        },
        {
          id: 'direct-air',
          name: 'Direct Air Capture',
          description: 'Technology that removes CO2 from atmosphere',
          pricePerKg: 0.1,
          verificationBody: 'CDR Registry'
        }
      ]
    };

    setCarbonFootprint(footprint);
    return footprint;
  };

  const getTradeInEstimate = async (
    productId: string,
    conditionId: string
  ): Promise<TradeInEstimate> => {
    // Simulate API call for trade-in estimation
    await new Promise(resolve => setTimeout(resolve, 800));

    const condition = productConditions.find(c => c.id === conditionId) || productConditions[2];
    const originalPrice = 150; // This would come from product data
    const estimatedValue = originalPrice * (1 - condition.priceReduction / 100);

    return {
      productId,
      originalPrice,
      estimatedValue,
      condition,
      factors: {
        brand: 0.8, // Nike factor
        age: 0.7, // 2 years old
        condition: condition.qualityScore / 10,
        marketDemand: 0.9 // High demand
      }
    };
  };

  const getEcoLabels = async (productId: string): Promise<EcoLabel[]> => {
    // Simulate API call for eco labels
    await new Promise(resolve => setTimeout(resolve, 500));

    return [
      {
        id: 'recycled',
        name: 'Recycled Materials',
        description: 'Made with 50%+ recycled materials',
        icon: '♻️',
        color: 'green'
      },
      {
        id: 'carbon-neutral',
        name: 'Carbon Neutral',
        description: 'Carbon emissions offset',
        icon: '🌱',
        color: 'green'
      },
      {
        id: 'fair-trade',
        name: 'Fair Trade',
        description: 'Ethically sourced materials',
        icon: '🤝',
        color: 'blue'
      }
    ];
  };

  const updateEcoOptions = (options: Partial<EcoFriendlyOptions>) => {
    setEcoFriendlyOptions(prev => ({
      ...prev,
      ...options
    }));
  };

  const offsetCarbon = async (amount: number, offsetId: string): Promise<boolean> => {
    // Simulate API call for carbon offset purchase
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log(`Offsetting ${amount}kg CO2 with ${offsetId}`);
    return true;
  };

  return (
    <EcoContext.Provider
      value={{
        carbonFootprint,
        ecoFriendlyOptions,
        sustainabilityGoals,
        calculateCarbonFootprint,
        getTradeInEstimate,
        getEcoLabels,
        updateEcoOptions,
        offsetCarbon
      }}
    >
      {children}
    </EcoContext.Provider>
  );
}

export function useEco() {
  const context = useContext(EcoContext);
  if (context === undefined) {
    throw new Error('useEco must be used within an EcoProvider');
  }
  return context;
}