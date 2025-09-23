'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isOnSale?: boolean;
  dateAdded: string;
  slug: string;
}

interface WishlistState {
  items: WishlistItem[];
  itemCount: number;
}

type WishlistAction =
  | { type: 'ADD_ITEM'; payload: WishlistItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_WISHLIST' }
  | { type: 'LOAD_WISHLIST'; payload: WishlistItem[] };

const wishlistReducer = (state: WishlistState, action: WishlistAction): WishlistState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Check if item already exists
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId
      );

      if (existingItemIndex > -1) {
        // Item already exists, don't add duplicate
        return state;
      }

      const newItems = [...state.items, action.payload];

      return {
        ...state,
        items: newItems,
        itemCount: newItems.length
      };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.productId !== action.payload);

      return {
        ...state,
        items: newItems,
        itemCount: newItems.length
      };
    }

    case 'CLEAR_WISHLIST':
      return {
        ...state,
        items: [],
        itemCount: 0
      };

    case 'LOAD_WISHLIST': {
      return {
        ...state,
        items: action.payload,
        itemCount: action.payload.length
      };
    }

    default:
      return state;
  }
};

interface WishlistContextType {
  state: WishlistState;
  addItem: (item: WishlistItem) => boolean;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (item: WishlistItem) => { added: boolean; message: string };
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const initialState: WishlistState = {
  items: [],
  itemCount: 0
};

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem('sneaker-store-wishlist');
    if (savedWishlist) {
      try {
        const parsedWishlist = JSON.parse(savedWishlist);
        dispatch({ type: 'LOAD_WISHLIST', payload: parsedWishlist });
      } catch (error) {
        console.error('Error loading wishlist from localStorage:', error);
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sneaker-store-wishlist', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (item: WishlistItem): boolean => {
    const isAlreadyInWishlist = state.items.some(wishlistItem => wishlistItem.productId === item.productId);
    if (!isAlreadyInWishlist) {
      dispatch({ type: 'ADD_ITEM', payload: item });
      return true;
    }
    return false;
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const clearWishlist = () => {
    dispatch({ type: 'CLEAR_WISHLIST' });
  };

  const isInWishlist = (productId: string): boolean => {
    return state.items.some(item => item.productId === productId);
  };

  const toggleWishlist = (item: WishlistItem): { added: boolean; message: string } => {
    const alreadyInWishlist = isInWishlist(item.productId);

    if (alreadyInWishlist) {
      removeItem(item.productId);
      return { added: false, message: 'Removed from wishlist' };
    } else {
      addItem(item);
      return { added: true, message: 'Added to wishlist!' };
    }
  };

  const value: WishlistContextType = {
    state,
    addItem,
    removeItem,
    clearWishlist,
    isInWishlist,
    toggleWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}