'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  signInWithEmail,
  signUpWithEmail,
  signInWithOAuth,
  resetPassword,
  updatePassword,
  signOut as supabaseSignOut,
} from '@/lib/supabase';
import type { LoginForm, RegisterForm, UserProfile } from '@/types/auth';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthActions {
  // Authentication actions
  signIn: (credentials: LoginForm) => Promise<{ error?: string }>;
  signUp: (credentials: RegisterForm) => Promise<{ error?: string }>;
  signInWithProvider: (provider: 'google' | 'facebook' | 'apple') => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;

  // Profile actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  initialize: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,

    // Authentication actions
    signIn: async (credentials: LoginForm) => {
      set({ isLoading: true, error: null });

      const { data, error } = await signInWithEmail(credentials.email, credentials.password);

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      // Session will be handled by the auth state change listener
      set({ isLoading: false });
      return {};
    },

    signUp: async (credentials: RegisterForm) => {
      set({ isLoading: true, error: null });

      if (credentials.password !== credentials.confirmPassword) {
        const error = 'Passwords do not match';
        set({ error, isLoading: false });
        return { error };
      }

      const { data, error } = await signUpWithEmail(
        credentials.email,
        credentials.password,
        {
          full_name: credentials.fullName,
          subscribe_newsletter: credentials.subscribeNewsletter || false,
        }
      );

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      set({ isLoading: false });
      return {};
    },

    signInWithProvider: async (provider: 'google' | 'facebook' | 'apple') => {
      set({ isLoading: true, error: null });

      const { data, error } = await signInWithOAuth(provider);

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      // OAuth redirect will handle the rest
      return {};
    },

    signOut: async () => {
      set({ isLoading: true });

      await supabaseSignOut();

      set({
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    },

    resetPassword: async (email: string) => {
      set({ isLoading: true, error: null });

      const { error } = await resetPassword(email);

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      set({ isLoading: false });
      return {};
    },

    updatePassword: async (password: string) => {
      set({ isLoading: true, error: null });

      const { error } = await updatePassword(password);

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      set({ isLoading: false });
      return {};
    },

    // Profile actions
    updateProfile: async (updates: Partial<UserProfile>) => {
      const { user } = get();
      if (!user) return { error: 'Not authenticated' };

      set({ isLoading: true, error: null });

      try {
        // Update auth user metadata if needed
        const authUpdates: any = {};
        if (updates.full_name) authUpdates.data = { full_name: updates.full_name };
        if (updates.email) authUpdates.email = updates.email;

        if (Object.keys(authUpdates).length > 0) {
          const { error: authError } = await supabase.auth.updateUser(authUpdates);
          if (authError) throw authError;
        }

        // Update profile in database
        const { error: dbError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id);

        if (dbError) throw dbError;

        // Refresh profile
        await get().refreshProfile();

        set({ isLoading: false });
        return {};
      } catch (error: any) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }
    },

    refreshProfile: async () => {
      const { user } = get();
      if (!user) return;

      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        set({ profile: profile as UserProfile });
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    },

    // State management
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: string | null) => set({ error }),
    setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),
    setSession: (session: Session | null) => set({ session }),
    setProfile: (profile: UserProfile | null) => set({ profile }),

    // Initialize auth state
    initialize: async () => {
      try {
        set({ isLoading: true });

        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          set({ isLoading: false });
          return;
        }

        if (session?.user) {
          set({
            user: session.user,
            session,
            isAuthenticated: true
          });

          // Fetch user profile
          await get().refreshProfile();
        }

        set({ isLoading: false });
      } catch (error) {
        console.error('Error initializing auth:', error);
        set({ isLoading: false });
      }
    },
  }))
);

// Auth state change listener
let authListener: { data: { subscription: any } } | null = null;

// Main useAuth hook
export const useAuth = () => {
  const store = useAuthStore();

  useEffect(() => {
    // Initialize auth state
    store.initialize();

    // Set up auth state change listener
    authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);

      switch (event) {
        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
          if (session?.user) {
            store.setUser(session.user);
            store.setSession(session);
            await store.refreshProfile();
          }
          store.setLoading(false);
          break;

        case 'SIGNED_OUT':
          store.setUser(null);
          store.setSession(null);
          store.setProfile(null);
          store.setLoading(false);
          break;

        case 'TOKEN_REFRESHED':
          if (session) {
            store.setSession(session);
          }
          break;

        case 'USER_UPDATED':
          if (session?.user) {
            store.setUser(session.user);
            await store.refreshProfile();
          }
          break;

        default:
          break;
      }
    });

    // Cleanup listener on unmount
    return () => {
      if (authListener) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, []);

  return store;
};

// Utility hooks for specific auth states
export const useUser = () => useAuthStore((state) => state.user);
export const useProfile = () => useAuthStore((state) => state.profile);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

// Role-based access helpers
export const useHasRole = (role: 'customer' | 'admin' | 'moderator' | 'vendor') => {
  return useAuthStore((state) => state.profile?.role === role);
};

export const useIsAdmin = () => useHasRole('admin');
export const useIsModerator = () => useHasRole('moderator');
export const useIsCustomer = () => useHasRole('customer');
export const useIsVendor = () => useHasRole('vendor');

// Advanced role checking utilities
export const useHasAnyRole = (roles: Array<'customer' | 'admin' | 'moderator' | 'vendor'>) => {
  return useAuthStore((state) => roles.includes(state.profile?.role as any));
};

export const useIsAdminOrModerator = () => useHasAnyRole(['admin', 'moderator']);
export const useCanManageProducts = () => useHasAnyRole(['admin', 'vendor']);
export const useCanManageOrders = () => useHasAnyRole(['admin', 'moderator']);
export const useCanAccessDashboard = () => useHasAnyRole(['admin', 'moderator', 'vendor']);