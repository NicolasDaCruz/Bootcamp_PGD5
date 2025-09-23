/**
 * Modal Component
 * Accessible modal dialog with backdrop and keyboard navigation
 */

import React, { forwardRef, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { type ModalProps } from './types';
import { cn, variants, Z_INDEX } from './utils';

const Modal = forwardRef<HTMLDivElement, ModalProps & React.HTMLAttributes<HTMLDivElement>>(
  (
    {
      children,
      open,
      onClose,
      title,
      size = 'md',
      radius = 'default',
      closeOnBackdrop = true,
      closeOnEscape = true,
      showCloseButton = true,
      className,
      ...props
    },
    ref
  ) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle escape key
    useEffect(() => {
      if (!open || !closeOnEscape) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, closeOnEscape, onClose]);

    // Focus management
    useEffect(() => {
      if (!open) return;

      const previousActiveElement = document.activeElement as HTMLElement;

      // Focus the modal when it opens
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Return focus when modal closes
      return () => {
        if (previousActiveElement) {
          previousActiveElement.focus();
        }
      };
    }, [open]);

    // Body scroll lock
    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [open]);

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (closeOnBackdrop && e.target === overlayRef.current) {
        onClose();
      }
    };

    const modalSizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full mx-4',
    };

    const overlayStyles = cn(
      'fixed inset-0 bg-black/50 flex items-center justify-center p-4',
      'transition-opacity duration-300',
      open ? 'opacity-100' : 'opacity-0 pointer-events-none'
    );

    const modalStyles = cn(
      'relative bg-white w-full max-h-[90vh] overflow-y-auto',
      'transform transition-all duration-300',
      variants.radius[radius],
      modalSizes[size],
      open ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
      className
    );

    if (!open) return null;

    const modalContent = (
      <div
        ref={overlayRef}
        className={overlayStyles}
        style={{ zIndex: Z_INDEX.modalBackdrop }}
        onClick={handleBackdropClick}
      >
        <div
          ref={ref || modalRef}
          className={modalStyles}
          style={{ zIndex: Z_INDEX.modal }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          tabIndex={-1}
          {...props}
        >
          {/* Modal Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              {title && (
                <h2
                  id="modal-title"
                  className="text-heading-md font-semibold text-gray-900"
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'p-2 rounded-md text-gray-400 hover:text-gray-600',
                    'hover:bg-gray-100 transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
                  )}
                  aria-label="Close modal"
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Modal Content */}
          <div className={cn(!title && !showCloseButton ? 'p-6' : 'px-6 pb-6')}>
            {children}
          </div>
        </div>
      </div>
    );

    // Render modal in portal
    return createPortal(
      modalContent,
      document.body
    );
  }
);

Modal.displayName = 'Modal';

// Modal sub-components for better composition
const ModalHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pb-4 border-b border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  )
);

ModalHeader.displayName = 'ModalHeader';

const ModalBody = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('py-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);

ModalBody.displayName = 'ModalBody';

const ModalFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pt-4 border-t border-gray-200 flex justify-end gap-3', className)}
      {...props}
    >
      {children}
    </div>
  )
);

ModalFooter.displayName = 'ModalFooter';

export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
};