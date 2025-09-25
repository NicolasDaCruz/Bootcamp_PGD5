'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Shield,
  Activity,
  Download,
  Trash2,
  Settings,
  Bell,
  CreditCard,
  MapPin,
  ShoppingBag,
  Heart,
  LogOut,
  Cookie,
  Database,
  Mail,
  Palette,
  Globe,
  Clock,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Lock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { activityLogger, logLogout } from '@/lib/activity-logger';
import type { User as UserType, UserActivityLog, UserPreferences } from '@/types/database';

interface TabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

const tabs: TabProps[] = [
  { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
  { id: 'privacy', label: 'Privacy & Data', icon: <Shield className="w-4 h-4" /> },
  { id: 'activity', label: 'Activity Log', icon: <Activity className="w-4 h-4" /> },
  { id: 'preferences', label: 'Preferences', icon: <Settings className="w-4 h-4" /> },
  { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'addresses', label: 'Addresses', icon: <MapPin className="w-4 h-4" /> },
  { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> }
];

export default function AccountPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showActivityDetails, setShowActivityDetails] = useState<string | null>(null);
  const [clearingCache, setClearingCache] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const router = useRouter();
  const privacy = usePrivacy();

  useEffect(() => {
    const getAccountData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/auth/login');
          return;
        }

        // Get user profile
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        // Get user preferences
        const { data: prefsData } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        // Get recent activity logs
        const { data: logsData } = await activityLogger.getUserActivityLogs(authUser.id, {
          limit: 50
        });

        setUser(userData);
        setUserPreferences(prefsData);
        setActivityLogs(logsData.data || []);
        setLoading(false);

        // Log page view
        await activityLogger.logActivity('profile_view', {
          page: 'account_dashboard',
          tab: activeTab
        });
      } catch (error) {
        console.error('Error loading account data:', error);
        setLoading(false);
      }
    };

    getAccountData();
  }, [router, activeTab]);

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      // Clear browser cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear localStorage items
      const localStorageKeys = [
        'sneaker-store-cart',
        'sneaker-store-wishlist',
        'sneaker-store-recent-searches',
        'sneaker-store-preferences'
      ];
      localStorageKeys.forEach(key => localStorage.removeItem(key));

      // Log the action
      await activityLogger.logCacheClear({
        cleared_items: ['browser_cache', 'local_storage'],
        timestamp: new Date().toISOString()
      });

      alert('Cache cleared successfully!');
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Failed to clear cache. Please try again.');
    } finally {
      setClearingCache(false);
    }
  };

  const handleDataExport = async () => {
    setExportingData(true);
    try {
      await privacy.requestDataExport();
      await activityLogger.logDataExportRequest({
        export_type: 'full_account_data',
        requested_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExportingData(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setDeletingAccount(true);
    try {
      await privacy.requestDataDeletion();
      await activityLogger.logDataDeletionRequest({
        deletion_type: 'full_account',
        requested_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to process account deletion. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    await logLogout({
      logout_method: 'manual',
      session_duration: 'unknown'
    });
    await supabase.auth.signOut();
    router.push('/');
  };

  const formatActivityAction = (action: string) => {
    return action.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getActivityIcon = (action: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      login: <LogOut className="w-4 h-4 text-green-600" />,
      logout: <LogOut className="w-4 h-4 text-red-600" />,
      profile_update: <User className="w-4 h-4 text-blue-600" />,
      order_create: <ShoppingBag className="w-4 h-4 text-purple-600" />,
      privacy_settings_update: <Shield className="w-4 h-4 text-orange-600" />,
      data_export_request: <Download className="w-4 h-4 text-teal-600" />,
      cache_clear: <RefreshCw className="w-4 h-4 text-gray-600" />
    };
    return iconMap[action] || <Activity className="w-4 h-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Account Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your account, privacy settings, and view your activity
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.count && (
                    <span className="bg-gray-100 text-gray-900 ml-2 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Profile Summary */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                      <div className="flex items-center space-x-4">
                        <div className="bg-white/20 rounded-full p-3">
                          <User className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{user.full_name || 'User'}</h3>
                          <p className="text-blue-100">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Loyalty Points */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-100 dark:bg-green-800 rounded-full p-3">
                          <Shield className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user.loyalty_points || 0}
                          </h3>
                          <p className="text-green-600">Loyalty Points</p>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-orange-100 dark:bg-orange-800 rounded-full p-3">
                          <Activity className="w-8 h-8 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {activityLogs.length}
                          </h3>
                          <p className="text-orange-600">Recent Activities</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/orders" className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Orders</h4>
                          <p className="text-sm text-gray-500">View order history</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                      </div>
                    </Link>

                    <button
                      onClick={() => setActiveTab('privacy')}
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <Shield className="w-6 h-6 text-green-600" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Privacy</h4>
                          <p className="text-sm text-gray-500">Manage data & privacy</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('preferences')}
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <Settings className="w-6 h-6 text-purple-600" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Settings</h4>
                          <p className="text-sm text-gray-500">Update preferences</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('security')}
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <Lock className="w-6 h-6 text-red-600" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Security</h4>
                          <p className="text-sm text-gray-500">Password & 2FA</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-6 h-6 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">GDPR Compliance</h3>
                        <p className="text-blue-700 dark:text-blue-200 text-sm">
                          You have full control over your personal data. Exercise your rights below.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cookie Preferences */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Cookie className="w-6 h-6 text-yellow-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cookie Preferences</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Necessary</span>
                          <span className="text-green-600 text-sm">Always On</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Analytics</span>
                          <span className={`text-sm ${privacy.state.cookiePreferences.analytics ? 'text-green-600' : 'text-red-600'}`}>
                            {privacy.state.cookiePreferences.analytics ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Marketing</span>
                          <span className={`text-sm ${privacy.state.cookiePreferences.marketing ? 'text-green-600' : 'text-red-600'}`}>
                            {privacy.state.cookiePreferences.marketing ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={privacy.showPrivacySettings}
                        className="mt-4 w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                      >
                        Update Cookie Settings
                      </button>
                    </div>

                    {/* Data Export */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Download className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Your Data</h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        Download a copy of all your personal data stored in our system.
                      </p>
                      <button
                        onClick={handleDataExport}
                        disabled={exportingData}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                      >
                        {exportingData ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Export Data
                          </>
                        )}
                      </button>
                    </div>

                    {/* Cache Management */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <RefreshCw className="w-6 h-6 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Clear Cache</h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        Clear stored data from your browser including cart and preferences.
                      </p>
                      <button
                        onClick={handleClearCache}
                        disabled={clearingCache}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                      >
                        {clearingCache ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Clearing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Clear Cache
                          </>
                        )}
                      </button>
                    </div>

                    {/* Account Deletion */}
                    <div className="border border-red-200 dark:border-red-700 rounded-lg p-6 bg-red-50 dark:bg-red-900/10">
                      <div className="flex items-center space-x-3 mb-4">
                        <Trash2 className="w-6 h-6 text-red-600" />
                        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Delete Account</h3>
                      </div>
                      <p className="text-red-700 dark:text-red-300 text-sm mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button
                        onClick={handleAccountDeletion}
                        disabled={deletingAccount}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                      >
                        {deletingAccount ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Activity</h3>
                    <span className="text-sm text-gray-500">Last 50 activities</span>
                  </div>

                  <div className="space-y-2">
                    {activityLogs.length > 0 ? (
                      activityLogs.map((log) => (
                        <div
                          key={log.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getActivityIcon(log.action)}
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {formatActivityAction(log.action)}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {new Date(log.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowActivityDetails(
                                showActivityDetails === log.id ? null : log.id
                              )}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {showActivityDetails === log.id ?
                                <EyeOff className="w-4 h-4" /> :
                                <Eye className="w-4 h-4" />
                              }
                            </button>
                          </div>

                          <AnimatePresence>
                            {showActivityDetails === log.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                              >
                                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No activity logs found</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Other tabs content would go here... */}
              {['preferences', 'orders', 'addresses', 'security'].includes(activeTab) && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-8"
                >
                  <div className="text-gray-500">
                    <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                    <p>The {activeTab} section is under development.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}