'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

export default function TestStripePage() {
  const [stripeStatus, setStripeStatus] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [envKey, setEnvKey] = useState<string>('');

  useEffect(() => {
    const testStripe = async () => {
      try {
        // Check environment variable
        const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        setEnvKey(stripeKey ? stripeKey.substring(0, 20) + '...' : 'undefined');

        if (!stripeKey) {
          setError('No Stripe publishable key found');
          setStripeStatus('Failed - No Key');
          return;
        }

        console.log('🧪 Testing Stripe.js loading...');
        console.log('🔑 Stripe key found:', stripeKey.substring(0, 20) + '...');

        // Test loading Stripe
        setStripeStatus('Loading Stripe.js...');
        const stripePromise = loadStripe(stripeKey);
        const stripe = await stripePromise;

        if (stripe) {
          setStripeStatus('✅ Stripe.js loaded successfully!');
          console.log('✅ Stripe.js loaded successfully:', stripe);
        } else {
          throw new Error('Stripe instance is null');
        }
      } catch (err) {
        console.error('❌ Stripe loading failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStripeStatus('❌ Failed to load Stripe.js');
      }
    };

    testStripe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Stripe.js Test</h1>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Environment Variable:</p>
            <p className="text-sm text-gray-600 font-mono">{envKey}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Status:</p>
            <p className={`text-sm font-mono ${
              stripeStatus.includes('✅') ? 'text-green-600' :
              stripeStatus.includes('❌') ? 'text-red-600' :
              'text-blue-600'
            }`}>
              {stripeStatus}
            </p>
          </div>

          {error && (
            <div>
              <p className="text-sm font-medium text-red-700">Error:</p>
              <p className="text-sm text-red-600 font-mono">{error}</p>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Test
            </button>
          </div>

          <div className="mt-4">
            <a
              href="/checkout"
              className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-center"
            >
              Go to Checkout
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}