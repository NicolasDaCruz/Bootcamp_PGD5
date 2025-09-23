// Product-related type definitions

import { Product, ProductVariant, Category } from './database';

// Extended product types with relationships
export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  category: Category;
  brand?: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  };
}

export interface ProductVariantWithProduct extends ProductVariant {
  product: Product;
}

// KicksDB API types
export interface KicksDBProduct {
  id: string;
  name: string;
  brand: string;
  silhouette: string;
  retailPrice: number;
  releaseDate: string;
  description: string;
  image: {
    original: string;
    small: string;
    thumbnail: string;
  };
  links: {
    stockX: string;
    goat: string;
    flightClub: string;
  };
}

export interface KicksDBSearchResponse {
  products: KicksDBProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface KicksDBSearchParams {
  name?: string;
  brand?: string;
  year?: number;
  limit?: number;
  page?: number;
}

// Product filtering and search
export interface ProductFilters {
  brands?: string[];
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  inStock?: boolean;
}

export interface ProductSearchParams {
  query?: string;
  filters?: ProductFilters;
  sortBy?: 'name' | 'price' | 'created_at' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  products: ProductWithVariants[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Product display types
export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  brand: string;
  basePrice: number;
  marketPrice?: number;
  images: string[];
  category: string;
  hasStock: boolean;
  sizes: string[];
}

export interface ProductPageData extends ProductWithVariants {
  relatedProducts: ProductCardData[];
  reviews: {
    rating: number;
    count: number;
  };
  isWishlisted: boolean;
}