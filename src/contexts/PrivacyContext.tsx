'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

export interface CookiePreferences {
  necessary: boolean; // Always true, required for basic functionality
  analytics: boolean; // Google Analytics, performance tracking
  marketing: boolean; // Advertising cookies, remarketing
  social: boolean; // Social media integration, sharing widgets
}

export interface PrivacySettings {
  cookiePreferences: CookiePreferences;
  dataProcessingConsent: boolean;
  marketingEmailConsent: boolean;
  showCookieBanner: boolean;
  consentTimestamp: Date | null;
  consentVersion: string;
  lastUpdated: Date | null;
}

interface PrivacyState extends PrivacySettings {
  isInitialized: boolean;
  showPrivacyModal: boolean;
  showDataExportModal: boolean;
  pendingDataDeletion: boolean;
}

type PrivacyAction =
  | { type: 'INITIALIZE_PRIVACY'; payload: Partial<PrivacySettings> }
  | { type: 'UPDATE_COOKIE_PREFERENCES'; payload: Partial<CookiePreferences> }
  | { type: 'ACCEPT_ALL_COOKIES' }
  | { type: 'REJECT_NON_ESSENTIAL_COOKIES' }
  | { type: 'UPDATE_DATA_PROCESSING_CONSENT'; payload: boolean }
  | { type: 'UPDATE_MARKETING_EMAIL_CONSENT'; payload: boolean }
  | { type: 'HIDE_COOKIE_BANNER' }
  | { type: 'SHOW_COOKIE_BANNER' }
  | { type: 'SHOW_PRIVACY_MODAL' }
  | { type: 'HIDE_PRIVACY_MODAL' }
  | { type: 'SHOW_DATA_EXPORT_MODAL' }
  | { type: 'HIDE_DATA_EXPORT_MODAL' }
  | { type: 'SET_PENDING_DATA_DELETION'; payload: boolean }
  | { type: 'RESET_PRIVACY_SETTINGS' };

const CURRENT_CONSENT_VERSION = '1.0.0';

const defaultCookiePreferences: CookiePreferences = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  social: false
};

const defaultPrivacySettings: PrivacySettings = {
  cookiePreferences: defaultCookiePreferences,
  dataProcessingConsent: false,
  marketingEmailConsent: false,
  showCookieBanner: true,
  consentTimestamp: null,
  consentVersion: CURRENT_CONSENT_VERSION,
  lastUpdated: null
};

const initialState: PrivacyState = {
  ...defaultPrivacySettings,
  isInitialized: false,
  showPrivacyModal: false,
  showDataExportModal: false,
  pendingDataDeletion: false
};

const privacyReducer = (state: PrivacyState, action: PrivacyAction): PrivacyState => {
  switch (action.type) {
    case 'INITIALIZE_PRIVACY': {
      const now = new Date();
      return {
        ...state,
        ...action.payload,
        isInitialized: true,
        lastUpdated: now
      };
    }

    case 'UPDATE_COOKIE_PREFERENCES': {
      const now = new Date();
      const updatedPreferences = {
        ...state.cookiePreferences,
        ...action.payload,
        necessary: true // Always ensure necessary cookies are enabled
      };

      return {
        ...state,
        cookiePreferences: updatedPreferences,
        consentTimestamp: now,
        lastUpdated: now,
        showCookieBanner: false
      };
    }

    case 'ACCEPT_ALL_COOKIES': {
      const now = new Date();
      return {
        ...state,
        cookiePreferences: {
          necessary: true,
          analytics: true,
          marketing: true,
          social: true
        },
        dataProcessingConsent: true,
        consentTimestamp: now,
        lastUpdated: now,
        showCookieBanner: false
      };
    }

    case 'REJECT_NON_ESSENTIAL_COOKIES': {
      const now = new Date();
      return {
        ...state,
        cookiePreferences: {
          necessary: true,
          analytics: false,
          marketing: false,
          social: false
        },
        dataProcessingConsent: false,
        consentTimestamp: now,
        lastUpdated: now,
        showCookieBanner: false
      };
    }

    case 'UPDATE_DATA_PROCESSING_CONSENT': {
      const now = new Date();
      return {
        ...state,
        dataProcessingConsent: action.payload,
        lastUpdated: now
      };
    }

    case 'UPDATE_MARKETING_EMAIL_CONSENT': {
      const now = new Date();
      return {
        ...state,
        marketingEmailConsent: action.payload,
        lastUpdated: now
      };
    }

    case 'HIDE_COOKIE_BANNER':
      return {
        ...state,
        showCookieBanner: false
      };

    case 'SHOW_COOKIE_BANNER':
      return {
        ...state,
        showCookieBanner: true
      };

    case 'SHOW_PRIVACY_MODAL':
      return {
        ...state,
        showPrivacyModal: true
      };

    case 'HIDE_PRIVACY_MODAL':
      return {
        ...state,
        showPrivacyModal: false
      };

    case 'SHOW_DATA_EXPORT_MODAL':
      return {
        ...state,
        showDataExportModal: true
      };

    case 'HIDE_DATA_EXPORT_MODAL':
      return {
        ...state,
        showDataExportModal: false
      };

    case 'SET_PENDING_DATA_DELETION':
      return {
        ...state,
        pendingDataDeletion: action.payload
      };

    case 'RESET_PRIVACY_SETTINGS': {
      const now = new Date();
      return {
        ...defaultPrivacySettings,
        isInitialized: true,
        showPrivacyModal: false,
        showDataExportModal: false,
        pendingDataDeletion: false,
        lastUpdated: now,
        showCookieBanner: true
      };
    }

    default:
      return state;
  }
};

interface PrivacyContextType {
  state: PrivacyState;
  updateCookiePreferences: (preferences: Partial<CookiePreferences>) => void;
  acceptAllCookies: () => void;
  rejectNonEssentialCookies: () => void;
  updateDataProcessingConsent: (consent: boolean) => void;
  updateMarketingEmailConsent: (consent: boolean) => void;
  showPrivacySettings: () => void;
  hidePrivacySettings: () => void;
  showDataExport: () => void;
  hideDataExport: () => void;
  requestDataExport: () => Promise<void>;
  requestDataDeletion: () => Promise<void>;
  resetPrivacySettings: () => void;
  hasValidConsent: () => boolean;
  shouldShowCookieBanner: () => boolean;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

// Storage keys
const PRIVACY_STORAGE_KEY = 'sneaker-store-privacy-settings';
const PRIVACY_AUDIT_KEY = 'sneaker-store-privacy-audit';

// Audit logging function
const logPrivacyAction = (action: string, details: any = {}) => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    action,
    details,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    ip: 'client-side' // In a real implementation, this would be logged server-side
  };

  try {
    const existingLogs = JSON.parse(localStorage.getItem(PRIVACY_AUDIT_KEY) || '[]');
    existingLogs.push(auditLog);

    // Keep only last 100 audit logs to prevent localStorage bloat
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }

    localStorage.setItem(PRIVACY_AUDIT_KEY, JSON.stringify(existingLogs));
  } catch (error) {
    console.error('Error logging privacy action:', error);
  }
};

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(privacyReducer, initialState);

  // Initialize privacy settings on mount
  useEffect(() => {
    const initializePrivacy = () => {
      try {
        const savedSettings = localStorage.getItem(PRIVACY_STORAGE_KEY);

        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);

          // Check if consent version is current
          const isCurrentVersion = parsedSettings.consentVersion === CURRENT_CONSENT_VERSION;

          if (isCurrentVersion && parsedSettings.consentTimestamp) {
            // Valid saved settings
            dispatch({
              type: 'INITIALIZE_PRIVACY',
              payload: {
                ...parsedSettings,
                consentTimestamp: new Date(parsedSettings.consentTimestamp),
                lastUpdated: new Date(parsedSettings.lastUpdated),
                showCookieBanner: false
              }
            });

            logPrivacyAction('settings_loaded', { version: parsedSettings.consentVersion });
          } else {
            // Outdated consent version or no timestamp - show banner
            dispatch({
              type: 'INITIALIZE_PRIVACY',
              payload: {
                ...defaultPrivacySettings,
                showCookieBanner: true
              }
            });

            logPrivacyAction('consent_outdated', {
              savedVersion: parsedSettings.consentVersion,
              currentVersion: CURRENT_CONSENT_VERSION
            });
          }
        } else {
          // No saved settings - show banner
          dispatch({
            type: 'INITIALIZE_PRIVACY',
            payload: {
              ...defaultPrivacySettings,
              showCookieBanner: true
            }
          });

          logPrivacyAction('first_visit');
        }
      } catch (error) {
        console.error('Error initializing privacy settings:', error);
        dispatch({
          type: 'INITIALIZE_PRIVACY',
          payload: {
            ...defaultPrivacySettings,
            showCookieBanner: true
          }
        });

        logPrivacyAction('initialization_error', { error: error.message });
      }
    };

    initializePrivacy();
  }, []);

  // Save privacy settings to localStorage whenever they change
  useEffect(() => {
    if (state.isInitialized && state.consentTimestamp) {
      const settingsToSave = {
        cookiePreferences: state.cookiePreferences,
        dataProcessingConsent: state.dataProcessingConsent,
        marketingEmailConsent: state.marketingEmailConsent,
        consentTimestamp: state.consentTimestamp?.toISOString(),
        consentVersion: state.consentVersion,
        lastUpdated: state.lastUpdated?.toISOString()
      };

      try {
        localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(settingsToSave));
      } catch (error) {
        console.error('Error saving privacy settings:', error);
      }
    }
  }, [state.cookiePreferences, state.dataProcessingConsent, state.marketingEmailConsent, state.consentTimestamp, state.isInitialized]);

  // Apply cookie preferences to actual cookies/scripts
  useEffect(() => {
    if (state.isInitialized) {
      // Analytics cookies (Google Analytics, etc.)
      if (state.cookiePreferences.analytics) {
        // Enable analytics tracking
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('consent', 'update', {
            'analytics_storage': 'granted'
          });
        }
      } else {
        // Disable analytics tracking
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('consent', 'update', {
            'analytics_storage': 'denied'
          });
        }
      }

      // Marketing cookies (advertising, remarketing)
      if (state.cookiePreferences.marketing) {
        // Enable marketing tracking
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('consent', 'update', {
            'ad_storage': 'granted',
            'ad_user_data': 'granted',
            'ad_personalization': 'granted'
          });
        }
      } else {
        // Disable marketing tracking
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('consent', 'update', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied'
          });
        }
      }

      // Social media cookies
      if (!state.cookiePreferences.social) {
        // Remove social media widgets/scripts if disabled
        // This would typically involve removing Facebook Pixel, Twitter widgets, etc.
      }
    }
  }, [state.cookiePreferences, state.isInitialized]);

  const updateCookiePreferences = (preferences: Partial<CookiePreferences>) => {
    dispatch({ type: 'UPDATE_COOKIE_PREFERENCES', payload: preferences });
    logPrivacyAction('cookie_preferences_updated', preferences);
  };

  const acceptAllCookies = () => {
    dispatch({ type: 'ACCEPT_ALL_COOKIES' });
    logPrivacyAction('accept_all_cookies');
  };

  const rejectNonEssentialCookies = () => {
    dispatch({ type: 'REJECT_NON_ESSENTIAL_COOKIES' });
    logPrivacyAction('reject_non_essential_cookies');
  };

  const updateDataProcessingConsent = (consent: boolean) => {
    dispatch({ type: 'UPDATE_DATA_PROCESSING_CONSENT', payload: consent });
    logPrivacyAction('data_processing_consent_updated', { consent });
  };

  const updateMarketingEmailConsent = (consent: boolean) => {
    dispatch({ type: 'UPDATE_MARKETING_EMAIL_CONSENT', payload: consent });
    logPrivacyAction('marketing_email_consent_updated', { consent });
  };

  const showPrivacySettings = () => {
    dispatch({ type: 'SHOW_PRIVACY_MODAL' });
    logPrivacyAction('privacy_settings_opened');
  };

  const hidePrivacySettings = () => {
    dispatch({ type: 'HIDE_PRIVACY_MODAL' });
  };

  const showDataExport = () => {
    dispatch({ type: 'SHOW_DATA_EXPORT_MODAL' });
    logPrivacyAction('data_export_modal_opened');
  };

  const hideDataExport = () => {
    dispatch({ type: 'HIDE_DATA_EXPORT_MODAL' });
  };

  const requestDataExport = async () => {
    logPrivacyAction('data_export_requested');

    try {
      // In a real implementation, this would make an API call to generate and download user data
      const userData = {
        exportDate: new Date().toISOString(),
        userPreferences: {
          cookiePreferences: state.cookiePreferences,
          dataProcessingConsent: state.dataProcessingConsent,
          marketingEmailConsent: state.marketingEmailConsent
        },
        auditLog: JSON.parse(localStorage.getItem(PRIVACY_AUDIT_KEY) || '[]'),
        // Add other user data like orders, wishlists, etc.
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(userData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = `sneaker-store-data-export-${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      logPrivacyAction('data_export_completed');
    } catch (error) {
      console.error('Error exporting data:', error);
      logPrivacyAction('data_export_failed', { error: error.message });
    }
  };

  const requestDataDeletion = async () => {
    dispatch({ type: 'SET_PENDING_DATA_DELETION', payload: true });
    logPrivacyAction('data_deletion_requested');

    try {
      // In a real implementation, this would make an API call to initiate data deletion
      // For demo purposes, we'll simulate this process

      setTimeout(() => {
        // Clear all local storage
        localStorage.removeItem(PRIVACY_STORAGE_KEY);
        localStorage.removeItem(PRIVACY_AUDIT_KEY);
        localStorage.removeItem('sneaker-store-cart');
        localStorage.removeItem('sneaker-store-wishlist');

        // Reset privacy settings
        dispatch({ type: 'RESET_PRIVACY_SETTINGS' });
        dispatch({ type: 'SET_PENDING_DATA_DELETION', payload: false });

        logPrivacyAction('data_deletion_completed');

        alert('Your data has been successfully deleted. You will now see the cookie banner again as a new user.');
      }, 2000);
    } catch (error) {
      console.error('Error deleting data:', error);
      dispatch({ type: 'SET_PENDING_DATA_DELETION', payload: false });
      logPrivacyAction('data_deletion_failed', { error: error.message });
    }
  };

  const resetPrivacySettings = () => {
    dispatch({ type: 'RESET_PRIVACY_SETTINGS' });
    localStorage.removeItem(PRIVACY_STORAGE_KEY);
    logPrivacyAction('privacy_settings_reset');
  };

  const hasValidConsent = (): boolean => {
    return !!(state.consentTimestamp && state.consentVersion === CURRENT_CONSENT_VERSION);
  };

  const shouldShowCookieBanner = (): boolean => {
    return state.showCookieBanner && !hasValidConsent();
  };

  const value: PrivacyContextType = {
    state,
    updateCookiePreferences,
    acceptAllCookies,
    rejectNonEssentialCookies,
    updateDataProcessingConsent,
    updateMarketingEmailConsent,
    showPrivacySettings,
    hidePrivacySettings,
    showDataExport,
    hideDataExport,
    requestDataExport,
    requestDataDeletion,
    resetPrivacySettings,
    hasValidConsent,
    shouldShowCookieBanner
  };

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}

// Global gtag interface for TypeScript
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
  }
}