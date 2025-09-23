export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryTime: string;
  icon: string;
  available: boolean;
}

export interface ShippingCalculation {
  subtotal: number;
  method: ShippingMethod;
  cost: number;
  isFree: boolean;
  freeShippingThreshold?: number;
}

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  distance?: number;
  openingHours: string[];
}

// Standard shipping methods
export const getShippingMethods = (subtotal: number, countryCode: string = 'US'): ShippingMethod[] => {
  const isEuropean = ['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'PT', 'AT', 'IE'].includes(countryCode);
  const freeShippingThreshold = 50;

  const methods: ShippingMethod[] = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      description: subtotal >= freeShippingThreshold
        ? 'Free shipping (5-7 business days)'
        : `$${(subtotal >= freeShippingThreshold ? 0 : 9.99).toFixed(2)} (5-7 business days)`,
      price: subtotal >= freeShippingThreshold ? 0 : 9.99,
      deliveryTime: '5-7 business days',
      icon: '/icons/shipping-standard.svg',
      available: true
    },
    {
      id: 'express',
      name: 'Express Shipping',
      description: '$19.99 (1-2 business days)',
      price: 19.99,
      deliveryTime: '1-2 business days',
      icon: '/icons/shipping-express.svg',
      available: true
    }
  ];

  // Add Point Relais for European countries
  if (isEuropean) {
    methods.push({
      id: 'point_relais',
      name: 'Point Relais',
      description: '$4.99 (3-5 business days to pickup point)',
      price: 4.99,
      deliveryTime: '3-5 business days',
      icon: '/icons/shipping-pickup.svg',
      available: true
    });
  }

  return methods;
};

export const calculateShipping = (
  subtotal: number,
  methodId: string,
  countryCode: string = 'US'
): ShippingCalculation => {
  const methods = getShippingMethods(subtotal, countryCode);
  const method = methods.find(m => m.id === methodId) || methods[0];

  const cost = method.price;
  const isFree = cost === 0;
  const freeShippingThreshold = 50;

  return {
    subtotal,
    method,
    cost,
    isFree,
    freeShippingThreshold: methodId === 'standard' ? freeShippingThreshold : undefined
  };
};

// Mock Mondial Relay API integration
export const searchPickupPoints = async (
  postalCode: string,
  countryCode: string = 'FR'
): Promise<PickupPoint[]> => {
  // In a real implementation, this would call the Mondial Relay API
  // For now, return mock data
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

  const mockPoints: PickupPoint[] = [
    {
      id: 'mr_001',
      name: 'Relay Point - City Center',
      address: '123 Main Street',
      city: 'Paris',
      postalCode: '75001',
      distance: 0.5,
      openingHours: ['Mon-Fri: 9:00-18:00', 'Sat: 9:00-17:00', 'Sun: Closed']
    },
    {
      id: 'mr_002',
      name: 'Pharmacy Relay',
      address: '456 Avenue de la République',
      city: 'Paris',
      postalCode: '75002',
      distance: 1.2,
      openingHours: ['Mon-Sat: 8:30-19:30', 'Sun: 9:00-13:00']
    },
    {
      id: 'mr_003',
      name: 'Tobacco Shop Relay',
      address: '789 Rue de Rivoli',
      city: 'Paris',
      postalCode: '75001',
      distance: 0.8,
      openingHours: ['Mon-Fri: 7:00-20:00', 'Sat: 8:00-19:00', 'Sun: 9:00-18:00']
    }
  ];

  return mockPoints.filter(point =>
    point.postalCode.startsWith(postalCode.substring(0, 2))
  );
};

// Tax calculation utilities
export interface TaxCalculation {
  amount: number;
  rate: number;
  breakdown: {
    stateTax?: number;
    localTax?: number;
    vatTax?: number;
  };
}

export const calculateTax = (
  subtotal: number,
  shippingCost: number,
  address: {
    country: string;
    state?: string;
    postalCode?: string;
  }
): TaxCalculation => {
  const taxableAmount = subtotal + shippingCost;

  // Different tax rules based on country
  switch (address.country) {
    case 'US':
      // US state sales tax (simplified)
      const stateTaxRates: Record<string, number> = {
        'CA': 0.0725, // California
        'NY': 0.08,   // New York
        'TX': 0.0625, // Texas
        'FL': 0.06,   // Florida
        'WA': 0.065,  // Washington
        // Add more states as needed
      };

      const stateRate = stateTaxRates[address.state || ''] || 0.05; // Default 5%
      const stateTax = taxableAmount * stateRate;

      return {
        amount: stateTax,
        rate: stateRate,
        breakdown: { stateTax }
      };

    case 'FR':
    case 'DE':
    case 'IT':
    case 'ES':
    case 'NL':
    case 'BE':
    case 'PT':
    case 'AT':
    case 'IE':
      // EU VAT rates (simplified)
      const vatRates: Record<string, number> = {
        'FR': 0.20,  // France 20%
        'DE': 0.19,  // Germany 19%
        'IT': 0.22,  // Italy 22%
        'ES': 0.21,  // Spain 21%
        'NL': 0.21,  // Netherlands 21%
        'BE': 0.21,  // Belgium 21%
        'PT': 0.23,  // Portugal 23%
        'AT': 0.20,  // Austria 20%
        'IE': 0.23,  // Ireland 23%
      };

      const vatRate = vatRates[address.country] || 0.20; // Default 20%
      const vatTax = taxableAmount * vatRate;

      return {
        amount: vatTax,
        rate: vatRate,
        breakdown: { vatTax }
      };

    case 'GB':
      // UK VAT
      const ukVatRate = 0.20; // 20% VAT
      const ukVatTax = taxableAmount * ukVatRate;

      return {
        amount: ukVatTax,
        rate: ukVatRate,
        breakdown: { vatTax: ukVatTax }
      };

    case 'CA':
      // Canada GST/HST (simplified)
      const gstRate = 0.05; // Federal GST 5%
      const provincialRates: Record<string, number> = {
        'ON': 0.08, // Ontario HST (total 13%)
        'QC': 0.09975, // Quebec PST
        'BC': 0.07, // BC PST
        // Add more provinces
      };

      const provincialRate = provincialRates[address.state || ''] || 0.05;
      const totalRate = gstRate + provincialRate;
      const totalTax = taxableAmount * totalRate;

      return {
        amount: totalTax,
        rate: totalRate,
        breakdown: {
          stateTax: taxableAmount * gstRate,
          localTax: taxableAmount * provincialRate
        }
      };

    default:
      // No tax for other countries or default case
      return {
        amount: 0,
        rate: 0,
        breakdown: {}
      };
  }
};

// Stripe Tax API integration (for more accurate tax calculation)
export const calculateTaxWithStripe = async (
  items: Array<{
    amount: number;
    reference: string;
  }>,
  shipping: {
    amount: number;
  },
  customerDetails: {
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postal_code: string;
      country: string;
    };
  }
): Promise<TaxCalculation> => {
  try {
    // In a real implementation, this would call the Stripe Tax API
    // For now, fall back to local calculation
    const fallbackTax = calculateTax(
      items.reduce((sum, item) => sum + item.amount, 0),
      shipping.amount,
      {
        country: customerDetails.address.country,
        state: customerDetails.address.state,
        postalCode: customerDetails.address.postal_code
      }
    );

    return fallbackTax;
  } catch (error) {
    console.error('Error calculating tax with Stripe:', error);

    // Fallback to local calculation
    return calculateTax(
      items.reduce((sum, item) => sum + item.amount, 0),
      shipping.amount,
      {
        country: customerDetails.address.country,
        state: customerDetails.address.state,
        postalCode: customerDetails.address.postal_code
      }
    );
  }
};