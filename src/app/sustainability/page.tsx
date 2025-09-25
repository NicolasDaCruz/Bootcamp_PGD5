'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckBadgeIcon,
  SparklesIcon,
  TruckIcon,
  BeakerIcon,
  ScaleIcon,
  GlobeAltIcon,
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

export default function SustainabilityProcessPage() {
  const processSteps = [
    {
      step: 1,
      title: "Collection & Sourcing",
      icon: <TruckIcon className="w-8 h-8" />,
      description: "We partner with sneaker enthusiasts and collectors worldwide to source pre-loved sneakers.",
      details: [
        "Direct partnerships with sneaker collectors",
        "Community-driven sourcing network",
        "Carbon-neutral collection points",
        "Local pickup services to reduce transport emissions"
      ],
      environmentalImpact: "Reduces manufacturing demand by 100% per collected pair"
    },
    {
      step: 2,
      title: "Authentication Process",
      icon: <CheckBadgeIcon className="w-8 h-8" />,
      description: "Every pair undergoes rigorous authentication by our certified experts using advanced technology.",
      details: [
        "AI-powered authentication scanning",
        "Expert manual verification (99.8% accuracy)",
        "Material composition analysis",
        "Historical database cross-referencing",
        "Blockchain-verified authenticity certificates"
      ],
      environmentalImpact: "Prevents counterfeit waste and ensures product longevity"
    },
    {
      step: 3,
      title: "Restoration & Cleaning",
      icon: <SparklesIcon className="w-8 h-8" />,
      description: "Eco-friendly restoration using biodegradable cleaning solutions and sustainable materials.",
      details: [
        "Plant-based cleaning formulas",
        "Water recycling systems (90% water reuse)",
        "Solar-powered restoration facilities",
        "Upcycled packaging materials",
        "Zero-waste restoration process"
      ],
      environmentalImpact: "Saves 450L of water per pair vs. new manufacturing"
    },
    {
      step: 4,
      title: "Condition Assessment",
      icon: <ScaleIcon className="w-8 h-8" />,
      description: "Comprehensive evaluation to ensure transparency and set fair pricing based on actual condition.",
      details: [
        "110-point condition checklist",
        "High-resolution photography documentation",
        "Wear pattern analysis",
        "Structural integrity testing",
        "Transparent condition scoring (0-100 scale)"
      ],
      environmentalImpact: "Extends product lifespan through accurate condition mapping"
    },
    {
      step: 5,
      title: "Quality Testing",
      icon: <BeakerIcon className="w-8 h-8" />,
      description: "Advanced testing ensures every pair meets our quality standards for safety and durability.",
      details: [
        "Sole flexibility and adhesion tests",
        "Upper material stress testing",
        "Insole comfort and hygiene verification",
        "Structural durability assessment",
        "Safety standard compliance checks"
      ],
      environmentalImpact: "Ensures maximum lifespan extension and user safety"
    },
    {
      step: 6,
      title: "Sustainable Distribution",
      icon: <GlobeAltIcon className="w-8 h-8" />,
      description: "Carbon-neutral shipping with eco-friendly packaging made from recycled materials.",
      details: [
        "100% recycled cardboard packaging",
        "Biodegradable protective materials",
        "Carbon offset shipping programs",
        "Local distribution centers",
        "Reusable packaging options"
      ],
      environmentalImpact: "Net-negative carbon footprint shipping"
    }
  ];

  const impactStats = [
    { value: '15,420kg', label: 'CO₂ Emissions Prevented', icon: '🌍' },
    { value: '8,750L', label: 'Water Conserved', icon: '💧' },
    { value: '2,340kg', label: 'Waste Diverted', icon: '♻️' },
    { value: '1,250', label: 'Pairs Given Second Life', icon: '👟' },
    { value: '89', label: 'Trees Planted', icon: '🌱' },
    { value: '99.8%', label: 'Authentication Accuracy', icon: '✅' }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Homepage
            </Link>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <SparklesIcon className="w-8 h-8 text-green-600" />
              <span className="text-lg font-semibold text-green-600 uppercase tracking-wider">
                Sustainability Process
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Environmental Process
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From collection to your doorstep, every step of our process is designed to minimize
              environmental impact while maximizing sneaker lifespan and authenticity.
            </p>
          </div>
        </div>
      </div>

      {/* Impact Overview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Environmental Impact</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every pair that goes through our process creates measurable positive environmental impact
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            {impactStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 text-center shadow-lg border border-gray-100"
              >
                <div className="text-3xl mb-3">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">The 6-Step Sustainability Process</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each sneaker goes through our comprehensive 6-step process to ensure maximum quality,
              authenticity, and environmental benefit.
            </p>
          </div>

          <div className="space-y-16">
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className={`flex flex-col lg:flex-row items-center gap-12 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                      <span className="text-green-600 font-bold text-lg">{step.step}</span>
                    </div>
                    <div className="text-green-600">
                      {step.icon}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-gray-600 text-lg mb-6">{step.description}</p>

                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Process Details:</h4>
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-3 text-gray-600">
                          <CheckBadgeIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <HeartIcon className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">Environmental Impact:</span>
                    </div>
                    <p className="text-green-700">{step.environmentalImpact}</p>
                  </div>
                </div>

                {/* Visual */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <div className="text-green-600">
                            {step.icon}
                          </div>
                        </div>
                        <h4 className="font-bold text-gray-900 text-xl mb-2">Step {step.step}</h4>
                        <p className="text-gray-600">{step.title}</p>
                      </div>
                    </div>

                    {/* Connector line for non-last items */}
                    {index < processSteps.length - 1 && (
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                        <div className="w-1 h-16 bg-gradient-to-b from-green-300 to-blue-300 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitment Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <UserGroupIcon className="w-8 h-8" />
              <span className="text-lg font-semibold uppercase tracking-wider">Our Commitment</span>
            </div>

            <h2 className="text-4xl font-bold mb-6">
              Every Sneaker Tells a Story of Sustainability
            </h2>

            <p className="text-lg opacity-90 max-w-3xl mx-auto mb-8">
              We believe that giving sneakers a second life isn't just about fashion—it's about
              responsibility to our planet and future generations. Our process ensures that every
              pair we handle contributes to a more sustainable future.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="font-bold text-xl mb-2">Planet First</h3>
                <p className="opacity-90">Every decision prioritizes environmental impact</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="font-bold text-xl mb-2">Community Driven</h3>
                <p className="opacity-90">Built with and for sneaker enthusiasts</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🔬</div>
                <h3 className="font-bold text-xl mb-2">Innovation Led</h3>
                <p className="opacity-90">Cutting-edge technology for authentication</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Be Part of the Solution?
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Join thousands of sneaker lovers who are making a positive environmental impact
              with every purchase. Browse our authenticated, sustainable collection.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
              >
                🌱 Browse Sustainable Sneakers
              </Link>
              <Link
                href="/"
                className="px-8 py-4 border-2 border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-semibold transition-colors duration-200"
              >
                Return to Homepage
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}