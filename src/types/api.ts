// API-related type definitions

// Generic API response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Request types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams, SortParams {
  query?: string;
}

// KicksDB API types
export interface KicksDBApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
}

export interface KicksDBSearchParams {
  name?: string;
  brand?: string;
  year?: number;
  limit?: number;
  page?: number;
}

// Stripe API types
export interface StripeConfig {
  publishableKey: string;
  webhookSecret: string;
}

export interface StripePaymentIntentParams {
  amount: number;
  currency: string;
  orderId: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

// Supabase types
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

// File upload types
export interface FileUpload {
  file: File;
  path: string;
  bucket: string;
}

export interface UploadedFile {
  path: string;
  url: string;
  size: number;
  type: string;
}

// Webhook types
export interface WebhookEvent<T = any> {
  id: string;
  type: string;
  data: T;
  timestamp: string;
  source: 'stripe' | 'supabase' | 'kicksdb';
}

// Rate limiting
export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Cache types
export interface CacheConfig {
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'ttl';
}

export interface CachedResponse<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Health check
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: 'up' | 'down';
    storage: 'up' | 'down';
    kicksdb: 'up' | 'down';
    stripe: 'up' | 'down';
  };
  timestamp: string;
  version: string;
}