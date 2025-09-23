import DOMPurify from 'dompurify';
import { z } from 'zod';
import CryptoJS from 'crypto-js';

// XSS Protection with DOMPurify
export const sanitizeHtml = (dirty: string): string => {
  if (typeof window === 'undefined') {
    // Server-side: return basic sanitization
    return dirty
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Client-side: use DOMPurify
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'i', 'b'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  });
};

// Input validation schemas
export const ValidationSchemas = {
  email: z.string().email('Invalid email address').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  phone: z.string()
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number too short')
    .max(20, 'Phone number too long'),
  address: z.string()
    .min(5, 'Address too short')
    .max(200, 'Address too long')
    .regex(/^[a-zA-Z0-9\s,.'-]+$/, 'Address contains invalid characters'),
  zipCode: z.string()
    .regex(/^[\d\s-]+$/, 'Invalid zip code format')
    .min(5, 'Zip code too short')
    .max(10, 'Zip code too long'),
  searchQuery: z.string()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query too long')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Search contains invalid characters'),
  productReview: z.string()
    .min(10, 'Review must be at least 10 characters')
    .max(1000, 'Review too long'),
  rating: z.number().min(1).max(5),
};

// CSRF Token generation and validation
export class CSRFToken {
  private static readonly SECRET_KEY = process.env.CSRF_SECRET || 'default-secret-key';

  static generate(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const data = `${timestamp}-${random}`;
    const hash = CryptoJS.HmacSHA256(data, this.SECRET_KEY).toString();
    return `${data}-${hash}`;
  }

  static validate(token: string): boolean {
    try {
      const parts = token.split('-');
      if (parts.length !== 3) return false;

      const [timestamp, random, hash] = parts;
      const data = `${timestamp}-${random}`;
      const expectedHash = CryptoJS.HmacSHA256(data, this.SECRET_KEY).toString();

      // Check if hash matches
      if (hash !== expectedHash) return false;

      // Check if token is not expired (24 hours)
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      return (now - tokenTime) < maxAge;
    } catch {
      return false;
    }
  }
}

// Rate limiting utilities
export class RateLimit {
  private static requests = new Map<string, { count: number; timestamp: number }>();

  static check(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || (now - record.timestamp) > windowMs) {
      this.requests.set(identifier, { count: 1, timestamp: now });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  static reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Content Security Policy configuration
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js
    "'unsafe-eval'", // Required for Next.js development
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://js.stripe.com',
    'https://vercel.live',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://vitals.vercel-insights.com',
    'https://region1.google-analytics.com',
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  ],
  'frame-src': [
    'https://js.stripe.com',
    'https://hooks.stripe.com',
  ],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

export const generateCSP = (): string => {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => {
      if (sources.length === 0) return directive;
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
};

// Security headers
export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSP(),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

// Input sanitization for different contexts
export const sanitizeInput = {
  text: (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  },

  search: (input: string): string => {
    return input.trim().replace(/[<>'"]/g, '').substring(0, 100);
  },

  number: (input: string): number | null => {
    const num = parseFloat(input);
    return isNaN(num) ? null : num;
  },

  email: (input: string): string => {
    return input.trim().toLowerCase();
  },

  url: (input: string): string => {
    try {
      const url = new URL(input);
      return url.toString();
    } catch {
      return '';
    }
  },
};

// Validate file uploads
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum 5MB allowed.' };
  }

  return { valid: true };
};