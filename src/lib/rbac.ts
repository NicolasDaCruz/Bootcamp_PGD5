import type { UserRole } from '@/types/auth';

// Permission definitions
export const PERMISSIONS = {
  // User management
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  // Product management
  PRODUCTS_READ: 'products:read',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_MODERATE: 'products:moderate',

  // Order management
  ORDERS_READ: 'orders:read',
  ORDERS_READ_ALL: 'orders:read_all',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_CREATE: 'orders:create',
  ORDERS_DELETE: 'orders:delete',

  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_READ_ALL: 'analytics:read_all',

  // Content management
  CONTENT_MODERATE: 'content:moderate',
  REVIEWS_MODERATE: 'reviews:moderate',

  // System settings
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_READ: 'settings:read',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permission matrix
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  customer: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_CREATE,
  ],

  vendor: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ANALYTICS_READ,
  ],

  vendeur: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ANALYTICS_READ,
  ],

  moderator: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_MODERATE,
    PERMISSIONS.ORDERS_READ_ALL,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.CONTENT_MODERATE,
    PERMISSIONS.REVIEWS_MODERATE,
    PERMISSIONS.ANALYTICS_READ_ALL,
  ],

  admin: [
    // Admins have all permissions
    ...Object.values(PERMISSIONS),
  ],
};

// RBAC utility functions
export class RBAC {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
  }

  /**
   * Check if a role has any of the specified permissions
   */
  static hasAnyPermission(role: UserRole | null | undefined, permissions: Permission[]): boolean {
    if (!role) return false;
    return permissions.some(permission => this.hasPermission(role, permission));
  }

  /**
   * Check if a role has all of the specified permissions
   */
  static hasAllPermissions(role: UserRole | null | undefined, permissions: Permission[]): boolean {
    if (!role) return false;
    return permissions.every(permission => this.hasPermission(role, permission));
  }

  /**
   * Get all permissions for a role
   */
  static getPermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if user can manage products (vendor or admin)
   */
  static canManageProducts(role: UserRole | null | undefined): boolean {
    return this.hasPermission(role, PERMISSIONS.PRODUCTS_CREATE) ||
           this.hasPermission(role, PERMISSIONS.PRODUCTS_UPDATE);
  }

  /**
   * Check if user can moderate content (moderator or admin)
   */
  static canModerateContent(role: UserRole | null | undefined): boolean {
    return this.hasPermission(role, PERMISSIONS.CONTENT_MODERATE);
  }

  /**
   * Check if user can view all analytics (admin or moderator)
   */
  static canViewAllAnalytics(role: UserRole | null | undefined): boolean {
    return this.hasPermission(role, PERMISSIONS.ANALYTICS_READ_ALL);
  }

  /**
   * Check if user can manage all orders (admin or moderator)
   */
  static canManageAllOrders(role: UserRole | null | undefined): boolean {
    return this.hasPermission(role, PERMISSIONS.ORDERS_READ_ALL);
  }

  /**
   * Check if user can access admin panel
   */
  static canAccessAdminPanel(role: UserRole | null | undefined): boolean {
    return role === 'admin';
  }

  /**
   * Check if user can access vendor panel
   */
  static canAccessVendorPanel(role: UserRole | null | undefined): boolean {
    return role === 'vendeur' || role === 'vendor' || role === 'admin';
  }

  /**
   * Check if user can access moderator panel
   */
  static canAccessModeratorPanel(role: UserRole | null | undefined): boolean {
    return role === 'moderator' || role === 'admin';
  }

  /**
   * Check if user can access any dashboard
   */
  static canAccessDashboard(role: UserRole | null | undefined): boolean {
    return this.canAccessAdminPanel(role) ||
           this.canAccessVendorPanel(role) ||
           this.canAccessModeratorPanel(role);
  }

  /**
   * Get the appropriate dashboard route for a user role
   */
  static getDashboardRoute(role: UserRole | null | undefined): string | null {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'vendeur' || role === 'vendor') return '/vendor/dashboard';
    if (role === 'moderator') return '/moderator/dashboard';
    return null;
  }

  /**
   * Check if a user owns a resource (for resource-specific access control)
   */
  static ownsResource(userId: string, resourceOwnerId: string): boolean {
    return userId === resourceOwnerId;
  }

  /**
   * Check if user can access a resource based on role and ownership
   */
  static canAccessResource(
    role: UserRole | null | undefined,
    permission: Permission,
    userId?: string,
    resourceOwnerId?: string
  ): boolean {
    // Check role-based permission first
    if (this.hasPermission(role, permission)) return true;

    // Check ownership if resource has an owner
    if (userId && resourceOwnerId) {
      return this.ownsResource(userId, resourceOwnerId);
    }

    return false;
  }
}

// Route access control helpers
export const RouteAccess = {
  /**
   * Check if user can access a specific route
   */
  canAccessRoute(role: UserRole | null | undefined, route: string): boolean {
    // Admin routes
    if (route.startsWith('/admin')) {
      return RBAC.canAccessAdminPanel(role);
    }

    // Vendor routes
    if (route.startsWith('/vendor')) {
      return RBAC.canAccessVendorPanel(role);
    }

    // Moderator routes
    if (route.startsWith('/moderator')) {
      return RBAC.canAccessModeratorPanel(role);
    }

    // Protected user routes
    const protectedRoutes = ['/profile', '/orders', '/wishlist'];
    if (protectedRoutes.some(protectedRoute => route.startsWith(protectedRoute))) {
      return role !== null && role !== undefined;
    }

    // Public routes (default allow)
    return true;
  },

  /**
   * Get redirect URL for unauthorized access
   */
  getUnauthorizedRedirect(role: UserRole | null | undefined, requestedRoute: string): string {
    if (!role) {
      return `/auth/login?redirect=${encodeURIComponent(requestedRoute)}`;
    }

    // If user is authenticated but doesn't have access, redirect to appropriate dashboard or home
    const dashboardRoute = RBAC.getDashboardRoute(role);
    return dashboardRoute || '/';
  },
};

// Resource ownership patterns for different entities
export const ResourceOwnership = {
  /**
   * Check if user can access their own orders
   */
  canAccessOrder(userId: string, orderUserId: string, userRole: UserRole): boolean {
    return RBAC.canManageAllOrders(userRole) || RBAC.ownsResource(userId, orderUserId);
  },

  /**
   * Check if user can access product data (vendor can access their products)
   */
  canAccessProduct(userId: string, productVendorId: string | null, userRole: UserRole): boolean {
    // Admins and moderators can access all products
    if (userRole === 'admin' || userRole === 'moderator') return true;

    // Vendors can access their own products
    if ((userRole === 'vendeur' || userRole === 'vendor') && productVendorId) {
      return RBAC.ownsResource(userId, productVendorId);
    }

    // Everyone can read products
    return RBAC.hasPermission(userRole, PERMISSIONS.PRODUCTS_READ);
  },

  /**
   * Check if user can access analytics data
   */
  canAccessAnalytics(userId: string, dataOwnerId: string | null, userRole: UserRole): boolean {
    // Admins and moderators can access all analytics
    if (RBAC.canViewAllAnalytics(userRole)) return true;

    // Vendors can access their own analytics
    if ((userRole === 'vendeur' || userRole === 'vendor') && dataOwnerId) {
      return RBAC.ownsResource(userId, dataOwnerId);
    }

    return false;
  },
};