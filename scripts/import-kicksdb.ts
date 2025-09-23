#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js';

const KICKSDB_API_KEY = process.env.KICKSDB_API_KEY || 'KICKS-43F0-73F7-AC9B-A36071D80D2C';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!KICKSDB_API_KEY) {
  console.error('KICKSDB_API_KEY environment variable is required');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase environment variables are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Rate limiting: 640 requests per minute = ~10.6 requests per second
// We'll use 9 requests per second to be safe
const RATE_LIMIT_DELAY = 1000 / 9; // ~111ms between requests

interface KicksDBGTIN {
  gtin: string;
  name: string;
  brand: string;
  model?: string;
  colorway?: string;
  release_date?: string;
  retail_price?: string;
  sku?: string;
}

interface KicksDBProduct {
  id: string;
  name: string;
  brand: string;
  model: string;
  colorway: string;
  release_date?: string;
  retail_price?: number;
  style_code?: string;
  description?: string;
  image_url?: string;
  sku?: string;
  gtin?: string;
}

interface GTINResponse {
  data: KicksDBGTIN[];
  success: boolean;
  error?: string;
}

interface ProductResponse {
  data: KicksDBProduct;
  success: boolean;
  error?: string;
}

// KicksDB API endpoints based on documentation
const KICKSDB_BASE_URL = 'https://api.kicks.dev';

// Sleep function for rate limiting
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get multiple pages of products from KicksDB API
async function getAllProducts(targetCount: number = 100): Promise<any[]> {
  const baseEndpoint = `${KICKSDB_BASE_URL}/v3/stockx/products`;
  const allProducts: any[] = [];
  let page = 1;
  const perPage = 50; // StockX API typically returns 20-50 products per page

  console.log(`📦 Fetching products from KicksDB (target: ${targetCount})...`);

  while (allProducts.length < targetCount) {
    try {
      const endpoint = `${baseEndpoint}?page=${page}&limit=${perPage}`;
      console.log(`🔍 Fetching page ${page}: ${endpoint}`);

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': KICKSDB_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to fetch page ${page}: ${response.status} - ${errorText.substring(0, 100)}`);
        break;
      }

      const data = await response.json();
      const products = Array.isArray(data.data) ? data.data : [];

      if (products.length === 0) {
        console.log(`📄 No more products on page ${page}, stopping`);
        break;
      }

      allProducts.push(...products);
      console.log(`✅ Page ${page}: Added ${products.length} products (total: ${allProducts.length})`);

      page++;

      // Rate limiting delay between requests
      await sleep(RATE_LIMIT_DELAY);

      // Safety break to avoid infinite loops
      if (page > 10) {
        console.log(`⚠️  Reached maximum page limit (10), stopping`);
        break;
      }

    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error.message);
      break;
    }
  }

  console.log(`📊 Total products fetched: ${allProducts.length}`);
  return allProducts.slice(0, targetCount); // Return only what we need
}

// Get product details from KicksDB API using StockX platform
async function getProductDetails(gtin: string): Promise<KicksDBProduct | null> {
  try {
    await sleep(RATE_LIMIT_DELAY); // Rate limiting

    const response = await fetch(`${KICKSDB_BASE_URL}/v3/stockx/products/${gtin}`, {
      headers: {
        'Authorization': KICKSDB_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`⚠️  Failed to fetch product details for GTIN ${gtin}: ${response.status}`);
      return null;
    }

    const data: ProductResponse = await response.json();
    return data.data || null;
  } catch (error) {
    console.error(`Error fetching product details for GTIN ${gtin}:`, error);
    return null;
  }
}

// Import product to Supabase sneakers table
async function importSneakerToSupabase(product: KicksDBProduct, gtin: string): Promise<void> {
  try {
    // Extract model from name if not provided
    const model = product.model || product.name.replace(product.brand, '').trim();

    // Generate SKU from GTIN or style_code
    const sku = product.sku || product.style_code || gtin;

    // Create sneaker record
    const { data: insertedSneaker, error: sneakerError } = await supabase
      .from('sneakers')
      .insert({
        brand: product.brand,
        model: model,
        colorway: product.colorway || 'Default',
        size: 9, // Default US size 9 since size is still required
        price: product.retail_price?.toString() || '0.00',
        sku: sku,
        image_url: product.image_url || '/api/placeholder/400/400',
        in_stock: true,
        description: product.description || `${product.brand} ${model} - ${product.colorway || 'Classic'} colorway`,
        gtin: gtin,
        release_date: product.release_date,
        style_code: product.style_code,
      })
      .select()
      .single();

    if (sneakerError) {
      console.error(`Failed to insert sneaker ${product.name}:`, sneakerError);
      return;
    }

    console.log(`✅ Imported sneaker: ${product.brand} ${model} (${product.colorway || 'Default'})`);
  } catch (error) {
    console.error(`Error importing sneaker ${product.name}:`, error);
  }
}

async function main() {
  console.log('🚀 Starting KicksDB import...\n');
  console.log(`🔑 Using API key: ${KICKSDB_API_KEY.substring(0, 10)}...${KICKSDB_API_KEY.substring(-4)}`);
  console.log(`⏱️  Rate limit: ${RATE_LIMIT_DELAY.toFixed(0)}ms between requests (640 req/min)\n`);

  try {
    // Step 1: Fetch products from KicksDB API
    console.log('📦 Step 1: Fetching products from KicksDB API...');
    const targetCount = 100; // Import at least 100 products
    const products = await getAllProducts(targetCount);

    if (!products || products.length === 0) {
      console.error('❌ No products fetched from KicksDB API.');
      process.exit(1);
    }

    console.log(`\n📦 Step 2: Processing and importing ${products.length} products...\n`);

    // Step 2: Process and import products
    let successCount = 0;
    let errorCount = 0;

    // Process each product
    for (let i = 0; i < products.length && successCount < targetCount; i++) {
      const product = products[i];
      const progress = `[${i + 1}/${products.length}]`;

      try {
        console.log(`${progress} Processing product: ${product.name || product.title || 'Unknown'}`);

        // Convert the product data to our format
        const formattedProduct: KicksDBProduct = {
          id: product.id || product.uuid || `product-${i}`,
          name: product.name || product.title || 'Unknown Product',
          brand: product.brand || 'Unknown',
          model: product.model || product.name?.replace(product.brand, '').trim() || 'Unknown',
          colorway: product.colorway || product.color || 'Default',
          retail_price: product.retail_price || product.price || 0,
          style_code: product.style_code || product.sku || product.id,
          description: product.description || `${product.brand} ${product.model || product.name}`,
          image_url: product.image_url || product.image || product.media?.[0]?.imageUrl,
          sku: product.sku || product.style_code || product.id,
          gtin: product.gtin || product.id,
          release_date: product.release_date || product.releaseDate,
        };

        // Import to Supabase
        await importSneakerToSupabase(formattedProduct, formattedProduct.gtin);
        successCount++;

        console.log(`  📊 Progress: ${successCount} imported, ${errorCount} failed`);

        // Rate limiting delay
        if (i < products.length - 1) {
          await sleep(RATE_LIMIT_DELAY);
        }

      } catch (error) {
        console.error(`  ❌ Error processing product ${i + 1}:`, error);
        errorCount++;
      }
    }

    console.log('\n🎉 Import completed!');
    console.log(`📊 Final stats:`);
    console.log(`  ✅ Successfully imported: ${successCount} sneakers`);
    console.log(`  ❌ Failed to import: ${errorCount} items`);
    console.log(`  🎯 Target reached: ${successCount >= targetCount ? 'YES' : 'NO'} (${targetCount} required)`);

  } catch (error) {
    console.error('💥 Critical error during import:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { main as importFromKicksDB };