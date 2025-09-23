'use client';

import { useState } from 'react';
import { usePrivacy } from '@/contexts/PrivacyContext';
import {
  X,
  Shield,
  Download,
  Trash2,
  Clock,
  Eye,
  Mail,
  Cookie,
  FileText,
  AlertTriangle,
  Check,
  Settings,
  Globe,
  Database
} from 'lucide-react';

export default function PrivacyDashboard() {
  const {
    state,
    updateCookiePreferences,
    updateDataProcessingConsent,
    updateMarketingEmailConsent,
    hidePrivacySettings,
    requestDataExport,
    requestDataDeletion,
    resetPrivacySettings
  } = usePrivacy();

  const [activeTab, setActiveTab] = useState<'overview' | 'cookies' | 'data' | 'rights'>('overview');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [customPreferences, setCustomPreferences] = useState(state.cookiePreferences);

  if (!state.showPrivacyModal) {
    return null;
  }

  const handleTogglePreference = (key: keyof typeof customPreferences) => {
    if (key === 'necessary') return; // Can't disable necessary cookies

    const updated = {
      ...customPreferences,
      [key]: !customPreferences[key]
    };
    setCustomPreferences(updated);
    updateCookiePreferences(updated);
  };

  const handleDeleteAccount = async () => {
    setShowDeleteConfirmation(false);
    await requestDataDeletion();
    hidePrivacySettings();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'cookies', label: 'Cookie Settings', icon: Cookie },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'rights', label: 'Your Rights', icon: Shield }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Privacy Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Privacy Protection Active</h3>
            <p className="text-gray-600">Your privacy settings are configured and being enforced.</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="font-semibold">
                {state.lastUpdated ? new Date(state.lastUpdated).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Cookie className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Active Cookies</p>
              <p className="font-semibold">
                {Object.values(state.cookiePreferences).filter(Boolean).length} of 4
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Email Marketing</p>
              <p className="font-semibold">
                {state.marketingEmailConsent ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Settings Summary */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Current Privacy Settings</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Cookie Consent Given:</span>
            <span className="font-medium">
              {state.consentTimestamp ? new Date(state.consentTimestamp).toLocaleString() : 'No consent'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Data Processing:</span>
            <span className={`font-medium ${state.dataProcessingConsent ? 'text-green-600' : 'text-red-600'}`}>
              {state.dataProcessingConsent ? 'Allowed' : 'Restricted'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Marketing Emails:</span>
            <span className={`font-medium ${state.marketingEmailConsent ? 'text-green-600' : 'text-red-600'}`}>
              {state.marketingEmailConsent ? 'Subscribed' : 'Unsubscribed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCookieSettings = () => (
    <div className="space-y-6">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <Cookie className="w-8 h-8 text-blue-600 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">Manage Cookie Preferences</h3>
        <p className="text-gray-600 text-sm">Control which cookies we can use to improve your experience.</p>
      </div>

      <div className="space-y-4">
        {[
          {
            key: 'necessary' as const,
            title: 'Necessary Cookies',
            description: 'Required for basic website functionality and security.',
            required: true
          },
          {
            key: 'analytics' as const,
            title: 'Analytics Cookies',
            description: 'Help us understand how you use our website.',
            required: false
          },
          {
            key: 'marketing' as const,
            title: 'Marketing Cookies',
            description: 'Used for personalized advertising and campaigns.',
            required: false
          },
          {
            key: 'social' as const,
            title: 'Social Media Cookies',
            description: 'Enable social sharing and embedded content.',
            required: false
          }
        ].map((category) => (
          <div key={category.key} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-gray-900">{category.title}</h4>
                  {category.required && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-1">{category.description}</p>
              </div>
              <button
                onClick={() => handleTogglePreference(category.key)}
                disabled={category.required}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  customPreferences[category.key]
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                } ${
                  category.required
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    customPreferences[category.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Consents */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Additional Preferences</h4>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">Data Processing Consent</h5>
              <p className="text-gray-600 text-sm">Allow us to process your data for personalized experiences.</p>
            </div>
            <button
              onClick={() => updateDataProcessingConsent(!state.dataProcessingConsent)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                state.dataProcessingConsent ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  state.dataProcessingConsent ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">Marketing Email Consent</h5>
              <p className="text-gray-600 text-sm">Receive promotional emails about new products and offers.</p>
            </div>
            <button
              onClick={() => updateMarketingEmailConsent(!state.marketingEmailConsent)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                state.marketingEmailConsent ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  state.marketingEmailConsent ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataManagement = () => (
    <div className="space-y-6">
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <Database className="w-8 h-8 text-green-600 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">Data Management</h3>
        <p className="text-gray-600 text-sm">Export, view, or delete your personal data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Data */}
        <div className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
          <div className="text-center">
            <Download className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Export Your Data</h4>
            <p className="text-gray-600 text-sm mb-4">
              Download a complete copy of your personal data in JSON format.
            </p>
            <button
              onClick={requestDataExport}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download Data
            </button>
          </div>
        </div>

        {/* Delete Data */}
        <div className="p-6 border border-gray-200 rounded-lg hover:border-red-300 transition-colors">
          <div className="text-center">
            <Trash2 className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Delete Your Data</h4>
            <p className="text-gray-600 text-sm mb-4">
              Permanently remove all your personal data from our systems.
            </p>
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={state.pendingDataDeletion}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {state.pendingDataDeletion ? 'Processing...' : 'Request Deletion'}
            </button>
          </div>
        </div>
      </div>

      {/* Data Retention Info */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Data Retention Policy</h4>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Account data: Retained while your account is active</li>
              <li>• Order history: Retained for 7 years for tax and legal compliance</li>
              <li>• Analytics data: Anonymized after 26 months</li>
              <li>• Marketing data: Deleted when you unsubscribe</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRights = () => (
    <div className="space-y-6">
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">Your Privacy Rights</h3>
        <p className="text-gray-600 text-sm">Understanding your rights under GDPR and other privacy laws.</p>
      </div>

      <div className="space-y-4">
        {[
          {
            title: 'Right to Information',
            description: 'You have the right to know what personal data we collect and how we use it.',
            icon: Eye
          },
          {
            title: 'Right of Access',
            description: 'You can request a copy of all personal data we hold about you.',
            icon: Download
          },
          {
            title: 'Right to Rectification',
            description: 'You can ask us to correct any inaccurate or incomplete personal data.',
            icon: Settings
          },
          {
            title: 'Right to Erasure',
            description: 'You can request deletion of your personal data under certain conditions.',
            icon: Trash2
          },
          {
            title: 'Right to Data Portability',
            description: 'You can request your data in a machine-readable format to transfer to another service.',
            icon: Globe
          },
          {
            title: 'Right to Object',
            description: 'You can object to processing of your personal data for certain purposes.',
            icon: X
          }
        ].map((right, index) => {
          const Icon = right.icon;
          return (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Icon className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">{right.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{right.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Contact Us</h4>
        <p className="text-gray-600 text-sm">
          If you have questions about your privacy rights or want to exercise any of these rights,
          please contact our Data Protection Officer at{' '}
          <a href="mailto:privacy@sneakervault.com" className="text-blue-600 hover:text-blue-700">
            privacy@sneakervault.com
          </a>
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Privacy Dashboard</h2>
            <button
              onClick={hidePrivacySettings}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'cookies' && renderCookieSettings()}
          {activeTab === 'data' && renderDataManagement()}
          {activeTab === 'rights' && renderRights()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Privacy settings last updated: {state.lastUpdated ? new Date(state.lastUpdated).toLocaleString() : 'Never'}
            </p>
            <button
              onClick={resetPrivacySettings}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Reset All Settings
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Data Deletion</h3>
              <p className="text-gray-600 text-sm mb-6">
                This action cannot be undone. All your personal data, including your account,
                order history, and preferences will be permanently deleted.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Everything
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}