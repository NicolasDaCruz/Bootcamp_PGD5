'use client';

import { useProfile } from '@/hooks/useAuth';
import { ConditionalMenuItem, RoleBadge } from '@/components/auth/PermissionGuard';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const profile = useProfile();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <h1 className="text-lg font-semibold text-gray-900">
              Dashboard
            </h1>
            {profile && <RoleBadge />}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {/* Admin Navigation */}
            <ConditionalMenuItem
              href="/admin/dashboard"
              label="Admin Dashboard"
              requiredRole="admin"
              className="text-gray-900 hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            />

            <ConditionalMenuItem
              href="/admin/users"
              label="User Management"
              requiredRole="admin"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            />

            <ConditionalMenuItem
              href="/admin/analytics"
              label="System Analytics"
              requiredRole="admin"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            />

            <ConditionalMenuItem
              href="/admin/settings"
              label="System Settings"
              requiredRole="admin"
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            />

            {/* Vendor Navigation */}
            <ConditionalMenuItem
              href="/vendor/dashboard"
              label="Vendor Dashboard"
              requiredRole={['vendor', 'admin']}
              className="text-gray-900 hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            />

            <ConditionalMenuItem
              href="/vendor/products"
              label="My Products"
              requiredRole={['vendor', 'admin']}
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            />

            <ConditionalMenuItem
              href="/vendor/orders"
              label="My Orders"
              requiredRole={['vendor', 'admin']}
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            />

            <ConditionalMenuItem
              href="/vendor/analytics"
              label="My Analytics"
              requiredRole={['vendor', 'admin']}
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            />

            {/* Moderator Navigation */}
            <ConditionalMenuItem
              href="/moderator/dashboard"
              label="Moderator Dashboard"
              requiredRole={['moderator', 'admin']}
              className="text-gray-900 hover:bg-gray-50 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            />

            <ConditionalMenuItem
              href="/moderator/content"
              label="Content Moderation"
              requiredRole={['moderator', 'admin']}
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            />

            <ConditionalMenuItem
              href="/moderator/reviews"
              label="Review Moderation"
              requiredRole={['moderator', 'admin']}
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            />

            {/* Shared Navigation */}
            <div className="border-t pt-4 mt-4">
              <ConditionalMenuItem
                href="/orders"
                label="All Orders"
                requiredRole={['admin', 'moderator']}
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              />

              <ConditionalMenuItem
                href="/profile"
                label="My Profile"
                requiredRole={['customer', 'vendor', 'moderator', 'admin']}
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              />
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {profile?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Dashboard page wrapper that includes layout and role verification
 */
interface DashboardPageProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function DashboardPage({ children, title, description }: DashboardPageProps) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {(title || description) && (
          <div>
            {title && (
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-2 text-sm text-gray-700">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </DashboardLayout>
  );
}