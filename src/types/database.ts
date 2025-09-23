// Database type definitions for Supabase
// Generated types for the sneaker e-commerce platform

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'customer' | 'admin' | 'moderator' | 'vendor';
          loyalty_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'customer' | 'admin' | 'moderator' | 'vendor';
          loyalty_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'customer' | 'admin' | 'moderator' | 'vendor';
          loyalty_points?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          brand_id: string | null;
          description: string | null;
          category_id: string;
          base_price: number;
          market_price: number | null;
          images: string[] | null;
          kicksdb_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          brand_id?: string | null;
          description?: string | null;
          category_id: string;
          base_price: number;
          market_price?: number | null;
          images?: string[] | null;
          kicksdb_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          brand_id?: string | null;
          description?: string | null;
          category_id?: string;
          base_price?: number;
          market_price?: number | null;
          images?: string[] | null;
          kicksdb_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string;
          color: string | null;
          sku: string;
          stock_quantity: number;
          price_modifier: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          size: string;
          color?: string | null;
          sku: string;
          stock_quantity?: number;
          price_modifier?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          size?: string;
          color?: string | null;
          sku?: string;
          stock_quantity?: number;
          price_modifier?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
          total_amount: number;
          stripe_payment_intent_id: string | null;
          shipping_address: any; // JSONB
          billing_address: any; // JSONB
          tracking_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
          total_amount: number;
          stripe_payment_intent_id?: string | null;
          shipping_address?: any;
          billing_address?: any;
          tracking_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
          total_amount?: number;
          stripe_payment_intent_id?: string | null;
          shipping_address?: any;
          billing_address?: any;
          tracking_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          variant_id?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          created_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          variant_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          variant_id: string;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          variant_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      wishlist_items: {
        Row: {
          id: string;
          user_id: string;
          variant_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          variant_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          variant_id?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_addresses: {
        Row: {
          id: string;
          user_id: string;
          type: 'shipping' | 'billing';
          is_default: boolean;
          first_name: string;
          last_name: string;
          company: string | null;
          address1: string;
          address2: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'shipping' | 'billing';
          is_default?: boolean;
          first_name: string;
          last_name: string;
          company?: string | null;
          address1: string;
          address2?: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'shipping' | 'billing';
          is_default?: boolean;
          first_name?: string;
          last_name?: string;
          company?: string | null;
          address1?: string;
          address2?: string | null;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          details: any; // JSONB
          ip_address: string | null;
          user_agent: string | null;
          session_id: string | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          details?: any;
          ip_address?: string | null;
          user_agent?: string | null;
          session_id?: string | null;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          details?: any;
          ip_address?: string | null;
          user_agent?: string | null;
          session_id?: string | null;
          timestamp?: string;
          created_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_notifications: any; // JSONB
          push_notifications: any; // JSONB
          privacy_settings: any; // JSONB
          theme: string;
          currency: string;
          language: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_notifications?: any;
          push_notifications?: any;
          privacy_settings?: any;
          theme?: string;
          currency?: string;
          language?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_notifications?: any;
          push_notifications?: any;
          privacy_settings?: any;
          theme?: string;
          currency?: string;
          language?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      data_export_requests: {
        Row: {
          id: string;
          user_id: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          request_date: string;
          completion_date: string | null;
          download_url: string | null;
          download_expires_at: string | null;
          file_size: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          request_date?: string;
          completion_date?: string | null;
          download_url?: string | null;
          download_expires_at?: string | null;
          file_size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          request_date?: string;
          completion_date?: string | null;
          download_url?: string | null;
          download_expires_at?: string | null;
          file_size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      data_deletion_requests: {
        Row: {
          id: string;
          user_id: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          reason: string | null;
          request_date: string;
          scheduled_deletion_date: string | null;
          completion_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          reason?: string | null;
          request_date?: string;
          scheduled_deletion_date?: string | null;
          completion_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          reason?: string | null;
          request_date?: string;
          scheduled_deletion_date?: string | null;
          completion_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Specific entity types
export type User = Tables<'users'>;
export type Product = Tables<'products'>;
export type ProductVariant = Tables<'product_variants'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type CartItem = Tables<'cart_items'>;
export type WishlistItem = Tables<'wishlist_items'>;
export type Category = Tables<'categories'>;
export type Brand = Tables<'brands'>;
export type UserAddress = Tables<'user_addresses'>;
export type UserActivityLog = Tables<'user_activity_logs'>;
export type UserPreferences = Tables<'user_preferences'>;
export type DataExportRequest = Tables<'data_export_requests'>;
export type DataDeletionRequest = Tables<'data_deletion_requests'>;

// Insert types
export type UserInsert = TablesInsert<'users'>;
export type ProductInsert = TablesInsert<'products'>;
export type ProductVariantInsert = TablesInsert<'product_variants'>;
export type OrderInsert = TablesInsert<'orders'>;
export type OrderItemInsert = TablesInsert<'order_items'>;
export type CartItemInsert = TablesInsert<'cart_items'>;
export type WishlistItemInsert = TablesInsert<'wishlist_items'>;
export type CategoryInsert = TablesInsert<'categories'>;
export type BrandInsert = TablesInsert<'brands'>;
export type UserAddressInsert = TablesInsert<'user_addresses'>;
export type UserActivityLogInsert = TablesInsert<'user_activity_logs'>;
export type UserPreferencesInsert = TablesInsert<'user_preferences'>;
export type DataExportRequestInsert = TablesInsert<'data_export_requests'>;
export type DataDeletionRequestInsert = TablesInsert<'data_deletion_requests'>;

// Update types
export type UserUpdate = TablesUpdate<'users'>;
export type ProductUpdate = TablesUpdate<'products'>;
export type ProductVariantUpdate = TablesUpdate<'product_variants'>;
export type OrderUpdate = TablesUpdate<'orders'>;
export type OrderItemUpdate = TablesUpdate<'order_items'>;
export type CartItemUpdate = TablesUpdate<'cart_items'>;
export type WishlistItemUpdate = TablesUpdate<'wishlist_items'>;
export type CategoryUpdate = TablesUpdate<'categories'>;
export type BrandUpdate = TablesUpdate<'brands'>;
export type UserAddressUpdate = TablesUpdate<'user_addresses'>;
export type UserActivityLogUpdate = TablesUpdate<'user_activity_logs'>;
export type UserPreferencesUpdate = TablesUpdate<'user_preferences'>;
export type DataExportRequestUpdate = TablesUpdate<'data_export_requests'>;
export type DataDeletionRequestUpdate = TablesUpdate<'data_deletion_requests'>;