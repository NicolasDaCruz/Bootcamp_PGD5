/**
 * Input Component
 * Reusable input component with focus states and validation
 */

import React, { forwardRef, useState } from 'react';
import { type InputProps } from './types';
import { cn, variants, focusRing, disabledStyles } from './utils';

const Input = forwardRef<HTMLInputElement, InputProps & React.InputHTMLAttributes<HTMLInputElement>>(
  (
    {
      type = 'text',
      size = 'md',
      radius = 'default',
      variant = 'secondary',
      placeholder,
      value,
      error = false,
      errorMessage,
      label,
      helperText,
      required = false,
      disabled = false,
      loading = false,
      className,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const inputStyles = cn(
      // Base input styles
      'w-full bg-white border transition-all duration-300',
      'placeholder:text-gray-400',
      focusRing,

      // Size variants
      variants.size[size as keyof typeof variants.size],

      // Radius variants
      variants.radius[radius as keyof typeof variants.radius],

      // State styles
      error
        ? 'border-error text-error focus:border-error focus:ring-error'
        : 'border-gray-300 text-gray-900 focus:border-accent focus:ring-accent',

      // Focused state
      isFocused && 'ring-2 ring-offset-2',

      // Disabled state
      disabled && cn(disabledStyles, 'bg-gray-50 border-gray-200'),

      // Loading state
      loading && 'animate-pulse',

      // Custom className
      className
    );

    const labelId = label ? `${props.id || 'input'}-label` : undefined;
    const helperTextId = helperText ? `${props.id || 'input'}-helper` : undefined;
    const errorId = errorMessage ? `${props.id || 'input'}-error` : undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label
            id={labelId}
            htmlFor={props.id}
            className={cn(
              'block text-sm font-medium',
              error ? 'text-error' : 'text-gray-700',
              disabled && 'text-gray-400'
            )}
          >
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            type={type}
            placeholder={placeholder}
            value={value}
            disabled={disabled || loading}
            className={inputStyles}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-labelledby={labelId}
            aria-describedby={cn(helperTextId, errorId)}
            aria-invalid={error}
            aria-required={required}
            {...props}
          />

          {loading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className="animate-spin h-4 w-4 text-gray-400"
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
            </div>
          )}
        </div>

        {(helperText || errorMessage) && (
          <div className="space-y-1">
            {helperText && !error && (
              <p
                id={helperTextId}
                className={cn(
                  'text-sm',
                  disabled ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                {helperText}
              </p>
            )}
            {errorMessage && error && (
              <p
                id={errorId}
                className="text-sm text-error flex items-center gap-1"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                {errorMessage}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };