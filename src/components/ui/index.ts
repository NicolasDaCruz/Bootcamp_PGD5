/**
 * UI Components Library - Barrel Exports
 * Centralized exports for all UI components following design system patterns
 */

// Export all types and interfaces
export * from './types';

// Component exports
export { Button } from './Button';
export { Input } from './Input';
export { Select } from './Select';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from './Card';
export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from './Modal';
export {
  Loading,
  ButtonLoading,
  PageLoading,
  InlineLoading
} from './Loading';

// Utility exports
export { cn } from './utils';

// Re-export commonly used types for convenience
export type {
  BaseComponentProps,
  ButtonProps,
  InputProps,
  SelectProps,
  CardProps,
  ModalProps,
  LoadingProps,
  ColorVariant,
  SizeVariant,
  AnimationVariant,
} from './types';