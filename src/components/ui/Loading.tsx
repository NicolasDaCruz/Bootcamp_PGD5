/**
 * Loading Component
 * Reusable loading indicators with multiple styles
 */

import React, { forwardRef } from 'react';
import { type LoadingProps } from './types';
import { cn, Z_INDEX } from './utils';

const Loading = forwardRef<HTMLDivElement, LoadingProps & React.HTMLAttributes<HTMLDivElement>>(
  (
    {
      style = 'spinner',
      size = 'md',
      variant = 'primary',
      text,
      centered = false,
      overlay = false,
      className,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    };

    const textSizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    };

    const colorClasses = {
      primary: 'text-primary',
      secondary: 'text-gray-600',
      accent: 'text-accent',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
    };

    const containerStyles = cn(
      'flex items-center',
      centered && 'justify-center',
      text ? 'gap-3' : 'justify-center',
      overlay && cn(
        'fixed inset-0 bg-white/80 backdrop-blur-sm',
        'flex items-center justify-center'
      ),
      className
    );

    const renderSpinner = () => (
      <svg
        className={cn(
          'animate-spin',
          sizeClasses[size],
          colorClasses[variant]
        )}
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
    );

    const renderDots = () => (
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full animate-pulse',
              size === 'sm' && 'h-1 w-1',
              size === 'md' && 'h-2 w-2',
              size === 'lg' && 'h-3 w-3',
              size === 'xl' && 'h-4 w-4',
              colorClasses[variant].replace('text-', 'bg-')
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.4s',
            }}
          />
        ))}
      </div>
    );

    const renderPulse = () => (
      <div
        className={cn(
          'rounded-full animate-pulse-gentle',
          sizeClasses[size],
          colorClasses[variant].replace('text-', 'bg-'),
          'opacity-75'
        )}
      />
    );

    const renderSkeleton = () => (
      <div className="space-y-3 w-full max-w-sm">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse bg-gray-200 rounded',
              i === 0 && 'h-4 w-3/4',
              i === 1 && 'h-4 w-full',
              i === 2 && 'h-4 w-2/3'
            )}
          />
        ))}
      </div>
    );

    const renderLoadingIndicator = () => {
      switch (style) {
        case 'dots':
          return renderDots();
        case 'pulse':
          return renderPulse();
        case 'skeleton':
          return renderSkeleton();
        case 'spinner':
        default:
          return renderSpinner();
      }
    };

    const loadingComponent = (
      <div
        ref={ref}
        className={containerStyles}
        style={overlay ? { zIndex: Z_INDEX.modal } : undefined}
        role="status"
        aria-label={text || 'Loading'}
        {...props}
      >
        {style !== 'skeleton' && renderLoadingIndicator()}
        {text && style !== 'skeleton' && (
          <span className={cn(textSizeClasses[size], colorClasses[variant])}>
            {text}
          </span>
        )}
        {style === 'skeleton' && renderLoadingIndicator()}
      </div>
    );

    return loadingComponent;
  }
);

Loading.displayName = 'Loading';

// Loading variants for specific use cases
const ButtonLoading = forwardRef<HTMLDivElement, Omit<LoadingProps, 'style' | 'text'>>(
  ({ size = 'sm', ...props }, ref) => (
    <Loading
      ref={ref}
      style="spinner"
      size={size}
      {...props}
    />
  )
);

ButtonLoading.displayName = 'ButtonLoading';

const PageLoading = forwardRef<HTMLDivElement, Omit<LoadingProps, 'centered' | 'overlay'>>(
  ({ size = 'lg', text = 'Loading...', ...props }, ref) => (
    <Loading
      ref={ref}
      size={size}
      text={text}
      centered
      overlay
      {...props}
    />
  )
);

PageLoading.displayName = 'PageLoading';

const InlineLoading = forwardRef<HTMLDivElement, Omit<LoadingProps, 'overlay'>>(
  ({ size = 'sm', style = 'dots', ...props }, ref) => (
    <Loading
      ref={ref}
      size={size}
      style={style}
      {...props}
    />
  )
);

InlineLoading.displayName = 'InlineLoading';

export {
  Loading,
  ButtonLoading,
  PageLoading,
  InlineLoading
};