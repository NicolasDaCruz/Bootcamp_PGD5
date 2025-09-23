import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimit } from '@/lib/security';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get client IP for rate limiting
  const clientIP = request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const isAllowed = RateLimit.check(clientIP, 100, 60000); // 100 requests per minute

    if (!isAllowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
        }
      });
    }
  }

  // Stricter rate limiting for authentication endpoints
  if (request.nextUrl.pathname.includes('/auth') ||
      request.nextUrl.pathname.includes('/login') ||
      request.nextUrl.pathname.includes('/register')) {
    const isAllowed = RateLimit.check(`auth-${clientIP}`, 10, 60000); // 10 requests per minute

    if (!isAllowed) {
      return new NextResponse('Too Many Authentication Requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
        }
      });
    }
  }

  // Block requests with suspicious patterns
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /curl/i,
    /wget/i,
    /bot/i,
    /crawler/i,
    /scanner/i,
    /sqlmap/i,
    /nikto/i,
  ];

  // Allow legitimate bots (Google, Bing, etc.)
  const legitimateBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent)) &&
                     !legitimateBots.some(pattern => pattern.test(userAgent));

  if (isSuspicious && !request.nextUrl.pathname.startsWith('/api/')) {
    console.warn(`Suspicious request blocked: ${userAgent} from ${clientIP}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Check for common attack patterns in URL
  const url = request.nextUrl.pathname;
  const attackPatterns = [
    /\.\./,        // Directory traversal
    /<script/i,    // XSS attempts
    /union.*select/i, // SQL injection
    /exec\(/i,     // Code injection
    /eval\(/i,     // Code injection
    /javascript:/i, // JavaScript protocol
    /vbscript:/i,  // VBScript protocol
    /data:/i,      // Data URLs
  ];

  if (attackPatterns.some(pattern => pattern.test(url))) {
    console.warn(`Attack pattern detected in URL: ${url} from ${clientIP}`);
    return new NextResponse('Bad Request', { status: 400 });
  }

  // Set security headers
  response.headers.set('X-Request-ID', crypto.randomUUID());
  response.headers.set('X-Timestamp', new Date().toISOString());

  // CSRF protection for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token');
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    // Check if request is from same origin
    if (origin && host && !origin.includes(host)) {
      console.warn(`CSRF attempt detected: origin ${origin} vs host ${host}`);
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};