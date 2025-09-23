import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyWebhookSignature, handleWebhookEvent } from '../../../../../lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text
    const body = await request.text();

    // Get the Stripe signature from headers
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No Stripe signature found' },
        { status: 400 }
      );
    }

    // Verify the webhook signature and construct the event
    const event = verifyWebhookSignature(body, signature);

    // Handle the event
    await handleWebhookEvent(event);

    // Return a response to acknowledge receipt of the event
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Ensure we don't parse the body automatically
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';