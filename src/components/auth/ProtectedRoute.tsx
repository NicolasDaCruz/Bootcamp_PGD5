'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useProfile } from '@/hooks/useAuth';
import { RBAC, RouteAccess } from '@/lib/rbac';
import type { UserRole } from '@/types/auth';
import type { Permission } from '@/lib/rbac';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: Permission | Permission[];
  fallback?: React.ReactNode;
  redirectTo?: string;
  allowOwnership?: boolean; // Allow access if user owns the resource
  resourceOwnerId?: string; // ID of the resource owner for ownership checks
}

/**
 * Component that protects routes based on user authentication, roles, and permissions
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  redirectTo,
  allowOwnership = false,
  resourceOwnerId,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();
  const user = useUser();
  const profile = useProfile();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait for auth to initialize
    if (isLoading) {
      setHasAccess(null);
      return;
    }

    // Check authentication
    if (!isAuthenticated || !user) {
      const loginUrl = redirectTo || `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      router.push(loginUrl);
      return;
    }

    // Check role-based access
    let roleAccess = true;
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      roleAccess = roles.includes(profile?.role as UserRole);
    }

    // Check permission-based access
    let permissionAccess = true;
    if (requiredPermission) {
      const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
      permissionAccess = RBAC.hasAnyPermission(profile?.role, permissions);
    }

    // Check ownership-based access
    let ownershipAccess = true;
    if (allowOwnership && resourceOwnerId && !roleAccess && !permissionAccess) {
      ownershipAccess = RBAC.ownsResource(user.id, resourceOwnerId);
    }

    const finalAccess = roleAccess || permissionAccess || (allowOwnership && ownershipAccess);

    if (!finalAccess) {
      const unauthorizedUrl = redirectTo || RouteAccess.getUnauthorizedRedirect(profile?.role, window.location.pathname);
      router.push(unauthorizedUrl);
      return;
    }

    setHasAccess(true);
  }, [isLoading, isAuthenticated, user, profile, requiredRole, requiredPermission, allowOwnership, resourceOwnerId, redirectTo, router]);

  // Show loading state
  if (isLoading || hasAccess === null) {
    return fallback || <ProtectedRouteLoading />;
  }

  // Show content if user has access
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback while redirecting
  return fallback || <ProtectedRouteLoading />;
}

/**
 * HOC that wraps a component with route protection
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  protection: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...protection}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Admin-only route protection
 */
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="admin" {...props}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Vendor route protection (vendors and admins)
 */
export function VendorRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole={['vendor', 'admin']} {...props}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Moderator route protection (moderators and admins)
 */
export function ModeratorRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole={['moderator', 'admin']} {...props}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Dashboard route protection (any role with dashboard access)
 */
export function DashboardRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole={['admin', 'vendor', 'moderator']} {...props}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Default loading component for protected routes
 */
function ProtectedRouteLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}