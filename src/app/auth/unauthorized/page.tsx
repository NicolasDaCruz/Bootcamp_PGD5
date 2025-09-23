'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useProfile } from '@/hooks/useAuth';
import { RBAC } from '@/lib/rbac';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const profile = useProfile();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // Get the appropriate dashboard link for the user's role
  const getDashboardLink = () => {
    const dashboardRoute = RBAC.getDashboardRoute(profile?.role);
    return dashboardRoute || '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Lock Icon */}
          <div className="mx-auto h-16 w-16 text-red-500 mb-4">
            <svg
              className="h-full w-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this page.
          </p>

          {profile?.role && (
            <div className="mt-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Current Role: {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <Link
                href={getDashboardLink()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {profile?.role && RBAC.canAccessDashboard(profile.role)
                  ? 'Go to Dashboard'
                  : 'Go to Home'}
              </Link>
            </div>

            <div>
              <button
                onClick={() => router.back()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go Back
              </button>
            </div>
          </div>

          {/* Role-specific messages */}
          <div className="mt-6 text-xs text-gray-500">
            {profile?.role === 'customer' && (
              <p>
                Customers can access their profile, orders, and shopping features.
              </p>
            )}
            {(profile?.role === 'vendeur' || profile?.role === 'vendor') && (
              <p>
                Vendors can manage their products and view their analytics in the vendor dashboard.
              </p>
            )}
            {profile?.role === 'moderator' && (
              <p>
                Moderators can review content and manage user-generated content.
              </p>
            )}
            {profile?.role === 'admin' && (
              <p>
                If you're seeing this as an admin, there might be a technical issue. Please contact support.
              </p>
            )}
          </div>

          {/* Contact information */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Need access to additional features?{' '}
              <Link href="/contact" className="text-blue-600 hover:text-blue-500">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}