'use client';

import { useState } from 'react';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { X, Settings, Shield, BarChart3, Target, Share2, Check, ExternalLink } from 'lucide-react';

export default function CookieConsentBanner() {
  const {
    state,
    acceptAllCookies,
    rejectNonEssentialCookies,
    updateCookiePreferences,
    showPrivacySettings,
    shouldShowCookieBanner
  } = usePrivacy();

  const [showDetails, setShowDetails] = useState(false);
  const [customPreferences, setCustomPreferences] = useState(state.cookiePreferences);

  if (!shouldShowCookieBanner() || !state.isInitialized) {
    return null;
  }

  const handleCustomSave = () => {
    updateCookiePreferences(customPreferences);
  };

  const handleTogglePreference = (key: keyof typeof customPreferences) => {
    if (key === 'necessary') return; // Can't disable necessary cookies

    setCustomPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const cookieCategories = [
    {
      key: 'necessary' as const,
      title: 'Necessary Cookies',
      description: 'Essential for basic website functionality, security, and remembering your preferences.',
      icon: Shield,
      required: true,
      examples: 'Authentication, shopping cart, language preferences'
    },
    {
      key: 'analytics' as const,
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website to improve user experience.',
      icon: BarChart3,
      required: false,
      examples: 'Google Analytics, page views, bounce rate, traffic sources'
    },
    {
      key: 'marketing' as const,
      title: 'Marketing Cookies',
      description: 'Used to deliver personalized advertisements and measure advertising campaign effectiveness.',
      icon: Target,
      required: false,
      examples: 'Facebook Pixel, Google Ads, remarketing, conversion tracking'
    },
    {
      key: 'social' as const,
      title: 'Social Media Cookies',
      description: 'Enable social sharing features and provide social media integration.',
      icon: Share2,
      required: false,
      examples: 'Social media widgets, share buttons, embedded content'
    }
  ];

  if (showDetails) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Cookie Preferences</h2>
                <p className="text-gray-600 mt-1">
                  Choose which cookies you want to accept. You can change these settings at any time.
                </p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cookie Categories */}
          <div className="p-6">
            <div className="space-y-6">
              {cookieCategories.map((category) => {
                const Icon = category.icon;
                const isEnabled = customPreferences[category.key];

                return (
                  <div key={category.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">{category.title}</h3>
                          {category.required && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-2">{category.description}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          <strong>Examples:</strong> {category.examples}
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handleTogglePreference(category.key)}
                          disabled={category.required}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isEnabled
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
                              isEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Data Retention & Rights */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Your Data Rights</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• You can change these preferences at any time in your account settings</li>
                <li>• You have the right to access, export, or delete your personal data</li>
                <li>• We retain your data only as long as necessary for the purposes described</li>
                <li>• You can withdraw consent at any time without affecting past processing</li>
              </ul>
              <button
                onClick={showPrivacySettings}
                className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>View full privacy policy</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={rejectNonEssentialCookies}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={handleCustomSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
              <button
                onClick={acceptAllCookies}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-40">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">We value your privacy</h3>
                <p className="text-gray-600 text-sm mt-1">
                  We use cookies to enhance your browsing experience, serve personalized content,
                  and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                </p>
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 flex items-center space-x-1"
                >
                  <Settings className="w-3 h-3" />
                  <span>Customize settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 lg:ml-6">
            <button
              onClick={rejectNonEssentialCookies}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Essential Only
            </button>
            <button
              onClick={() => setShowDetails(true)}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm flex items-center justify-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Preferences</span>
            </button>
            <button
              onClick={acceptAllCookies}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Accept All Cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}