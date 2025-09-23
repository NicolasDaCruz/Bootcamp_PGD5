import { createClient } from '@supabase/supabase-js';

// Admin client for server-side operations that bypass RLS
// This should ONLY be used in API routes, never exposed to the client

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔐 Initializing Supabase Admin Client:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  serviceKeyLength: supabaseServiceKey?.length || 0,
  keyPrefix: supabaseServiceKey?.substring(0, 20) + '...' || 'missing'
});

// Create admin client if service key is available
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Fallback to anon client if service key not available
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabaseFallback = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    console.warn('⚠️ Service role key not configured, using anon client (RLS will apply)');
    return supabaseFallback;
  }
  return supabaseAdmin;
};