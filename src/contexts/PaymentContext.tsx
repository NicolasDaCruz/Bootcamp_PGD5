'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { CartItem } from './CartContext';
import { ShippingMethod, PickupPoint, calculateShipping, calculateTax } from '@/lib/shipping';

export interface PaymentMetadata {
  userId?: string;
  sessionId?: string;
  cartId: string;
  reservationIds: string[];
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
}

export interface PaymentBreakdown {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingMethod?: ShippingMethod;
  pickupPoint?: PickupPoint;
  taxBreakdown?: {
    rate: number;
    breakdown: any;
  };
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  email?: string;  // Added for guest checkout support
}

interface PaymentState {
  paymentIntent: PaymentIntent | null;
  breakdown: PaymentBreakdown | null;
  shipping: ShippingAddress | null;
  shippingMethod: string;
  pickupPoint: PickupPoint | null;
  isLoading: boolean;
  error: string | null;
  stripe: Stripe | null;
}

type PaymentAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAYMENT_INTENT'; payload: { paymentIntent: PaymentIntent; breakdown: PaymentBreakdown } }
  | { type: 'SET_SHIPPING'; payload: ShippingAddress }
  | { type: 'SET_SHIPPING_METHOD'; payload: { methodId: string; pickupPoint?: PickupPoint } }
  | { type: 'UPDATE_BREAKDOWN'; payload: PaymentBreakdown }
  | { type: 'CLEAR_PAYMENT' }
  | { type: 'SET_STRIPE'; payload: Stripe | null };

const paymentReducer = (state: PaymentState, action: PaymentAction): PaymentState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case 'SET_PAYMENT_INTENT':
      return {
        ...state,
        paymentIntent: action.payload.paymentIntent,
        breakdown: action.payload.breakdown,
        error: null,
        isLoading: false
      };

    case 'SET_SHIPPING':
      return {
        ...state,
        shipping: action.payload
      };

    case 'SET_SHIPPING_METHOD':
      return {
        ...state,
        shippingMethod: action.payload.methodId,
        pickupPoint: action.payload.pickupPoint || null
      };

    case 'UPDATE_BREAKDOWN':
      return {
        ...state,
        breakdown: action.payload
      };

    case 'CLEAR_PAYMENT':
      return {
        ...state,
        paymentIntent: null,
        breakdown: null,
        shipping: null,
        shippingMethod: 'standard',
        pickupPoint: null,
        error: null,
        isLoading: false
      };

    case 'SET_STRIPE':
      return {
        ...state,
        stripe: action.payload
      };

    default:
      return state;
  }
};

interface PaymentContextType {
  state: PaymentState;
  createPaymentIntent: (items: CartItem[], metadata: PaymentMetadata) => Promise<void>;
  updatePaymentIntent: (items: CartItem[], metadata: PaymentMetadata) => Promise<void>;
  setShipping: (shipping: ShippingAddress) => void;
  setShippingMethod: (methodId: string, pickupPoint?: PickupPoint) => void;
  calculateTotals: (items: CartItem[]) => void;
  confirmPayment: (paymentMethodId?: string) => Promise<{ success: boolean; error?: string }>;
  clearPayment: () => void;
  initializeStripe: () => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

const initialState: PaymentState = {
  paymentIntent: null,
  breakdown: null,
  shipping: null,
  shippingMethod: 'standard',
  pickupPoint: null,
  isLoading: false,
  error: null,
  stripe: null
};

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(paymentReducer, initialState);

  const initializeStripe = async () => {
    if (!state.stripe) {
      const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!stripeKey || stripeKey.includes('placeholder')) {
        console.warn('Stripe publishable key not configured or is placeholder');
        dispatch({ type: 'SET_ERROR', payload: 'Stripe is not configured properly' });
        return;
      }

      try {
        const stripePromise = loadStripe(stripeKey);
        const stripeInstance = await stripePromise;
        if (!stripeInstance) {
          throw new Error('Failed to load Stripe.js');
        }
        dispatch({ type: 'SET_STRIPE', payload: stripeInstance });
      } catch (error) {
        console.error('Failed to load Stripe:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load payment system' });
      }
    }
  };

  const createPaymentIntent = async (items: CartItem[], metadata: PaymentMetadata) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    console.log('💳 [PaymentContext] createPaymentIntent START:', {
      timestamp: new Date().toISOString(),
      itemCount: items.length,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        variantId: item.variantId
      })),
      metadata: {
        cartId: metadata.cartId,
        userId: metadata.userId,
        sessionId: metadata.sessionId,
        reservationIds: metadata.reservationIds
      },
      hasShipping: !!state.shipping,
      shippingMethod: state.shippingMethod
    });

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          shipping: state.shipping,
          metadata
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();

      console.log('✅ [PaymentContext] createPaymentIntent SUCCESS:', {
        timestamp: new Date().toISOString(),
        paymentIntentId: data.paymentIntentId,
        hasClientSecret: !!data.clientSecret,
        amount: data.amount,
        breakdown: data.breakdown
      });

      dispatch({
        type: 'SET_PAYMENT_INTENT',
        payload: {
          paymentIntent: {
            id: data.paymentIntentId,
            clientSecret: data.clientSecret,
            amount: data.amount,
            currency: 'usd',
            status: 'requires_payment_method'
          },
          breakdown: data.breakdown
        }
      });

    } catch (error) {
      console.error('❌ [PaymentContext] Error creating payment intent:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to create payment intent'
      });
    }
  };

  const updatePaymentIntent = async (items: CartItem[], metadata: PaymentMetadata) => {
    if (!state.paymentIntent) {
      return createPaymentIntent(items, metadata);
    }

    console.log('🔄 [PaymentContext] updatePaymentIntent START:', {
      timestamp: new Date().toISOString(),
      paymentIntentId: state.paymentIntent.id,
      itemCount: items.length,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        variantId: item.variantId
      })),
      metadata: {
        cartId: metadata.cartId,
        userId: metadata.userId,
        sessionId: metadata.sessionId,
        reservationIds: metadata.reservationIds
      },
      hasShipping: !!state.shipping,
      shippingMethod: state.shippingMethod
    });

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch('/api/stripe/update-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: state.paymentIntent.id,
          items,
          shipping: state.shipping,
          metadata
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update payment intent');
      }

      const data = await response.json();

      console.log('✅ [PaymentContext] updatePaymentIntent SUCCESS:', {
        timestamp: new Date().toISOString(),
        paymentIntentId: data.paymentIntentId,
        hasClientSecret: !!data.clientSecret,
        amount: data.amount,
        breakdown: data.breakdown
      });

      dispatch({
        type: 'SET_PAYMENT_INTENT',
        payload: {
          paymentIntent: {
            id: data.paymentIntentId,
            clientSecret: data.clientSecret,
            amount: data.amount,
            currency: 'usd',
            status: 'requires_payment_method'
          },
          breakdown: data.breakdown
        }
      });

    } catch (error) {
      console.error('❌ [PaymentContext] Error updating payment intent:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to update payment intent'
      });
    }
  };

  const setShipping = (shipping: ShippingAddress) => {
    dispatch({ type: 'SET_SHIPPING', payload: shipping });
  };

  const setShippingMethod = (methodId: string, pickupPoint?: PickupPoint) => {
    dispatch({
      type: 'SET_SHIPPING_METHOD',
      payload: { methodId, pickupPoint }
    });

    // Recalculate totals when shipping method changes
    // This will be called externally to trigger recalculation
  };

  const calculateTotals = (items: CartItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Calculate shipping
    const shippingCalculation = calculateShipping(
      subtotal,
      state.shippingMethod,
      state.shipping?.country || 'US'
    );

    // Calculate tax
    const taxCalculation = state.shipping ? calculateTax(
      subtotal,
      shippingCalculation.cost,
      {
        country: state.shipping.country,
        state: state.shipping.state,
        postalCode: state.shipping.postal_code
      }
    ) : { amount: 0, rate: 0, breakdown: {} };

    const total = subtotal + shippingCalculation.cost + taxCalculation.amount;

    const breakdown: PaymentBreakdown = {
      subtotal,
      shipping: shippingCalculation.cost,
      tax: taxCalculation.amount,
      total,
      shippingMethod: shippingCalculation.method,
      pickupPoint: state.pickupPoint,
      taxBreakdown: {
        rate: taxCalculation.rate,
        breakdown: taxCalculation.breakdown
      }
    };

    dispatch({ type: 'UPDATE_BREAKDOWN', payload: breakdown });
  };

  const confirmPayment = async (paymentMethodId?: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.stripe || !state.paymentIntent) {
      console.error('❌ [PaymentContext] confirmPayment failed: Payment not initialized');
      return { success: false, error: 'Payment not initialized' };
    }

    console.log('💰 [PaymentContext] confirmPayment START:', {
      timestamp: new Date().toISOString(),
      paymentIntentId: state.paymentIntent.id,
      hasPaymentMethodId: !!paymentMethodId,
      clientSecretPrefix: state.paymentIntent.clientSecret.substring(0, 20) + '...'
    });

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { error, paymentIntent } = await state.stripe.confirmPayment({
        clientSecret: state.paymentIntent.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order/success`,
          ...(paymentMethodId && { payment_method: paymentMethodId })
        },
        redirect: 'if_required'
      });

      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Payment failed' });
        return { success: false, error: error.message };
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ [PaymentContext] confirmPayment SUCCESS:', {
          timestamp: new Date().toISOString(),
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status
        });
        dispatch({ type: 'CLEAR_PAYMENT' });
        return { success: true };
      }

      return { success: false, error: 'Payment requires additional action' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearPayment = () => {
    dispatch({ type: 'CLEAR_PAYMENT' });
  };

  const value: PaymentContextType = {
    state,
    createPaymentIntent,
    updatePaymentIntent,
    setShipping,
    setShippingMethod,
    calculateTotals,
    confirmPayment,
    clearPayment,
    initializeStripe
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}