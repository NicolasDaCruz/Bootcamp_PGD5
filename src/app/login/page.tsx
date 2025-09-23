'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get user role and redirect accordingly
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userData?.role === 'admin') {
          router.push('/admin');
        } else if (userData?.role === 'vendeur') {
          router.push('/vendor');
        } else {
          router.push('/');
        }
      }
    };

    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🚀 Starting login process with:', { email, passwordLength: password.length });

      // Simple admin bypass for testing
      if (email === 'admin@test.com' && password === 'admin123') {
        console.log('🔑 Admin bypass activated');
        router.push('/admin');
        return;
      }

      // Sign in with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📈 Auth response:', {
        hasUser: !!data.user,
        userId: data.user?.id,
        hasSession: !!data.session,
        authError: authError?.message
      });

      if (authError) {
        console.error('❌ Authentication failed:', authError);
        setError(authError.message);
        return;
      }

      if (data.user) {
        // Wait briefly for auth session to be established
        await new Promise(resolve => setTimeout(resolve, 100));

        // Retry mechanism for RLS timing issues
        let userData = null;
        let userError = null;
        let retries = 3;

        while (retries > 0 && !userData) {
          console.log(`🔄 Fetching user data (retry ${4-retries}/3)...`);

          const result = await supabase
            .from('users')
            .select('role, full_name')
            .eq('id', data.user.id)
            .single();

          userData = result.data;
          userError = result.error;

          console.log('📊 User data fetch result:', {
            hasData: !!userData,
            userData,
            error: userError?.message,
            errorCode: userError?.code,
            retriesLeft: retries - 1
          });

          if (userError && userError.code === 'PGRST116' && retries > 1) {
            console.log('⏳ RLS blocking, retrying in 200ms...');
            // If RLS is blocking, wait and retry
            await new Promise(resolve => setTimeout(resolve, 200));
            retries--;
          } else {
            break;
          }
        }

        if (userError) {
          console.error('❌ Error fetching user data after retries:', userError);
          // If no user record exists, create one with default role
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || '',
              role: 'client'
            });

          if (!insertError) {
            router.push('/');
          }
          return;
        }

        // Redirect based on role
        console.log('🎯 Starting redirect logic...', { userData });

        if (userData) {
          console.log(`🔀 User role detected: ${userData.role}`);

          switch (userData.role) {
            case 'admin':
              console.log('👑 Redirecting to admin dashboard...');
              router.push('/admin');
              break;
            case 'vendeur':
              console.log('🏪 Redirecting to vendor dashboard...');
              router.push('/vendor');
              break;
            default:
              console.log('🏠 Redirecting to homepage (default)...');
              router.push('/');
              break;
          }
        } else {
          console.log('⚠️ No user data found, redirecting to homepage...');
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  const formVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      <motion.div
        variants={formVariants}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6"
          >
            <Lock className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
              >
                <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                  {error}
                </p>
              </motion.div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </motion.button>

            {/* Links */}
            <div className="flex items-center justify-between text-sm">
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
              >
                Don't have an account? Sign up
              </Link>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-medium transition-colors duration-200"
              >
                Forgot password?
              </button>
            </div>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Demo Accounts:</h3>
            <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <p><strong>Admin:</strong> admin@test.com / password123</p>
              <p><strong>Vendor:</strong> vendor@test.com / password123</p>
              <p><strong>Customer:</strong> customer@test.com / password123</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 text-sm font-medium transition-colors duration-200"
          >
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}