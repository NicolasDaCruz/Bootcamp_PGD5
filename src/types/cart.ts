// Cart and order-related type definitions

import { CartItem, OrderItem, Order, ProductVariant, Product } from './database';

// Extended cart types
export interface CartItemWithDetails extends CartItem {
  variant: ProductVariant & {
    product: Product;
  };
}

export interface Cart {
  items: CartItemWithDetails[];
  totalItems: number;
  totalPrice: number;
  subtotal: number;
  tax: number;
  shipping: number;
}

// Order types
export interface OrderWithItems extends Order {
  items: (OrderItem & {
    variant: ProductVariant & {
      product: Product;
    };
  })[];
}

export interface OrderSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

// Checkout types
export interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface BillingAddress extends ShippingAddress {
  sameAsShipping: boolean;
}

export interface CheckoutData {
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  shippingMethod: {
    id: string;
    name: string;
    price: number;
    estimatedDays: number;
  };
  paymentMethod: {
    type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
    cardLast4?: string;
  };
}

// Payment types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  clientSecret?: string;
}

// Cart actions
export type CartAction =
  | { type: 'ADD_ITEM'; payload: { variantId: string; quantity: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: { items: CartItemWithDetails[] } };

// Order status
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderTracking {
  status: OrderStatus;
  trackingNumber?: string;
  estimatedDelivery?: string;
  updates: {
    status: OrderStatus;
    message: string;
    timestamp: string;
    location?: string;
  }[];
}