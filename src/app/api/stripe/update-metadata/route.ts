import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../../../lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, metadata } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating payment intent metadata:', {
      paymentIntentId,
      metadata
    });

    // Update the payment intent metadata
    const paymentIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      {
        metadata: {
          ...metadata,
          // Ensure we don't exceed Stripe's metadata limits
          customer_email: metadata.customer_email?.substring(0, 500) || null
        }
      }
    );

    console.log('✅ Payment intent metadata updated successfully');

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error updating payment intent metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update payment metadata' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';