'use client';

import { useProfile } from '@/hooks/useAuth';
import { RBAC } from '@/lib/rbac';
import type { UserRole } from '@/types/auth';
import type { Permission } from '@/lib/rbac';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: Permission | Permission[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL permissions (default: false - ANY permission)
  allowOwnership?: boolean;
  resourceOwnerId?: string;
  userId?: string;
}

/**
 * Component that conditionally renders content based on user permissions
 */
export function PermissionGuard({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
  requireAll = false,
  allowOwnership = false,
  resourceOwnerId,
  userId,
}: PermissionGuardProps) {
  const profile = useProfile();

  // Helper function to check role access
  const hasRoleAccess = () => {
    if (!requiredRole) return true;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(profile?.role as UserRole);
  };

  // Helper function to check permission access
  const hasPermissionAccess = () => {
    if (!requiredPermission) return true;

    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

    if (requireAll) {
      return RBAC.hasAllPermissions(profile?.role, permissions);
    } else {
      return RBAC.hasAnyPermission(profile?.role, permissions);
    }
  };

  // Helper function to check ownership access
  const hasOwnershipAccess = () => {
    if (!allowOwnership || !resourceOwnerId || !userId) return false;
    return RBAC.ownsResource(userId, resourceOwnerId);
  };

  // Determine if user has access
  const roleAccess = hasRoleAccess();
  const permissionAccess = hasPermissionAccess();
  const ownershipAccess = hasOwnershipAccess();

  // User has access if they meet role/permission requirements OR have ownership (if allowed)
  const hasAccess = (roleAccess && permissionAccess) || (allowOwnership && ownershipAccess);

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Admin-only permission guard
 */
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard requiredRole="admin" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Vendor permission guard (vendors and admins)
 */
export function VendorOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard requiredRole={['vendor', 'admin']} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Moderator permission guard (moderators and admins)
 */
export function ModeratorOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard requiredRole={['moderator', 'admin']} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Customer permission guard (authenticated users only)
 */
export function AuthenticatedOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard requiredRole={['customer', 'vendor', 'moderator', 'admin']} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Permission-based button wrapper
 */
interface PermissionButtonProps extends PermissionGuardProps {
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export function PermissionButton({
  children,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...guardProps
}: PermissionButtonProps) {
  return (
    <PermissionGuard {...guardProps}>
      <button
        type={type}
        className={className}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
    </PermissionGuard>
  );
}

/**
 * Permission-based link wrapper
 */
interface PermissionLinkProps extends PermissionGuardProps {
  href: string;
  className?: string;
}

export function PermissionLink({
  children,
  href,
  className = '',
  ...guardProps
}: PermissionLinkProps) {
  return (
    <PermissionGuard {...guardProps}>
      <a href={href} className={className}>
        {children}
      </a>
    </PermissionGuard>
  );
}

/**
 * Role badge component
 */
export function RoleBadge({ className = '' }: { className?: string }) {
  const profile = useProfile();

  if (!profile?.role) return null;

  const roleColors = {
    customer: 'bg-blue-100 text-blue-800',
    vendor: 'bg-green-100 text-green-800',
    moderator: 'bg-yellow-100 text-yellow-800',
    admin: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[profile.role]} ${className}`}>
      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
    </span>
  );
}

/**
 * Conditional navigation menu items
 */
interface ConditionalMenuItemProps extends Omit<PermissionGuardProps, 'children'> {
  href: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ConditionalMenuItem({
  href,
  label,
  icon,
  className = '',
  ...guardProps
}: ConditionalMenuItemProps) {
  return (
    <PermissionGuard {...guardProps}>
      <a href={href} className={className}>
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </a>
    </PermissionGuard>
  );
}