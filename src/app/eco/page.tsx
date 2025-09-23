'use client';

import React, { useState } from 'react';
import { EcoProvider } from '@/contexts/EcoContext';
import SecondLifeProducts from '@/components/SecondLifeProducts';
import TradeInProgram from '@/components/TradeInProgram';
import CarbonFootprintCalculator from '@/components/CarbonFootprintCalculator';
import SustainabilityMeter from '@/components/SustainabilityMeter';
import EcoFriendlyOptions from '@/components/EcoFriendlyOptions';

export default function EcoPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'second-life' | 'trade-in' | 'calculator'>('overview');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '🌍' },
    { id: 'second-life', name: 'Second Life', icon: '♻️' },
    { id: 'trade-in', name: 'Trade-In', icon: '💰' },
    { id: 'calculator', name: 'Carbon Calculator', icon: '📊' }
  ];

  const sustainabilityStats = [
    {
      icon: '🌱',
      value: '12.5M',
      label: 'kg CO₂ Saved',
      description: 'Through our sustainability initiatives'
    },
    {
      icon: '♻️',
      value: '45,000',
      label: 'Products Refurbished',
      description: 'Given a second life this year'
    },
    {
      icon: '🌳',
      value: '850',
      label: 'Trees Planted',
      description: 'Carbon offset partnerships'
    },
    {
      icon: '💧',
      value: '2.8M',
      label: 'Liters Water Saved',
      description: 'Through eco-friendly processes'
    }
  ];

  return (
    <EcoProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">
                Eco-Responsible Sneakers
              </h1>
              <p className="text-xl text-green-100 max-w-3xl mx-auto">
                Discover sustainable sneaker options, trade in your old pairs, and reduce your environmental impact with every purchase.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              {sustainabilityStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-green-100 mb-1">
                    {stat.label}
                  </div>
                  <div className="text-xs text-green-200">
                    {stat.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Our Sustainability Mission
                  </h2>
                  <p className="text-gray-600 mb-6">
                    We're committed to reducing the environmental impact of sneaker culture through innovative
                    programs, sustainable practices, and circular economy principles.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Second Life Program</h3>
                        <p className="text-sm text-gray-600">Professional refurbishment of returned sneakers</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Carbon Neutral Shipping</h3>
                        <p className="text-sm text-gray-600">Offset all shipping emissions through verified projects</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Eco-Friendly Packaging</h3>
                        <p className="text-sm text-gray-600">Recycled and biodegradable packaging materials</p>
                      </div>
                    </div>
                  </div>
                </div>

                <SustainabilityMeter showDetailed={true} />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">♻️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Shop Second Life
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Discover professionally refurbished sneakers at reduced prices
                  </p>
                  <button
                    onClick={() => setActiveTab('second-life')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Browse Collection
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Trade-In Program
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Get instant value estimates for your used sneakers
                  </p>
                  <button
                    onClick={() => setActiveTab('trade-in')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Estimate
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Carbon Calculator
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Calculate and offset your order's environmental impact
                  </p>
                  <button
                    onClick={() => setActiveTab('calculator')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Calculate Impact
                  </button>
                </div>
              </div>

              {/* Eco-Friendly Options Preview */}
              <EcoFriendlyOptions />
            </div>
          )}

          {activeTab === 'second-life' && (
            <SecondLifeProducts />
          )}

          {activeTab === 'trade-in' && (
            <TradeInProgram />
          )}

          {activeTab === 'calculator' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Carbon Footprint Calculator
                </h2>
                <p className="text-gray-600">
                  Calculate the environmental impact of your order and explore offset options
                </p>
              </div>
              <CarbonFootprintCalculator
                productIds={['demo-1', 'demo-2']}
                shippingDistance={75}
              />
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="bg-green-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Join the Sustainable Sneaker Movement
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Every sustainable choice makes a difference. Together, we can reduce the environmental
                impact of sneaker culture while still celebrating the styles we love.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                  Start Shopping Sustainably
                </button>
                <button className="px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium">
                  Learn More About Our Mission
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EcoProvider>
  );
}