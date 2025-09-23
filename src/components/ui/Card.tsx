/**
 * Card Component
 * Reusable card component for content organization
 */

import React, { forwardRef } from 'react';
import { type CardProps } from './types';
import { cn, variants } from './utils';

const Card = forwardRef<HTMLDivElement, CardProps & React.HTMLAttributes<HTMLDivElement>>(
  (
    {
      children,
      style = 'default',
      variant = 'secondary',
      size = 'md',
      radius = 'default',
      animation = 'none',
      padding = 'md',
      shadow = 'default',
      hoverable = false,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const cardStyles = cn(
      // Base card styles
      'relative overflow-hidden transition-all duration-300',

      // Style variants
      style === 'default' && 'bg-white border border-gray-200',
      style === 'outlined' && 'bg-transparent border-2 border-gray-300',
      style === 'filled' && variants.color[variant],
      style === 'glass' && 'glass-effect',

      // Radius variants
      variants.radius[radius],

      // Padding variants
      padding === 'sm' && 'p-3',
      padding === 'md' && 'p-4',
      padding === 'lg' && 'p-6',
      padding === 'xl' && 'p-8',

      // Shadow variants
      variants.shadow[shadow],

      // Animation variants (only if not disabled)
      !disabled && variants.animation[animation],

      // Hoverable effects
      hoverable && !disabled && cn(
        'cursor-pointer hover:shadow-lg',
        style === 'default' && 'hover:border-gray-300',
        style === 'outlined' && 'hover:border-accent',
      ),

      // Disabled state
      disabled && 'opacity-50 cursor-not-allowed pointer-events-none',

      // Custom className
      className
    );

    return (
      <div
        ref={ref}
        className={cardStyles}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components for better composition
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pb-4 border-b border-gray-200 last:border-b-0', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-heading-md font-semibold text-gray-900', className)}
      {...props}
    >
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ children, className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-600 mt-1', className)}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('py-4 first:pt-0 last:pb-0', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pt-4 border-t border-gray-200 first:border-t-0', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
};