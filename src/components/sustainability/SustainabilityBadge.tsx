'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SustainabilityBadgeProps {
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'exclusive';
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
  animated?: boolean;
}

export function SustainabilityBadge({
  name,
  description,
  icon,
  color,
  rarity,
  size = 'medium',
  showDescription = false,
  animated = false
}: SustainabilityBadgeProps) {
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base'
  };

  const iconSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const rarityStyles = {
    common: 'ring-1 ring-gray-200',
    rare: 'ring-2 ring-yellow-400 shadow-md',
    exclusive: 'ring-2 ring-purple-500 shadow-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10'
  };

  const BadgeComponent = animated ? motion.div : 'div';
  const animationProps = animated ? {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {};

  return (
    <BadgeComponent
      {...animationProps}
      className={`
        inline-flex items-center gap-2 rounded-full font-medium
        ${sizeClasses[size]}
        ${rarityStyles[rarity]}
        transition-all duration-300 hover:shadow-md
        group relative
      `}
      style={{
        backgroundColor: `${color}15`,
        borderColor: color,
        color: color
      }}
      title={description}
    >
      <span className={iconSizes[size]}>{icon}</span>
      <span className="font-semibold">{name}</span>

      {/* Tooltip for description */}
      {showDescription && (
        <div className="
          absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
          bg-gray-900 text-white text-xs px-3 py-2 rounded-lg
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          pointer-events-none z-10 w-48 text-center
          shadow-lg
        ">
          {description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}

      {/* Rarity glow effect */}
      {rarity === 'exclusive' && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse"></div>
      )}
    </BadgeComponent>
  );
}

export function SustainabilityBadgeList({
  badges,
  maxVisible = 3,
  size = 'medium',
  animated = false
}: {
  badges: Array<{
    name: string;
    description: string;
    icon: string;
    color: string;
    rarity: 'common' | 'rare' | 'exclusive';
  }>;
  maxVisible?: number;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}) {
  const visibleBadges = badges.slice(0, maxVisible);
  const remainingCount = badges.length - maxVisible;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleBadges.map((badge, index) => (
        <SustainabilityBadge
          key={`${badge.name}-${index}`}
          {...badge}
          size={size}
          showDescription={true}
          animated={animated}
        />
      ))}

      {remainingCount > 0 && (
        <span className="text-sm text-gray-500 font-medium">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}