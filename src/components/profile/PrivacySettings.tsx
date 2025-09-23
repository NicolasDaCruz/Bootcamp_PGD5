'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface PrivacyPreferences {
  dataProcessing: boolean;
  marketingEmails: boolean;
  smsUpdates: boolean;
  analytics: boolean;
  thirdPartySharing: boolean;
  profileVisibility: 'public' | 'private' | 'friends';
}

export function PrivacySettings() {
  const { updateProfile } = useAuth();
  const user = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    dataProcessing: true,
    marketingEmails: false,
    smsUpdates: false,
    analytics: true,
    thirdPartySharing: false,
    profileVisibility: 'private',
  });

  const handleSavePreferences = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await updateProfile({
        privacy_preferences: preferences,
      } as any);

      if (error) {
        throw new Error(error);
      }

      setSuccess('Privacy preferences updated successfully');
    } catch (error: any) {
      console.error('Error updating privacy preferences:', error);
      setError(error.message || 'Failed to update privacy preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    setExportingData(true);
    setError(null);

    try {
      // Gather user data from various tables
      const [profileData, ordersData, addressesData] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('orders').select('*').eq('user_id', user.id),
        supabase.from('user_addresses').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        profile: profileData.data,
        orders: ordersData.data || [],
        addresses: addressesData.data || [],
        exportDate: new Date().toISOString(),
        exportType: 'GDPR_DATA_EXPORT',
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('Data export completed successfully');
    } catch (error: any) {
      console.error('Error exporting data:', error);
      setError('Failed to export data');
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmation = prompt(
      'Are you sure you want to delete your account? This action cannot be undone. Type "DELETE" to confirm:'
    );

    if (confirmation !== 'DELETE') {
      return;
    }

    setDeletingAccount(true);
    setError(null);

    try {
      // Note: In a real application, you would call a secure server endpoint
      // that handles account deletion properly, including data cleanup
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) {
        throw error;
      }

      // Redirect to home page after account deletion
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account. Please contact support.');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy Settings</h2>
          <p className="text-gray-600">
            Manage your privacy preferences and data rights
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Data Processing Preferences */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Data Processing Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="data-processing"
                  type="checkbox"
                  checked={preferences.dataProcessing}
                  onChange={(e) => setPreferences({ ...preferences, dataProcessing: e.target.checked })}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="data-processing" className="font-medium text-gray-700">
                  Allow data processing for service improvement
                </label>
                <p className="text-gray-500">
                  We process your data to improve our services, personalize your experience, and provide customer support.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="analytics"
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="analytics" className="font-medium text-gray-700">
                  Allow analytics and performance tracking
                </label>
                <p className="text-gray-500">
                  Help us understand how you use our platform to improve performance and user experience.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="third-party-sharing"
                  type="checkbox"
                  checked={preferences.thirdPartySharing}
                  onChange={(e) => setPreferences({ ...preferences, thirdPartySharing: e.target.checked })}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="third-party-sharing" className="font-medium text-gray-700">
                  Allow sharing with trusted partners
                </label>
                <p className="text-gray-500">
                  Share data with select partners to provide enhanced services and exclusive offers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Communication Preferences */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="marketing-emails"
                  type="checkbox"
                  checked={preferences.marketingEmails}
                  onChange={(e) => setPreferences({ ...preferences, marketingEmails: e.target.checked })}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="marketing-emails" className="font-medium text-gray-700">
                  Receive marketing emails
                </label>
                <p className="text-gray-500">
                  Get updates about new products, sales, and exclusive offers via email.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="sms-updates"
                  type="checkbox"
                  checked={preferences.smsUpdates}
                  onChange={(e) => setPreferences({ ...preferences, smsUpdates: e.target.checked })}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="sms-updates" className="font-medium text-gray-700">
                  Receive SMS updates
                </label>
                <p className="text-gray-500">
                  Get important order updates and promotional messages via SMS.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Visibility */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Visibility</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                id="visibility-public"
                name="profile-visibility"
                type="radio"
                checked={preferences.profileVisibility === 'public'}
                onChange={() => setPreferences({ ...preferences, profileVisibility: 'public' })}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
              />
              <label htmlFor="visibility-public" className="ml-3 block text-sm font-medium text-gray-700">
                Public - Anyone can see your profile
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="visibility-friends"
                name="profile-visibility"
                type="radio"
                checked={preferences.profileVisibility === 'friends'}
                onChange={() => setPreferences({ ...preferences, profileVisibility: 'friends' })}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
              />
              <label htmlFor="visibility-friends" className="ml-3 block text-sm font-medium text-gray-700">
                Friends only - Only people you follow can see your profile
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="visibility-private"
                name="profile-visibility"
                type="radio"
                checked={preferences.profileVisibility === 'private'}
                onChange={() => setPreferences({ ...preferences, profileVisibility: 'private' })}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
              />
              <label htmlFor="visibility-private" className="ml-3 block text-sm font-medium text-gray-700">
                Private - Your profile is not visible to others
              </label>
            </div>
          </div>
        </div>

        {/* Save Preferences Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSavePreferences}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>

        {/* Data Rights Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-4">Your Data Rights (GDPR)</h3>
          <p className="text-sm text-yellow-700 mb-4">
            You have the right to access, rectify, erase, and port your personal data.
            You can also object to processing and request processing restriction.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleExportData}
              disabled={exportingData}
              className="inline-flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportingData ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export My Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-4">Danger Zone</h3>
          <p className="text-sm text-red-700 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deletingAccount ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting Account...
              </>
            ) : (
              'Delete Account'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}