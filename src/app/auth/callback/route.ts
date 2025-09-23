import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error)}`);
  }

  if (code) {
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError);
        return NextResponse.redirect(`${origin}/auth/login?error=auth_error`);
      }

      if (data.user) {
        // Check if user profile exists in our database
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // If no profile exists, create one
        if (profileError && profileError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
              avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
              role: 'customer',
              loyalty_points: 0,
            });

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            // Continue anyway, user is authenticated
          }
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (error) {
      console.error('Unexpected error during auth callback:', error);
      return NextResponse.redirect(`${origin}/auth/login?error=unexpected_error`);
    }
  }

  // No code or error, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`);
}