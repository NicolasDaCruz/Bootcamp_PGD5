'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SustainabilityScoreProps {
  overallScore: number;
  environmentalImpact: number;
  socialResponsibility: number;
  durabilityRating: number;
  recyclabilityScore: number;
  carbonFootprintKg?: number;
  waterUsageLiters?: number;
  showDetails?: boolean;
  size?: 'compact' | 'full';
  animated?: boolean;
}

export function SustainabilityScore({
  overallScore,
  environmentalImpact,
  socialResponsibility,
  durabilityRating,
  recyclabilityScore,
  carbonFootprintKg,
  waterUsageLiters,
  showDetails = false,
  size = 'compact',
  animated = false
}: SustainabilityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    if (score >= 40) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const ScoreRing = ({ score, size: ringSize = 120, strokeWidth = 8 }: {
    score: number;
    size?: number;
    strokeWidth?: number;
  }) => {
    const normalizedRadius = (ringSize - strokeWidth * 2) / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);

    const RingComponent = animated ? motion.circle : 'circle';
    const animationProps = animated ? {
      initial: { strokeDashoffset: circumference },
      animate: { strokeDashoffset },
      transition: { duration: 1.5, ease: "easeInOut" }
    } : {};

    return (
      <svg
        height={ringSize}
        width={ringSize}
        className="transform -rotate-90"
      >
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={ringSize / 2}
          cy={ringSize / 2}
        />
        <RingComponent
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          style={!animated ? { strokeDashoffset } : undefined}
          r={normalizedRadius}
          cx={ringSize / 2}
          cy={ringSize / 2}
          strokeLinecap="round"
          {...animationProps}
        />
      </svg>
    );
  };

  const DetailBar = ({ label, score, icon }: { label: string; score: number; icon: string }) => {
    const BarComponent = animated ? motion.div : 'div';
    const animationProps = animated ? {
      initial: { width: 0 },
      animate: { width: `${score}%` },
      transition: { duration: 1, delay: 0.3 }
    } : {};

    return (
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">{icon}</span>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <span className="text-sm font-bold" style={{ color: getScoreColor(score) }}>
              {score}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <BarComponent
              className="h-2 rounded-full transition-all duration-300"
              style={!animated ? { width: `${score}%`, backgroundColor: getScoreColor(score) } : { backgroundColor: getScoreColor(score) }}
              {...animationProps}
            />
          </div>
        </div>
      </div>
    );
  };

  if (size === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <div className="relative">
          <ScoreRing score={overallScore} size={60} strokeWidth={4} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color: getScoreColor(overallScore) }}>
              {getScoreGrade(overallScore)}
            </span>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">
            Sustainability Score
          </div>
          <div className="text-xs text-gray-600">
            {overallScore}/100 ({getScoreGrade(overallScore)})
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sustainability Score</h3>
          <p className="text-sm text-gray-600">Environmental and social impact rating</p>
        </div>
        <div className="relative">
          <ScoreRing score={overallScore} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: getScoreColor(overallScore) }}>
              {overallScore}
            </span>
            <span className="text-sm text-gray-600">/ 100</span>
            <span className="text-lg font-bold mt-1" style={{ color: getScoreColor(overallScore) }}>
              {getScoreGrade(overallScore)}
            </span>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-1">
          <DetailBar
            label="Environmental Impact"
            score={environmentalImpact}
            icon="🌍"
          />
          <DetailBar
            label="Social Responsibility"
            score={socialResponsibility}
            icon="🤝"
          />
          <DetailBar
            label="Durability Rating"
            score={durabilityRating}
            icon="⚡"
          />
          <DetailBar
            label="Recyclability"
            score={recyclabilityScore}
            icon="♻️"
          />

          {(carbonFootprintKg || waterUsageLiters) && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Environmental Impact</h4>
              <div className="grid grid-cols-2 gap-4">
                {carbonFootprintKg && (
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl mb-1">🌱</div>
                    <div className="text-lg font-bold text-green-700">
                      {carbonFootprintKg.toFixed(1)}kg
                    </div>
                    <div className="text-xs text-green-600">CO₂ Footprint</div>
                  </div>
                )}
                {waterUsageLiters && (
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl mb-1">💧</div>
                    <div className="text-lg font-bold text-blue-700">
                      {(waterUsageLiters / 1000).toFixed(1)}k
                    </div>
                    <div className="text-xs text-blue-600">Liters Used</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}