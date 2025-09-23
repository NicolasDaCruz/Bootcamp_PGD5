// KicksDB API Integration
import type {
  KicksDBProduct,
  KicksDBSearchResponse,
  KicksDBSearchParams,
} from '@/types/product';

const KICKSDB_API_KEY = process.env.KICKSDB_API_KEY || 'sd_PD1PSXLR57KlaYforzqrwYE30bD2DaPj';
const KICKSDB_BASE_URL = 'https://api.kicksdb.com/v1';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
let lastRequestTime = 0;

// Rate limiting helper
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve =>
      setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();
};

// API client class
export class KicksDBClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = KICKSDB_API_KEY, baseUrl: string = KICKSDB_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    await waitForRateLimit();

    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add API key and parameters
    const searchParams = new URLSearchParams({
      key: this.apiKey,
      ...params,
    });

    url.search = searchParams.toString();

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SneakerStore/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`KicksDB API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('KicksDB API request failed:', error);
      throw error;
    }
  }

  // Search for sneakers by query
  async searchSneakers(params: KicksDBSearchParams): Promise<KicksDBSearchResponse> {
    const searchParams = {
      ...params,
      limit: params.limit || 20,
      page: params.page || 1,
    };

    return this.makeRequest<KicksDBSearchResponse>('/search', searchParams);
  }

  // Get product details by ID
  async getProductById(id: string): Promise<KicksDBProduct> {
    return this.makeRequest<KicksDBProduct>(`/products/${id}`);
  }

  // Search by brand
  async searchByBrand(brand: string, limit: number = 20, page: number = 1): Promise<KicksDBSearchResponse> {
    return this.searchSneakers({ brand, limit, page });
  }

  // Search by year
  async searchByYear(year: number, limit: number = 20): Promise<KicksDBSearchResponse> {
    return this.searchSneakers({ year, limit });
  }

  // Get trending sneakers
  async getTrending(limit: number = 20): Promise<KicksDBSearchResponse> {
    return this.makeRequest<KicksDBSearchResponse>('/trending', { limit });
  }

  // Get latest releases
  async getLatestReleases(limit: number = 20): Promise<KicksDBSearchResponse> {
    return this.makeRequest<KicksDBSearchResponse>('/latest', { limit });
  }
}

// Default client instance
export const kicksdb = new KicksDBClient();

// Popular brands configuration
export const POPULAR_BRANDS = [
  'Nike',
  'Adidas',
  'Jordan',
  'Yeezy',
  'New Balance',
  'Converse',
  'Vans',
  'Puma',
  'Reebok',
  'ASICS',
] as const;

// Size configurations by category
export const SIZE_CATEGORIES = {
  kids: {
    range: [28, 39],
    popular: [32, 33, 34, 35, 36],
    label: 'Kids',
  },
  women: {
    range: [35, 42],
    popular: [37, 38, 39, 40],
    label: 'Women',
  },
  men: {
    range: [38, 48],
    popular: [41, 42, 43, 44],
    label: 'Men',
  },
} as const;

// Generate realistic size availability
export const generateSizeStock = (category: keyof typeof SIZE_CATEGORIES, isRare: boolean = false) => {
  const config = SIZE_CATEGORIES[category];
  const sizes: { size: string; stock: number }[] = [];

  for (let size = config.range[0]; size <= config.range[1]; size++) {
    const sizeString = `${size}`;
    const isPopular = config.popular.includes(size as never);

    let stock = 0;
    if (isRare) {
      // Rare shoes have very limited stock
      stock = isPopular ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2);
    } else {
      // Regular shoes have more stock, popular sizes have more
      stock = isPopular
        ? Math.floor(Math.random() * 20) + 10
        : Math.floor(Math.random() * 10) + 2;
    }

    sizes.push({ size: sizeString, stock });
  }

  return sizes;
};

// Generate color variations for a product
export const generateColorVariations = (_baseImages: string[]): string[] => {
  const variations = ['Black', 'White', 'Red', 'Blue', 'Grey'];
  return variations.slice(0, Math.floor(Math.random() * 3) + 1);
};

// Extract and optimize images
export const extractProductImages = (kicksProduct: KicksDBProduct): string[] => {
  const images: string[] = [];

  if (kicksProduct.image) {
    // Add all available image sizes
    if (kicksProduct.image.original) images.push(kicksProduct.image.original);
    if (kicksProduct.image.small) images.push(kicksProduct.image.small);
    if (kicksProduct.image.thumbnail) images.push(kicksProduct.image.thumbnail);
  }

  // Remove duplicates and ensure we have at least one image
  const uniqueImages = [...new Set(images)];
  return uniqueImages.length > 0 ? uniqueImages : ['/placeholder-sneaker.jpg'];
};

// Generate product slug from name and brand
export const generateProductSlug = (name: string, brand: string): string => {
  const combined = `${brand} ${name}`;
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

// Determine if a product is rare/limited based on name
export const isRareProduct = (name: string): boolean => {
  const rareKeywords = [
    'limited',
    'exclusive',
    'collab',
    'collaboration',
    'off-white',
    'travis scott',
    'fragment',
    'dior',
    'supreme',
    'kaws',
    'trophy room',
    'union',
  ];

  const lowerName = name.toLowerCase();
  return rareKeywords.some(keyword => lowerName.includes(keyword));
};

// API helper functions for bulk operations
export const fetchProductsByBrand = async (
  brand: string,
  limit: number = 20
): Promise<KicksDBProduct[]> => {
  try {
    const response = await kicksdb.searchByBrand(brand, limit);
    return response.products || [];
  } catch (error) {
    console.error(`Failed to fetch products for brand ${brand}:`, error);
    return [];
  }
};

export const fetchAllBrandsData = async (): Promise<{
  brand: string;
  products: KicksDBProduct[];
}[]> => {
  const results = [];

  for (const brand of POPULAR_BRANDS) {
    console.log(`Fetching products for ${brand}...`);
    const products = await fetchProductsByBrand(brand, 20);
    results.push({ brand, products });

    // Add delay between brand requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
};