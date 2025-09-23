'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface VendorAuthState {
  isVendor: boolean;
  isAdmin: boolean;
  user: User | null;
  vendorId: string | null;
  loading: boolean;
  error: string | null;
  canManageProduct: (productVendorId: string | null) => boolean;
}

export function useVendorAuth(): VendorAuthState {
  const [isVendor, setIsVendor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkVendorStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!currentUser) {
          setIsVendor(false);
          setIsAdmin(false);
          setUser(null);
          setVendorId(null);
          return;
        }

        setUser(currentUser);

        // Get user profile with role
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role, is_vendor')
          .eq('id', currentUser.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          throw new Error('Failed to fetch user profile');
        }

        // Check if user is a vendor or admin
        const userRole = profile?.role?.toLowerCase();
        const isVendorRole = userRole === 'vendor' || userRole === 'vendeur' || profile?.is_vendor === true;
        const isAdminRole = userRole === 'admin';

        setIsVendor(isVendorRole);
        setIsAdmin(isAdminRole);
        setVendorId(isVendorRole ? currentUser.id : null);

      } catch (err) {
        console.error('Error checking vendor status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check vendor status');
        setIsVendor(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkVendorStatus();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkVendorStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check if the current vendor can manage a specific product
  const canManageProduct = (productVendorId: string | null): boolean => {
    if (isAdmin) return true; // Admins can manage all products
    if (!isVendor || !vendorId) return false;
    if (!productVendorId) return true; // New products
    return productVendorId === vendorId;
  };

  return {
    isVendor,
    isAdmin,
    user,
    vendorId,
    loading,
    error,
    canManageProduct
  };
}