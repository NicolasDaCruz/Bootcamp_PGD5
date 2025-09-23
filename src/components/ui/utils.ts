/**
 * UI utility functions for component styling and className management
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge and deduplicate Tailwind CSS classes
 * Uses clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate variant-based CSS classes following design tokens
 */
export const variants = {
  color: {
    primary: 'bg-primary text-secondary border-primary',
    secondary: 'bg-secondary text-primary border-gray-300',
    accent: 'bg-accent text-white border-accent',
    success: 'bg-success text-white border-success',
    warning: 'bg-warning text-gray-900 border-warning',
    error: 'bg-error text-white border-error',
  },
  size: {
    sm: 'text-sm px-3 py-1.5 h-8',
    md: 'text-base px-4 py-2 h-10',
    lg: 'text-lg px-6 py-3 h-12',
    xl: 'text-xl px-8 py-4 h-14',
  },
  radius: {
    none: 'rounded-none',
    sm: 'rounded-sm',
    default: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  },
  animation: {
    none: '',
    pulse: 'animate-pulse-gentle',
    grow: 'animate-grow',
    'grow-lg': 'animate-grow-lg',
  },
  shadow: {
    none: 'shadow-none',
    sm: 'shadow-sm',
    default: 'shadow',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },
} as const;

/**
 * Focus ring styles following accessibility guidelines
 */
export const focusRing = 'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2';

/**
 * Disabled state styles
 */
export const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

/**
 * Loading state styles
 */
export const loadingStyles = 'opacity-50 cursor-wait pointer-events-none';

/**
 * Z-index scale following design tokens
 */
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;