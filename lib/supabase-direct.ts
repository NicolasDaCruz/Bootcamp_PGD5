// Direct Supabase API calls without SDK
// This is a workaround for SDK authentication issues

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface SupabaseResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: string;
    hint?: string;
  };
}

export async function insertOrder(orderData: any): Promise<SupabaseResponse<any>> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Direct API error:', errorText);
      return {
        error: {
          message: `HTTP ${response.status}: ${errorText}`,
          code: response.status.toString()
        }
      };
    }

    const data = await response.json();
    return { data: Array.isArray(data) ? data[0] : data };

  } catch (error) {
    console.error('❌ Direct API exception:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'FETCH_ERROR'
      }
    };
  }
}

export async function insertOrderItems(items: any[]): Promise<SupabaseResponse<any>> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(items)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Direct API error for order items:', errorText);
      return {
        error: {
          message: `HTTP ${response.status}: ${errorText}`,
          code: response.status.toString()
        }
      };
    }

    const data = await response.json();
    return { data };

  } catch (error) {
    console.error('❌ Direct API exception for order items:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'FETCH_ERROR'
      }
    };
  }
}

export async function queryProducts(productIds: string[]): Promise<SupabaseResponse<any[]>> {
  try {
    const ids = productIds.join(',');
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=in.(${ids})&select=id,name,brand,sku,price,original_image_urls`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Direct API error for products:', errorText);
      return {
        error: {
          message: `HTTP ${response.status}: ${errorText}`,
          code: response.status.toString()
        }
      };
    }

    const data = await response.json();
    return { data };

  } catch (error) {
    console.error('❌ Direct API exception for products:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'FETCH_ERROR'
      }
    };
  }
}