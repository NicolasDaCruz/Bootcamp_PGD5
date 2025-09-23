import { NextResponse } from 'next/server';

export async function GET() {
  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  return NextResponse.json({
    hasStripeKey: !!stripeKey,
    keyPrefix: stripeKey ? stripeKey.substring(0, 20) + '...' : 'undefined',
    keyLength: stripeKey?.length || 0,
    isTest: stripeKey?.startsWith('pk_test_') || false,
    timestamp: new Date().toISOString()
  });
}