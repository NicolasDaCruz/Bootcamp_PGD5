// Authentication and user-related type definitions

import { User } from './database';

// Auth state types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// User profile types
export interface UserProfile extends User {
  preferences: {
    newsletter: boolean;
    smsUpdates: boolean;
    theme: 'light' | 'dark' | 'auto';
    currency: string;
    language: string;
  };
  addresses: Address[];
  orders: {
    total: number;
    recent: Array<{
      id: string;
      status: string;
      total: number;
      createdAt: string;
    }>;
  };
}

export interface Address {
  id: string;
  type: 'shipping' | 'billing';
  isDefault: boolean;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// Authentication forms
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  acceptTerms: boolean;
  subscribeNewsletter?: boolean;
}

export interface ForgotPasswordForm {
  email: string;
}

export interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
  token: string;
}

export interface UpdateProfileForm {
  fullName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// User roles and permissions
export type UserRole = 'customer' | 'admin' | 'moderator' | 'vendor' | 'vendeur';

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

export interface RolePermissions {
  [key: string]: Permission[];
}

// Social authentication
export interface SocialAuthProvider {
  name: 'google' | 'facebook' | 'apple' | 'twitter';
  clientId: string;
  enabled: boolean;
}

// Session types
export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Auth error types
export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

// Two-factor authentication
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  code: string;
  backupCode?: string;
}