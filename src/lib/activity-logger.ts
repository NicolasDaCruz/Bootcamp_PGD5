/**
 * Activity Logger for GDPR Compliance
 * Logs user actions for audit trail and privacy compliance
 */

import { supabase } from './supabase';
import type { UserActivityLogInsert } from '@/types/database';

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'register'
  | 'profile_update'
  | 'password_change'
  | 'email_change'
  | 'address_add'
  | 'address_update'
  | 'address_delete'
  | 'order_create'
  | 'order_update'
  | 'order_cancel'
  | 'cart_add'
  | 'cart_remove'
  | 'cart_update'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'product_view'
  | 'search'
  | 'filter_apply'
  | 'newsletter_subscribe'
  | 'newsletter_unsubscribe'
  | 'privacy_settings_update'
  | 'cookie_consent_update'
  | 'data_export_request'
  | 'data_deletion_request'
  | 'account_deletion_request'
  | 'cache_clear'
  | 'session_start'
  | 'session_end'
  | 'payment_attempt'
  | 'payment_success'
  | 'payment_failure'
  | 'two_factor_enable'
  | 'two_factor_disable'
  | 'email_verification'
  | 'password_reset_request'
  | 'password_reset_complete';

export interface ActivityDetails {
  [key: string]: any;
  resource_id?: string;
  resource_type?: string;
  previous_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  metadata?: Record<string, any>;
}

class ActivityLogger {
  private isClient = typeof window !== 'undefined';
  private sessionId: string | null = null;

  constructor() {
    if (this.isClient) {
      this.sessionId = this.generateSessionId();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientInfo() {
    if (!this.isClient) {
      return {
        ip_address: null,
        user_agent: null,
        session_id: null
      };
    }

    return {
      ip_address: null, // This would be set server-side in a real implementation
      user_agent: window.navigator.userAgent,
      session_id: this.sessionId
    };
  }

  /**
   * Logs a user activity to the database
   */
  async logActivity(
    action: ActivityAction,
    details: ActivityDetails = {},
    userId?: string
  ): Promise<void> {
    try {
      // Get current user if not provided
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id || null;
      }

      const clientInfo = this.getClientInfo();

      const logEntry: UserActivityLogInsert = {
        user_id: currentUserId,
        action,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
          ...clientInfo
        },
        ip_address: clientInfo.ip_address,
        user_agent: clientInfo.user_agent,
        session_id: clientInfo.session_id
      };

      const { error } = await supabase
        .from('user_activity_logs')
        .insert(logEntry);

      if (error) {
        console.error('Failed to log activity:', error);
        // Don't throw error to avoid disrupting user experience
      }
    } catch (error) {
      console.error('Activity logging error:', error);
      // Silently fail - logging should not disrupt user experience
    }
  }

  /**
   * Logs authentication events
   */
  async logAuth(action: 'login' | 'logout' | 'register', details: ActivityDetails = {}) {
    await this.logActivity(action, {
      ...details,
      category: 'authentication'
    });
  }

  /**
   * Logs profile-related events
   */
  async logProfile(action: 'profile_update' | 'password_change' | 'email_change', details: ActivityDetails = {}) {
    await this.logActivity(action, {
      ...details,
      category: 'profile'
    });
  }

  /**
   * Logs e-commerce events
   */
  async logEcommerce(
    action: 'order_create' | 'cart_add' | 'cart_remove' | 'wishlist_add' | 'product_view',
    details: ActivityDetails = {}
  ) {
    await this.logActivity(action, {
      ...details,
      category: 'ecommerce'
    });
  }

  /**
   * Logs privacy-related events
   */
  async logPrivacy(
    action: 'privacy_settings_update' | 'cookie_consent_update' | 'data_export_request' | 'data_deletion_request',
    details: ActivityDetails = {}
  ) {
    await this.logActivity(action, {
      ...details,
      category: 'privacy'
    });
  }

  /**
   * Logs system events
   */
  async logSystem(action: 'cache_clear' | 'session_start' | 'session_end', details: ActivityDetails = {}) {
    await this.logActivity(action, {
      ...details,
      category: 'system'
    });
  }

  /**
   * Gets activity logs for a user (with pagination)
   */
  async getUserActivityLogs(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      actions?: ActivityAction[];
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    try {
      let query = supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (options.actions?.length) {
        query = query.in('action', options.actions);
      }

      if (options.startDate) {
        query = query.gte('timestamp', options.startDate.toISOString());
      }

      if (options.endDate) {
        query = query.lte('timestamp', options.endDate.toISOString());
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch activity logs:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return { data: [], error };
    }
  }

  /**
   * Gets activity statistics for a user
   */
  async getUserActivityStats(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('action, timestamp')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString());

      if (error) {
        console.error('Failed to fetch activity stats:', error);
        return { stats: {}, error };
      }

      // Group by action type
      const stats = (data || []).reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return { stats, error: null };
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      return { stats: {}, error };
    }
  }

  /**
   * Clears old activity logs (for data retention compliance)
   */
  async cleanupOldLogs(retentionDays: number = 365 * 2) { // 2 years default
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { error } = await supabase
        .from('user_activity_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) {
        console.error('Failed to cleanup old logs:', error);
        return { success: false, error };
      }

      console.log(`Cleaned up activity logs older than ${retentionDays} days`);
      return { success: true, error: null };
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      return { success: false, error };
    }
  }
}

// Create singleton instance
export const activityLogger = new ActivityLogger();

// Helper functions for common use cases
export const logLogin = (details?: ActivityDetails) =>
  activityLogger.logAuth('login', details);

export const logLogout = (details?: ActivityDetails) =>
  activityLogger.logAuth('logout', details);

export const logRegistration = (details?: ActivityDetails) =>
  activityLogger.logAuth('register', details);

export const logProfileUpdate = (details?: ActivityDetails) =>
  activityLogger.logProfile('profile_update', details);

export const logOrderCreate = (details?: ActivityDetails) =>
  activityLogger.logEcommerce('order_create', details);

export const logProductView = (details?: ActivityDetails) =>
  activityLogger.logEcommerce('product_view', details);

export const logPrivacyUpdate = (details?: ActivityDetails) =>
  activityLogger.logPrivacy('privacy_settings_update', details);

export const logDataExportRequest = (details?: ActivityDetails) =>
  activityLogger.logPrivacy('data_export_request', details);

export const logDataDeletionRequest = (details?: ActivityDetails) =>
  activityLogger.logPrivacy('data_deletion_request', details);

export const logCacheClear = (details?: ActivityDetails) =>
  activityLogger.logSystem('cache_clear', details);

// Export the main class for advanced usage
export { ActivityLogger };