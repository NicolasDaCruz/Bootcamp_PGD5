import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🔐 Server-side login attempt:', { email });

    // Try to sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log('🔍 Auth response:', {
      hasUser: !!data.user,
      hasSession: !!data.session,
      error: error?.message
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (data.user && data.session) {
      // Get user role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single();

      console.log('👤 User data:', { userData, error: userError?.message });

      return NextResponse.json({
        success: true,
        user: data.user,
        session: data.session,
        profile: userData
      });
    }

    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 400 }
    );

  } catch (error) {
    console.error('💥 Login error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    );
  }
}