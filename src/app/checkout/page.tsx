'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  CreditCard,
  Smartphone,
  Shield,
  AlertCircle,
  CheckCircle,
  MapPin,
  Package,
  Clock,
  User,
  Mail,
  Phone
} from 'lucide-react';
import Image from 'next/image';
import { PayPalIcon, ApplePayIcon, GooglePayIcon, KlarnaIcon } from '@/components/icons/PaymentIcons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { usePayment, ShippingAddress } from '@/contexts/PaymentContext';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import ShippingOptionsSelector from '@/components/ShippingOptionsSelector';
import { PickupPoint } from '@/lib/shipping';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...'
);

// Custom hook for form validation
const useFormValidation = (initialState: any) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    let error = '';

    switch (name) {
      case 'email':
        if (!value) error = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Email is invalid';
        break;
      case 'phone':
        if (!value) error = 'Phone number is required';
        else if (!/^\+?[\d\s\-\(\)]+$/.test(value)) error = 'Phone number is invalid';
        break;
      case 'name':
      case 'line1':
      case 'city':
      case 'state':
      case 'postal_code':
        if (!value.trim()) error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const updateValue = (name: string, value: string) => {
    setValues((prev: any) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateAll = () => {
    const fieldNames = Object.keys(values);
    const isValid = fieldNames.every(name => validateField(name, values[name]));
    return isValid;
  };

  return { values, errors, updateValue, validateAll };
};

// Payment Method Selection Component
const PaymentMethodSelector = ({
  selectedMethod,
  onMethodChange
}: {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
}) => {
  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express',
      supported: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: PayPalIcon,
      description: 'Pay with your PayPal account',
      supported: true
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      icon: ApplePayIcon,
      description: 'Touch ID or Face ID required',
      supported: window?.ApplePaySession?.canMakePayments() || false
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      icon: GooglePayIcon,
      description: 'Pay with Google',
      supported: window?.google?.payments?.api || false
    },
    {
      id: 'klarna',
      name: 'Klarna',
      icon: KlarnaIcon,
      description: 'Buy now, pay later',
      supported: true
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Payment Method
      </h3>
      {paymentMethods.map((method) => (
        <div key={method.id}>
          <label
            className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
              selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : method.supported
                ? 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                : 'border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={(e) => onMethodChange(e.target.value)}
              disabled={!method.supported}
              className="sr-only"
            />

            <div className="flex items-center flex-1">
              <div className="w-6 h-6 mr-3">
                {typeof method.icon === 'string' ? (
                  <Image
                    src={method.icon}
                    alt={method.name}
                    width={24}
                    height={24}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <method.icon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-white">
                  {method.name}
                  {!method.supported && (
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                      (Not available)
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {method.description}
                </div>
              </div>

              <div className={`w-4 h-4 border-2 rounded-full ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}>
                {selectedMethod === method.id && (
                  <div className="w-full h-full rounded-full bg-white transform scale-50" />
                )}
              </div>
            </div>
          </label>
        </div>
      ))}
    </div>
  );
};

// Stripe Card Element Component
const CardPaymentForm = ({ onValidationChange }: { onValidationChange: (isValid: boolean) => void }) => {
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        fontFamily: '"Inter", sans-serif',
        '::placeholder': {
          color: '#9CA3AF',
        },
        iconColor: '#6B7280',
      },
      invalid: {
        color: '#EF4444',
        iconColor: '#EF4444',
      },
    },
    hidePostalCode: true,
  };

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
    onValidationChange(event.complete && !event.error);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
        <CardElement
          options={cardElementOptions}
          onChange={handleCardChange}
        />
      </div>

      {cardError && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {cardError}
        </div>
      )}

      {cardComplete && !cardError && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          Card details are valid
        </div>
      )}
    </div>
  );
};

// Shipping Form Component
const ShippingForm = ({
  values,
  errors,
  updateValue
}: {
  values: any;
  errors: Record<string, string>;
  updateValue: (name: string, value: string) => void;
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Contact Information
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={values.email || ''}
              onChange={(e) => updateValue('email', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.email ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
              }`}
              placeholder="your@email.com"
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              value={values.phone || ''}
              onChange={(e) => updateValue('phone', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.phone ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
              }`}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 mt-8">
        Shipping Address
      </h3>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Full Name *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={values.name || ''}
            onChange={(e) => updateValue('name', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.name ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
            }`}
            placeholder="John Doe"
          />
        </div>
        {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Address Line 1 *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={values.line1 || ''}
            onChange={(e) => updateValue('line1', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.line1 ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
            }`}
            placeholder="123 Main Street"
          />
        </div>
        {errors.line1 && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.line1}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Address Line 2 (Optional)
        </label>
        <input
          type="text"
          value={values.line2 || ''}
          onChange={(e) => updateValue('line2', e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Apartment, suite, etc."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            City *
          </label>
          <input
            type="text"
            value={values.city || ''}
            onChange={(e) => updateValue('city', e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.city ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
            }`}
            placeholder="New York"
          />
          {errors.city && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            State *
          </label>
          <input
            type="text"
            value={values.state || ''}
            onChange={(e) => updateValue('state', e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.state ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
            }`}
            placeholder="NY"
          />
          {errors.state && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            ZIP Code *
          </label>
          <input
            type="text"
            value={values.postal_code || ''}
            onChange={(e) => updateValue('postal_code', e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.postal_code ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
            }`}
            placeholder="10001"
          />
          {errors.postal_code && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.postal_code}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Country *
        </label>
        <select
          value={values.country || 'US'}
          onChange={(e) => updateValue('country', e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="FR">France</option>
          <option value="DE">Germany</option>
          <option value="IT">Italy</option>
          <option value="ES">Spain</option>
          <option value="AU">Australia</option>
          <option value="JP">Japan</option>
        </select>
      </div>
    </div>
  );
};

// Main Checkout Form Component
const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { state: cartState } = useCart();
  const {
    state: paymentState,
    createPaymentIntent,
    updatePaymentIntent,
    setShipping,
    setShippingMethod,
    calculateTotals,
    confirmPayment,
    initializeStripe
  } = usePayment();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [isCardValid, setIsCardValid] = useState(false);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'processing' | 'success'>('form');

  const initialFormState = {
    email: '',
    phone: '',
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US'
  };

  const { values, errors, updateValue, validateAll } = useFormValidation(initialFormState);

  // Use PaymentContext breakdown or fallback to manual calculation
  const breakdown = paymentState.breakdown;
  const subtotal = breakdown?.subtotal ?? cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = breakdown?.tax ?? 0;
  const shipping = breakdown?.shipping ?? 0;
  const total = breakdown?.total ?? (subtotal + tax + shipping);

  // Initialize Stripe on component mount (run only once)
  useEffect(() => {
    initializeStripe();
  }, []); // Empty dependency array to run only once

  // Calculate totals when cart items or shipping address changes
  useEffect(() => {
    if (cartState.items.length > 0) {
      calculateTotals(cartState.items);
    }
  }, [cartState.items, paymentState.shippingMethod, paymentState.shipping]); // Removed calculateTotals function

  // Create payment intent when cart changes (with guard to prevent infinite loops and duplicates)
  useEffect(() => {
    // Prevent duplicate payment intent creation
    if (cartState.items.length > 0 && !paymentState.paymentIntent && !isCreatingIntent) {
      setIsCreatingIntent(true);

      const metadata = {
        cartId: `cart_${Date.now()}`,
        reservationIds: cartState.items
          .map(item => item.reservationId)
          .filter(Boolean) as string[],
        // Include customer email if available (for guest checkouts)
        customer_email: values.email || null
      };

      console.log('🛒 Creating payment intent with cart items:', {
        itemCount: cartState.items.length,
        items: cartState.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        metadata
      });

      createPaymentIntent(cartState.items, metadata).finally(() => {
        setIsCreatingIntent(false);
      });
    }
  }, [cartState.items.length]); // Track only item count to reduce re-renders

  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  const handleShippingMethodChange = (methodId: string, pickupPoint?: PickupPoint) => {
    setShippingMethod(methodId, pickupPoint);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || cartState.items.length === 0) {
      return;
    }

    // Validate form
    if (!validateAll()) {
      return;
    }

    // For card payments, validate card element
    if (selectedPaymentMethod === 'card' && !isCardValid) {
      return;
    }

    setIsProcessing(true);
    setCheckoutStep('processing');

    try {
      // Update payment intent with customer email before processing
      if (paymentState.paymentIntent && values.email) {
        const updatedMetadata = {
          ...paymentState.paymentIntent.metadata,
          customer_email: values.email
        };

        // Update the payment intent metadata via API
        try {
          const response = await fetch('/api/stripe/update-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentIntentId: paymentState.paymentIntent.id,
              metadata: { customer_email: values.email }
            })
          });

          if (!response.ok) {
            console.warn('Failed to update payment metadata with email');
          }
        } catch (error) {
          console.warn('Error updating payment metadata:', error);
        }
      }

      // Set shipping address
      const shippingAddress: ShippingAddress = {
        name: values.name,
        line1: values.line1,
        line2: values.line2,
        city: values.city,
        state: values.state,
        postal_code: values.postal_code,
        country: values.country,
        email: values.email  // Include email in shipping address
      };

      setShipping(shippingAddress);

      // Update payment intent with shipping and billing address
      try {
        console.log('🔄 Updating payment intent with shipping address:', {
          itemCount: cartState.items.length,
          items: cartState.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          shippingAddress,
          email: values.email
        });

        // Update payment intent with shipping address via Stripe API
        const updateResponse = await fetch('/api/stripe/update-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentState.paymentIntent!.id,
            items: cartState.items,
            shipping: {
              name: values.name,
              address: shippingAddress
            },
            metadata: {
              cartId: `cart_${Date.now()}`,
              reservationIds: cartState.items
                .map(item => item.reservationId)
                .filter(Boolean) as string[],
              customer_email: values.email,
              // Add billing address to metadata
              billingAddress: JSON.stringify({
                name: values.name,
                line1: values.line1,
                line2: values.line2,
                city: values.city,
                state: values.state,
                postal_code: values.postal_code,
                country: values.country,
                email: values.email,
                phone: values.phone
              })
            }
          })
        });

        if (!updateResponse.ok) {
          console.warn('Failed to update payment intent with address:', await updateResponse.text());
        }
      } catch (updateError) {
        console.warn('Failed to update payment intent metadata:', updateError);
        // Continue with payment even if metadata update fails
      }

      // Handle different payment methods
      let result;

      switch (selectedPaymentMethod) {
        case 'card':
          const cardElement = elements.getElement(CardElement);
          if (!cardElement) throw new Error('Card element not found');

          result = await stripe.confirmCardPayment(paymentState.paymentIntent!.clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: values.name,
                email: values.email,
                phone: values.phone,
                address: {
                  line1: values.line1,
                  line2: values.line2,
                  city: values.city,
                  state: values.state,
                  postal_code: values.postal_code,
                  country: values.country,
                },
              },
            },
          });
          break;

        case 'paypal':
          // PayPal integration through Stripe
          result = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: `${window.location.origin}/order/success`,
            },
          });
          break;

        case 'apple_pay':
        case 'google_pay':
          // Handle digital wallet payments
          result = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: `${window.location.origin}/order/success`,
            },
          });
          break;

        case 'klarna':
          // Klarna BNPL through Stripe
          result = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: `${window.location.origin}/order/success`,
            },
          });
          break;

        default:
          throw new Error('Unsupported payment method');
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Payment successful
      setCheckoutStep('success');

      // Create order in database after successful payment
      try {
        const orderResponse = await fetch('/api/orders/create-from-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentState.paymentIntent!.id
          }),
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          console.error('Failed to create order:', errorData);
          // Still redirect to success since payment went through
        } else {
          const orderData = await orderResponse.json();
          console.log('✅ Order created successfully:', orderData);
        }
      } catch (orderError) {
        console.error('Error creating order:', orderError);
        // Still redirect to success since payment went through
      }

      // Redirect to success page with payment intent ID after a delay
      setTimeout(() => {
        const paymentIntentId = paymentState.paymentIntent?.id;
        if (paymentIntentId) {
          router.push(`/order/success?payment_intent=${paymentIntentId}`);
        } else {
          router.push('/order/success');
        }
      }, 2000);

    } catch (error) {
      console.error('Payment failed:', error);
      setCheckoutStep('form');
      setIsProcessing(false);
      // You could set an error state here to show to the user
    }
  };

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Package className="w-24 h-24 text-slate-400 dark:text-slate-600 mx-auto mb-8" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Your cart is empty
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Add some items to your cart before proceeding to checkout.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Checkout
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Complete your order securely
          </p>
        </div>

        {checkoutStep === 'processing' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Processing Payment
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Please wait while we process your payment...
                </p>
              </div>
            </div>
          </div>
        )}

        {checkoutStep === 'success' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Payment Successful!
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Redirecting to your order confirmation...
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Shipping Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <ShippingForm values={values} errors={errors} updateValue={updateValue} />
              </div>

              {/* Shipping Options */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <ShippingOptionsSelector
                  subtotal={subtotal}
                  selectedMethod={paymentState.shippingMethod}
                  onMethodChange={handleShippingMethodChange}
                  countryCode={values.country || 'US'}
                  postalCode={values.postal_code}
                />
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <PaymentMethodSelector
                  selectedMethod={selectedPaymentMethod}
                  onMethodChange={handlePaymentMethodChange}
                />

                {/* Card Payment Form */}
                {selectedPaymentMethod === 'card' && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-slate-900 dark:text-white mb-4">
                      Card Details
                    </h4>
                    <CardPaymentForm onValidationChange={setIsCardValid} />
                  </div>
                )}

                {/* Alternative payment method messages */}
                {selectedPaymentMethod === 'paypal' && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      You will be redirected to PayPal to complete your payment.
                    </p>
                  </div>
                )}

                {(selectedPaymentMethod === 'apple_pay' || selectedPaymentMethod === 'google_pay') && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Use your device's biometric authentication to complete the payment.
                    </p>
                  </div>
                )}

                {selectedPaymentMethod === 'klarna' && (
                  <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      You will be redirected to Klarna to set up your payment plan.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isProcessing ||
                  !stripe ||
                  cartState.items.length === 0 ||
                  (selectedPaymentMethod === 'card' && !isCardValid)
                }
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {cartState.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {item.brand} • Size {item.size} • {item.color}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Qty: {item.quantity}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white text-sm">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Shipping</span>
                    {breakdown?.shippingMethod && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {breakdown.shippingMethod.name}
                        {breakdown.pickupPoint && ` - ${breakdown.pickupPoint.name}`}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Tax</span>
                    {breakdown?.taxBreakdown && breakdown.taxBreakdown.rate > 0 && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {(breakdown.taxBreakdown.rate * 100).toFixed(1)}% tax rate
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    ${tax.toFixed(2)}
                  </span>
                </div>

                <hr className="border-slate-200 dark:border-slate-700" />

                <div className="flex justify-between text-lg">
                  <span className="font-bold text-slate-900 dark:text-white">Total</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                <Shield className="w-4 h-4" />
                <span>256-bit SSL encryption</span>
              </div>

              {/* Free Shipping Progress */}
              {shipping > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Add ${(50 - subtotal).toFixed(2)} more for free shipping
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((subtotal / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Checkout Page Component
export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}