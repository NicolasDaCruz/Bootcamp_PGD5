import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
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

  // Create a Supabase client configured to use cookies
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req: request, res });

  // Refresh session if expired - required for Server Components
  const { data: { session }, error } = await supabase.auth.getSession();

  // Handle auth errors
  if (error) {
    console.error('Middleware auth error:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Check if route is public
  if (isPublicRoute(pathname)) {
    return res;
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

  return res;
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