import { NextRequest, NextResponse } from 'next/server';
import { CSRFToken, RateLimit } from './security';
import * as Sentry from '@sentry/nextjs';

export interface SecureApiOptions {
  allowedMethods?: string[];
  requireAuth?: boolean;
  requireCSRF?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: SecureApiOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Method validation
      if (options.allowedMethods && !options.allowedMethods.includes(req.method)) {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
      }

      // Rate limiting
      if (options.rateLimit) {
        const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const { maxRequests, windowMs } = options.rateLimit;

        if (!RateLimit.check(clientIP, maxRequests, windowMs)) {
          return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
          );
        }
      }

      // CSRF protection for state-changing requests
      if (options.requireCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const csrfToken = req.headers.get('x-csrf-token');

        if (!csrfToken || !CSRFToken.validate(csrfToken)) {
          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          );
        }
      }

      // Content-Type validation for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
          return NextResponse.json(
            { error: 'Content-Type must be application/json' },
            { status: 400 }
          );
        }
      }

      // Execute the actual handler
      return await handler(req);

    } catch (error) {
      // Log the error to Sentry
      Sentry.captureException(error);

      console.error('API Error:', error);

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Input validation decorator
export function validateBody<T>(schema: any) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (req: NextRequest) {
      try {
        const body = await req.json();
        const validatedData = schema.parse(body);

        // Attach validated data to request
        (req as any).validatedBody = validatedData;

        return method.call(this, req);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid request body', details: error },
          { status: 400 }
        );
      }
    };
  };
}

// Authorization wrapper
export function requireAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    try {
      // Here you would verify the JWT token
      // For now, we'll just check if it exists
      const token = authHeader.substring(7);
      if (!token) {
        throw new Error('Invalid token');
      }

      // Attach user info to request if needed
      // (req as any).user = decodedUser;

      return await handler(req);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  };
}

// File upload security
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum 5MB allowed.'
    };
  }

  return { valid: true };
}

// SQL injection prevention patterns
export const UNSAFE_SQL_PATTERNS = [
  /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|SELECT|UNION|UPDATE)\b)|(-{2})|(\/{2})/i,
  /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i,
  /(<script|<iframe|<object|<embed)/i,
];

export function containsSQLInjection(input: string): boolean {
  return UNSAFE_SQL_PATTERNS.some(pattern => pattern.test(input));
}

// XSS prevention for user-generated content
export function sanitizeUserContent(content: string): string {
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}