/**
 * Button Component
 * Reusable button component following design system patterns
 */

import React, { forwardRef } from 'react';
import { type ButtonProps } from './types';
import { cn, variants, focusRing, disabledStyles, loadingStyles } from './utils';

const Button = forwardRef<HTMLButtonElement, ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      radius = 'default',
      animation = 'grow',
      style = 'filled',
      fullWidth = false,
      iconOnly = false,
      disabled = false,
      loading = false,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      // Base button styles
      'inline-flex items-center justify-center font-medium transition-all duration-300',
      'border border-transparent',
      focusRing,

      // Size variants
      variants.size[size],

      // Radius variants
      variants.radius[radius],

      // Animation variants (only if not disabled or loading)
      !disabled && !loading && variants.animation[animation],

      // Style variants
      style === 'filled' && variants.color[variant],
      style === 'outlined' && cn(
        'bg-transparent border-current',
        variant === 'primary' && 'text-primary border-primary hover:bg-primary hover:text-secondary',
        variant === 'secondary' && 'text-gray-700 border-gray-300 hover:bg-gray-50',
        variant === 'accent' && 'text-accent border-accent hover:bg-accent hover:text-white',
        variant === 'success' && 'text-success border-success hover:bg-success hover:text-white',
        variant === 'warning' && 'text-warning border-warning hover:bg-warning hover:text-gray-900',
        variant === 'error' && 'text-error border-error hover:bg-error hover:text-white',
      ),
      style === 'ghost' && cn(
        'bg-transparent border-transparent',
        variant === 'primary' && 'text-primary hover:bg-gray-100',
        variant === 'secondary' && 'text-gray-700 hover:bg-gray-50',
        variant === 'accent' && 'text-accent hover:bg-accent/10',
        variant === 'success' && 'text-success hover:bg-success/10',
        variant === 'warning' && 'text-warning hover:bg-warning/10',
        variant === 'error' && 'text-error hover:bg-error/10',
      ),
      style === 'link' && cn(
        'bg-transparent border-transparent underline-offset-4 hover:underline p-0 h-auto',
        variant === 'primary' && 'text-primary',
        variant === 'accent' && 'text-accent',
        variant === 'error' && 'text-error',
      ),

      // Full width
      fullWidth && 'w-full',

      // Icon only
      iconOnly && 'aspect-square p-0',

      // State styles
      disabled && disabledStyles,
      loading && loadingStyles,

      // Custom className
      className
    );

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={baseStyles}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };