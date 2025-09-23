'use client';

import { useState } from 'react';
import { useAuth, useProfile } from '@/hooks/useAuth';
import { AuthenticatedOnly } from '@/components/auth/PermissionGuard';
import { ProfileOverview } from '@/components/profile/ProfileOverview';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { AddressManagement } from '@/components/profile/AddressManagement';
import { LoyaltyDashboard } from '@/components/profile/LoyaltyDashboard';
import { PrivacySettings } from '@/components/profile/PrivacySettings';
import { AccountSettings } from '@/components/profile/AccountSettings';

type ProfileTab = 'overview' | 'avatar' | 'addresses' | 'loyalty' | 'privacy' | 'account';

export default function ProfilePage() {
  const { isLoading } = useAuth();
  const profile = useProfile();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs: Array<{ id: ProfileTab; name: string; icon: string }> = [
    { id: 'overview', name: 'Overview', icon: '👤' },
    { id: 'avatar', name: 'Avatar', icon: '📷' },
    { id: 'addresses', name: 'Addresses', icon: '📍' },
    { id: 'loyalty', name: 'Loyalty', icon: '⭐' },
    { id: 'privacy', name: 'Privacy', icon: '🔒' },
    { id: 'account', name: 'Account', icon: '⚙️' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ProfileOverview />;
      case 'avatar':
        return <AvatarUpload />;
      case 'addresses':
        return <AddressManagement />;
      case 'loyalty':
        return <LoyaltyDashboard />;
      case 'privacy':
        return <PrivacySettings />;
      case 'account':
        return <AccountSettings />;
      default:
        return <ProfileOverview />;
    }
  };

  return (
    <AuthenticatedOnly>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="mt-2 text-gray-600">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Profile Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* User Info */}
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b">
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || 'Avatar'}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-medium text-gray-700">
                        {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                      </span>
                    )}
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

                {/* Navigation Tabs */}
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-3">{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedOnly>
  );
}