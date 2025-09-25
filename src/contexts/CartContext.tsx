'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  syncCartToDatabase,
  loadCartFromDatabase,
  validateStockLevels,
  createStockReservation,
  releaseStockReservation,
  extendStockReservation,
  validateReservation,
  cleanupExpiredReservations
} from '../../lib/cart-utils-fixed';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  maxStock: number;
  reservationId?: string;
  reservationExpiry?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isOpen: boolean;
  isLoading: boolean;
  stockIssues: { itemId: string; message: string; availableStock: number }[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STOCK_ISSUES'; payload: { itemId: string; message: string; availableStock: number }[] }
  | { type: 'UPDATE_RESERVATION'; payload: { itemId: string; reservationId: string; expiry: string } };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item =>
          item.productId === action.payload.productId &&
          item.variantId === action.payload.variantId &&
          item.size === action.payload.size &&
          item.color === action.payload.color
      );

      let newItems: CartItem[];

      if (existingItemIndex > -1) {
        // Update existing item quantity
        newItems = state.items.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = Math.min(
              item.quantity + action.payload.quantity,
              item.maxStock
            );
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
      } else {
        // Add new item
        const newItem: CartItem = {
          ...action.payload,
          id: `${action.payload.productId}-${action.payload.variantId || 'default'}-${action.payload.size}-${action.payload.color}-${Date.now()}`
        };
        newItems = [...state.items, newItem];
      }

      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...state,
        items: newItems,
        total,
        itemCount
      };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...state,
        items: newItems,
        total,
        itemCount
      };
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item => {
        if (item.id === action.payload.id) {
          const newQuantity = Math.max(0, Math.min(action.payload.quantity, item.maxStock));
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);

      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...state,
        items: newItems,
        total,
        itemCount
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0
      };

    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen
      };

    case 'OPEN_CART':
      return {
        ...state,
        isOpen: true
      };

    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false
      };

    case 'LOAD_CART': {
      const total = action.payload.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = action.payload.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...state,
        items: action.payload,
        total,
        itemCount
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_STOCK_ISSUES':
      return {
        ...state,
        stockIssues: action.payload
      };

    case 'UPDATE_RESERVATION': {
      const newItems = state.items.map(item => {
        if (item.id === action.payload.itemId) {
          return {
            ...item,
            reservationId: action.payload.reservationId,
            reservationExpiry: action.payload.expiry
          };
        }
        return item;
      });

      return {
        ...state,
        items: newItems
      };
    }

    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  addToCartWithNotification: (item: Omit<CartItem, 'id'>) => Promise<void>;
  validateStockAndUpdate: () => Promise<void>;
  syncToDatabase: () => Promise<void>;
  extendReservations: () => Promise<void>;
  validateReservations: () => Promise<boolean>;
  getReservationExpiryTimes: () => { itemId: string; expiresAt: string; timeRemaining: number }[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isOpen: false,
  isLoading: false,
  stockIssues: []
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage and database on mount
  useEffect(() => {
    const loadInitialCart = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        // First try to load from database
        const dbCart = await loadCartFromDatabase();

        if (dbCart.length > 0) {
          dispatch({ type: 'LOAD_CART', payload: dbCart });
        } else {
          // Fallback to localStorage
          const savedCart = localStorage.getItem('sneaker-store-cart');
          if (savedCart) {
            try {
              const parsedCart = JSON.parse(savedCart);
              dispatch({ type: 'LOAD_CART', payload: parsedCart });
              // Sync localStorage cart to database
              await syncCartToDatabase(parsedCart);
            } catch (error) {
              console.error('Error loading cart from localStorage:', error);
            }
          }
        }

        // Clean up expired reservations
        await cleanupExpiredReservations();
      } catch (error) {
        console.error('Error loading initial cart:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadInitialCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sneaker-store-cart', JSON.stringify(state.items));
  }, [state.items]);

  // Periodic stock and reservation validation (every 30 seconds)
  useEffect(() => {
    if (state.items.length === 0) return;

    const interval = setInterval(async () => {
      // Validate stock levels
      const { valid, issues } = await validateStockLevels(state.items);

      if (!valid) {
        dispatch({ type: 'SET_STOCK_ISSUES', payload: issues });

        // Remove items that are completely out of stock
        issues.forEach(issue => {
          if (issue.availableStock === 0) {
            dispatch({ type: 'REMOVE_ITEM', payload: issue.itemId });
          }
        });
      } else {
        dispatch({ type: 'SET_STOCK_ISSUES', payload: [] });
      }

      // Also validate reservations
      try {
        await validateReservations();
      } catch (error) {
        console.error('Error validating reservations:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [state.items.length]);

  const addItem = async (item: Omit<CartItem, 'id'>) => {
    // First check if we can create a reservation before adding to cart
    const reservationId = await createStockReservation({
      ...item,
      id: 'temp' // Will be replaced by the reducer
    });

    if (!reservationId) {
      // Unable to reserve stock - throw error to be handled by UI
      throw new Error(`Unable to add ${item.name} to cart - insufficient stock available`);
    }

    // Only add to cart if reservation was successful
    dispatch({ type: 'ADD_ITEM', payload: item });

    // Update with reservation details
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15);

    const itemId = `${item.productId}-${item.variantId || 'default'}-${item.size}-${item.color}-${Date.now()}`;

    dispatch({
      type: 'UPDATE_RESERVATION',
      payload: {
        itemId,
        reservationId,
        expiry: expiry.toISOString()
      }
    });

    // Sync to database
    await syncToDatabase();
  };

  const removeItem = async (id: string) => {
    // Find the item being removed to release its reservation
    const item = state.items.find(item => item.id === id);
    if (item && item.reservationId) {
      try {
        await releaseStockReservation(item.reservationId);
      } catch (error) {
        console.error('Error releasing reservation:', error);
      }
    }

    dispatch({ type: 'REMOVE_ITEM', payload: id });
    await syncToDatabase();
  };

  const updateQuantity = async (id: string, quantity: number) => {
    const item = state.items.find(item => item.id === id);
    if (!item) return;

    // If quantity is 0, remove the item
    if (quantity <= 0) {
      await removeItem(id);
      return;
    }

    // If we have a reservation and quantity changed, we need to manage reservations
    if (item.reservationId && quantity !== item.quantity) {
      try {
        // Release the old reservation
        await releaseStockReservation(item.reservationId);

        // Create a new reservation with the new quantity
        const newReservationId = await createStockReservation({
          ...item,
          quantity
        });

        if (!newReservationId) {
          throw new Error('Unable to reserve the requested quantity');
        }

        // Update the item with new reservation
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 15);

        dispatch({
          type: 'UPDATE_RESERVATION',
          payload: {
            itemId: id,
            reservationId: newReservationId,
            expiry: expiry.toISOString()
          }
        });
      } catch (error) {
        console.error('Error updating reservation:', error);
        throw error; // Let the UI handle the error
      }
    }

    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    await syncToDatabase();
  };

  const clearCart = async () => {
    // Release all active reservations before clearing cart
    const itemsWithReservations = state.items.filter(item => item.reservationId);

    await Promise.all(
      itemsWithReservations.map(async (item) => {
        if (item.reservationId) {
          try {
            await releaseStockReservation(item.reservationId);
          } catch (error) {
            console.error(`Error releasing reservation for ${item.name}:`, error);
          }
        }
      })
    );

    dispatch({ type: 'CLEAR_CART' });
    await syncToDatabase();
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const addToCartWithNotification = async (item: Omit<CartItem, 'id'>) => {
    await addItem(item);

    // Auto-open cart briefly to show the item was added
    openCart();

    // Auto-close after 3 seconds if user doesn't interact
    setTimeout(() => {
      closeCart();
    }, 3000);
  };

  const validateStockAndUpdate = async () => {
    if (state.items.length === 0) return;

    const { valid, issues } = await validateStockLevels(state.items);

    if (!valid) {
      dispatch({ type: 'SET_STOCK_ISSUES', payload: issues });

      // Remove items that are completely out of stock
      issues.forEach(issue => {
        if (issue.availableStock === 0) {
          removeItem(issue.itemId);
        }
      });
    } else {
      dispatch({ type: 'SET_STOCK_ISSUES', payload: [] });
    }
  };

  const syncToDatabase = async () => {
    try {
      await syncCartToDatabase(state.items);
    } catch (error) {
      console.error('Error syncing cart to database:', error);
    }
  };

  // Extend all active reservations by 15 minutes
  const extendReservations = async () => {
    const itemsWithReservations = state.items.filter(item => item.reservationId);

    for (const item of itemsWithReservations) {
      if (item.reservationId) {
        try {
          const extended = await extendStockReservation(item.reservationId, 15);
          if (extended) {
            const newExpiry = new Date();
            newExpiry.setMinutes(newExpiry.getMinutes() + 15);

            dispatch({
              type: 'UPDATE_RESERVATION',
              payload: {
                itemId: item.id,
                reservationId: item.reservationId,
                expiry: newExpiry.toISOString()
              }
            });
          }
        } catch (error) {
          console.error(`Error extending reservation for ${item.name}:`, error);
        }
      }
    }
  };

  // Validate all reservations are still active and valid
  const validateReservations = async (): Promise<boolean> => {
    const itemsWithReservations = state.items.filter(item => item.reservationId);

    if (itemsWithReservations.length === 0) {
      return true; // No reservations to validate
    }

    let allValid = true;
    const expiredItems: string[] = [];

    for (const item of itemsWithReservations) {
      if (item.reservationId) {
        try {
          const validation = await validateReservation(item.reservationId);
          if (!validation.valid) {
            allValid = false;
            expiredItems.push(item.id);
            console.warn(`Reservation expired for ${item.name}: ${validation.reason}`);
          }
        } catch (error) {
          console.error(`Error validating reservation for ${item.name}:`, error);
          allValid = false;
          expiredItems.push(item.id);
        }
      }
    }

    // Remove items with expired reservations
    expiredItems.forEach(itemId => {
      dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    });

    if (expiredItems.length > 0) {
      // Update stock issues to notify user
      dispatch({
        type: 'SET_STOCK_ISSUES',
        payload: expiredItems.map(itemId => {
          const item = state.items.find(i => i.id === itemId);
          return {
            itemId,
            message: 'Reservation expired - item removed from cart',
            availableStock: 0
          };
        })
      });
    }

    return allValid;
  };

  // Get expiry times for all reservations
  const getReservationExpiryTimes = () => {
    return state.items
      .filter(item => item.reservationId && item.reservationExpiry)
      .map(item => {
        const expiresAt = item.reservationExpiry!;
        const timeRemaining = new Date(expiresAt).getTime() - Date.now();

        return {
          itemId: item.id,
          expiresAt,
          timeRemaining: Math.max(0, timeRemaining)
        };
      });
  };

  const value: CartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    addToCartWithNotification,
    validateStockAndUpdate,
    syncToDatabase,
    extendReservations,
    validateReservations,
    getReservationExpiryTimes
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}