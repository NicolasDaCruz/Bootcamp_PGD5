// Declare gtag function for Google Analytics
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, any>) => void;
  }
}

// Helper function to safely call gtag
const gtag = (command: string, targetId: string, config?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(command, targetId, config);
  }
};

// Google Analytics configuration
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Initialize Google Analytics
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID) {
    gtag('config', GA_TRACKING_ID, {
      page_location: url,
    });
  }
};

// Track custom events
export const event = (action: string, parameters: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID) {
    gtag('event', action, parameters);
  }
};

// Enhanced Ecommerce Events
export const trackPurchase = (transactionId: string, items: any[], value: number, currency = 'USD') => {
  event('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_brand: item.brand,
      price: item.price,
      quantity: item.quantity,
    }))
  });
};

export const trackAddToCart = (item: any, value: number, currency = 'USD') => {
  event('add_to_cart', {
    currency: currency,
    value: value,
    items: [{
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_brand: item.brand,
      price: item.price,
      quantity: item.quantity,
    }]
  });
};

export const trackRemoveFromCart = (item: any, value: number, currency = 'USD') => {
  event('remove_from_cart', {
    currency: currency,
    value: value,
    items: [{
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_brand: item.brand,
      price: item.price,
      quantity: item.quantity,
    }]
  });
};

export const trackViewItem = (item: any, value: number, currency = 'USD') => {
  event('view_item', {
    currency: currency,
    value: value,
    items: [{
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_brand: item.brand,
      price: item.price,
    }]
  });
};

export const trackBeginCheckout = (items: any[], value: number, currency = 'USD') => {
  event('begin_checkout', {
    currency: currency,
    value: value,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_brand: item.brand,
      price: item.price,
      quantity: item.quantity,
    }))
  });
};

export const trackSearch = (searchTerm: string) => {
  event('search', {
    search_term: searchTerm,
  });
};

export const trackSelectItem = (item: any, listName?: string) => {
  event('select_item', {
    item_list_name: listName || 'Search Results',
    items: [{
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_brand: item.brand,
      price: item.price,
    }]
  });
};

export const trackViewItemList = (items: any[], listName: string) => {
  event('view_item_list', {
    item_list_name: listName,
    items: items.slice(0, 20).map(item => ({ // Limit to first 20 items
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_brand: item.brand,
      price: item.price,
    }))
  });
};

export const trackLogin = (method?: string) => {
  event('login', {
    method: method || 'email',
  });
};

export const trackSignUp = (method?: string) => {
  event('sign_up', {
    method: method || 'email',
  });
};

// Custom dimension tracking
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID) {
    gtag('config', GA_TRACKING_ID, {
      custom_map: properties,
    });
  }
};

// Track user loyalty level
export const trackUserLoyalty = (level: 'new' | 'returning' | 'loyal' | 'vip') => {
  setUserProperties({ loyalty_level: level });
};

// Track traffic source
export const trackTrafficSource = (source: string, medium?: string, campaign?: string) => {
  setUserProperties({
    traffic_source: source,
    traffic_medium: medium,
    traffic_campaign: campaign,
  });
};