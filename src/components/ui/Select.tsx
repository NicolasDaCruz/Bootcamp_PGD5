/**
 * Select Component
 * Reusable select component with consistent styling and accessibility
 */

import React, { forwardRef, useState } from 'react';
import { type SelectProps } from './types';
import { cn, variants, focusRing, disabledStyles } from './utils';

const Select = forwardRef<HTMLSelectElement, SelectProps & React.SelectHTMLAttributes<HTMLSelectElement>>(
  (
    {
      options,
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
      multiple = false,
      className,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const selectStyles = cn(
      // Base select styles
      'w-full bg-white border transition-all duration-300 appearance-none',
      'text-gray-900',
      focusRing,

      // Size variants
      variants.size[size as keyof typeof variants.size],

      // Radius variants
      variants.radius[radius as keyof typeof variants.radius],

      // Add padding for dropdown arrow
      'pr-10',

      // State styles
      error
        ? 'border-error focus:border-error focus:ring-error'
        : 'border-gray-300 focus:border-accent focus:ring-accent',

      // Focused state
      isFocused && 'ring-2 ring-offset-2',

      // Disabled state
      disabled && cn(disabledStyles, 'bg-gray-50 border-gray-200'),

      // Loading state
      loading && 'animate-pulse',

      // Custom className
      className
    );

    const labelId = label ? `${props.id || 'select'}-label` : undefined;
    const helperTextId = helperText ? `${props.id || 'select'}-helper` : undefined;
    const errorId = errorMessage ? `${props.id || 'select'}-error` : undefined;

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
          <select
            ref={ref}
            value={value}
            disabled={disabled || loading}
            multiple={multiple}
            className={selectStyles}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-labelledby={labelId}
            aria-describedby={cn(helperTextId, errorId)}
            aria-invalid={error}
            aria-required={required}
            {...props}
          >
            {placeholder && !multiple && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown arrow */}
          {!multiple && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              {loading ? (
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
              ) : (
                <svg
                  className={cn(
                    'h-4 w-4',
                    disabled ? 'text-gray-300' : 'text-gray-400'
                  )}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
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

Select.displayName = 'Select';

export { Select };