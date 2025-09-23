'use client';

import { useState, useEffect, useCallback } from 'react';
import { sanitizeHtml, sanitizeInput, CSRFToken, ValidationSchemas } from '@/lib/security';
import { z } from 'zod';

export const useSecurity = () => {
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Generate CSRF token on mount
  useEffect(() => {
    setCsrfToken(CSRFToken.generate());
  }, []);

  // Sanitize HTML content
  const sanitizeContent = useCallback((content: string): string => {
    return sanitizeHtml(content);
  }, []);

  // Validate and sanitize form input
  const validateInput = useCallback(<T>(
    schema: z.ZodSchema<T>,
    input: any
  ): { isValid: boolean; data?: T; errors?: string[] } => {
    try {
      const data = schema.parse(input);
      return { isValid: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(err => err.message)
        };
      }
      return {
        isValid: false,
        errors: ['Validation failed']
      };
    }
  }, []);

  // Secure fetch wrapper with CSRF protection
  const secureFetch = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    };

    const secureOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    return fetch(url, secureOptions);
  }, [csrfToken]);

  // Input sanitization functions
  const sanitizers = {
    text: sanitizeInput.text,
    search: sanitizeInput.search,
    email: sanitizeInput.email,
    number: sanitizeInput.number,
    url: sanitizeInput.url,
  };

  // Validation schemas
  const validators = ValidationSchemas;

  return {
    csrfToken,
    sanitizeContent,
    validateInput,
    secureFetch,
    sanitizers,
    validators,
  };
};

// Hook for secure form handling
export const useSecureForm = <T extends Record<string, any>>(
  initialValues: T,
  validationSchema: z.ZodSchema<T>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isValid, setIsValid] = useState(false);
  const { validateInput, sanitizers } = useSecurity();

  const setValue = useCallback((field: keyof T, value: any) => {
    // Sanitize input based on field type
    let sanitizedValue = value;
    if (typeof value === 'string') {
      sanitizedValue = sanitizers.text(value);
    }

    setValues(prev => ({
      ...prev,
      [field]: sanitizedValue,
    }));
  }, [sanitizers]);

  const validate = useCallback(() => {
    const result = validateInput(validationSchema, values);
    setIsValid(result.isValid);

    if (!result.isValid && result.errors) {
      // Map errors to fields (simplified)
      const fieldErrors: Partial<Record<keyof T, string>> = {};
      result.errors.forEach((error, index) => {
        const fieldName = Object.keys(values)[index] as keyof T;
        if (fieldName) {
          fieldErrors[fieldName] = error;
        }
      });
      setErrors(fieldErrors);
    } else {
      setErrors({});
    }

    return result;
  }, [values, validationSchema, validateInput]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsValid(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isValid,
    setValue,
    validate,
    reset,
  };
};