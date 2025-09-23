/**
 * Shared types and interfaces for UI components
 * Following the design token patterns from globals.css
 */

import { ComponentPropsWithoutRef, ElementType } from 'react';

// Base variant types following design tokens
export type ColorVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
export type SizeVariant = 'sm' | 'md' | 'lg' | 'xl';
export type RadiusVariant = 'none' | 'sm' | 'default' | 'md' | 'lg' | 'xl' | 'full';
export type AnimationVariant = 'none' | 'pulse' | 'grow' | 'grow-lg';

// Base component props extending HTML attributes
export interface BaseComponentProps {
  /** Color variant following design system */
  variant?: ColorVariant;
  /** Size variant following 8px spacing scale */
  size?: SizeVariant;
  /** Border radius variant */
  radius?: RadiusVariant;
  /** Animation variant */
  animation?: AnimationVariant;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

// Polymorphic component props
export type PolymorphicRef<C extends ElementType> = ComponentPropsWithoutRef<C>['ref'];

export type PolymorphicComponentPropsWithRef<
  C extends ElementType,
  Props = {}
> = Props &
  ComponentPropsWithoutRef<C> & {
    as?: C;
    ref?: PolymorphicRef<C>;
  };

// Button specific props
export interface ButtonProps extends BaseComponentProps {
  /** Button visual style */
  style?: 'filled' | 'outlined' | 'ghost' | 'link';
  /** Full width button */
  fullWidth?: boolean;
  /** Icon only button */
  iconOnly?: boolean;
}

// Input specific props
export interface InputProps extends BaseComponentProps {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  /** Placeholder text */
  placeholder?: string;
  /** Input value */
  value?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Required field indicator */
  required?: boolean;
}

// Select specific props
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends BaseComponentProps {
  /** Select options */
  options: SelectOption[];
  /** Selected value */
  value?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Required field indicator */
  required?: boolean;
  /** Multiple selection */
  multiple?: boolean;
}

// Card specific props
export interface CardProps extends BaseComponentProps {
  /** Card style */
  style?: 'default' | 'outlined' | 'filled' | 'glass';
  /** Padding variant */
  padding?: SizeVariant;
  /** Shadow variant */
  shadow?: 'none' | 'sm' | 'default' | 'md' | 'lg' | 'xl';
  /** Hoverable card */
  hoverable?: boolean;
}

// Modal specific props
export interface ModalProps extends Omit<BaseComponentProps, 'size'> {
  /** Modal open state */
  open: boolean;
  /** Close callback */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
}

// Loading specific props
export interface LoadingProps extends BaseComponentProps {
  /** Loading style */
  style?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  /** Loading text */
  text?: string;
  /** Centered loading */
  centered?: boolean;
  /** Overlay loading */
  overlay?: boolean;
}

// Common component state
export interface ComponentState {
  isHovered: boolean;
  isFocused: boolean;
  isActive: boolean;
  isDisabled: boolean;
  isLoading: boolean;
}

// Animation timing following design tokens
export const ANIMATION_TIMINGS = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;