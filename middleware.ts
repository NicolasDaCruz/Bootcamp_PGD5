import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';

// Route configurations for role-based access control
const routeConfig = {
  // Public routes - accessible to all
  public: [
    '/',
    '/products',
    '/search',
    '/about',
    '/contact',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/callback',
    '/api/products',
    '/api/test-products',
    '/showcase',
    '/brands',
  ],

  // Auth required routes - need to be logged in
  authRequired: [
    '/profile',
    '/orders',
    '/wishlist',
    '/cart/checkout',
  ],

  // Admin only routes
  adminOnly: [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/orders',
    '/admin/analytics',
    '/admin/settings',
  ],

  // Vendor routes - accessible to vendors and admins
  vendorAccess: [
    '/vendor',
    '/vendor/dashboard',
    '/vendor/products',
    '/vendor/orders',
    '/vendor/analytics',
  ],

  // Moderator routes - accessible to moderators and admins
  moderatorAccess: [
    '/moderator',
    '/moderator/dashboard',
    '/moderator/content',
    '/moderator/reviews',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create initial response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Skip authentication for public routes - PERFORMANCE OPTIMIZATION
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Only create Supabase client for protected routes
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const { data: { session }, error } = await supabase.auth.getSession();

  // Handle auth errors
  if (error) {
    console.error('Middleware auth error:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Check if user is authenticated for routes that require auth
  if (requiresAuth(pathname)) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Get user profile for role-based checks
  let userRole: string | null = null;
  if (session?.user) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      userRole = profile?.role || null;
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  // Role-based access control
  if (isAdminOnlyRoute(pathname)) {
    if (!session?.user || userRole !== 'admin') {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }
  }

  if (isVendorRoute(pathname)) {
    if (!session?.user || !['vendor', 'admin'].includes(userRole || '')) {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }
  }

  if (isModeratorRoute(pathname)) {
    if (!session?.user || !['moderator', 'admin'].includes(userRole || '')) {
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
    }
  }

  return response;
}

// Helper functions
function isPublicRoute(pathname: string): boolean {
  return routeConfig.public.some(route => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  });
}

function requiresAuth(pathname: string): boolean {
  return routeConfig.authRequired.some(route => pathname.startsWith(route)) ||
         isAdminOnlyRoute(pathname) ||
         isVendorRoute(pathname) ||
         isModeratorRoute(pathname);
}

function isAdminOnlyRoute(pathname: string): boolean {
  return routeConfig.adminOnly.some(route => pathname.startsWith(route));
}

function isVendorRoute(pathname: string): boolean {
  return routeConfig.vendorAccess.some(route => pathname.startsWith(route));
}

function isModeratorRoute(pathname: string): boolean {
  return routeConfig.moderatorAccess.some(route => pathname.startsWith(route));
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};