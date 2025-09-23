import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  console.log('🔍 Testing Supabase Admin Connection');

  // Check environment variables
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  console.log('🔐 Environment check:', {
    hasServiceKey,
    hasUrl,
    keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing',
    keyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + '...' || 'missing'
  });

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Try a simple query to test the connection
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase query error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        hasServiceKey,
        hasUrl
      }, { status: 500 });
    }

    console.log('✅ Supabase Admin connection successful');
    return NextResponse.json({
      success: true,
      message: 'Admin connection working',
      hasServiceKey,
      hasUrl
    });

  } catch (error) {
    console.error('❌ Connection error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasServiceKey,
      hasUrl
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}