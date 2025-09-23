#!/usr/bin/env node

/**
 * Product Import Script
 *
 * This script imports sneaker products from KicksDB API into the Supabase database.
 * It can be run in different modes:
 *
 * - Full import: Import all products from popular brands
 * - Brand-specific: Import products from specific brands only
 * - Test mode: Import a small sample for testing
 *
 * Usage:
 *   node scripts/import-products.js                    # Full import
 *   node scripts/import-products.js --brands Nike Adidas  # Specific brands
 *   node scripts/import-products.js --test             # Test mode (5 products)
 */

require('dotenv').config({ path: '.env.local' });

// Dynamic import for ES modules
async function runImport() {
  try {
    console.log('🚀 Starting product import script...\n');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const testMode = args.includes('--test');
    const brandsIndex = args.indexOf('--brands');
    const specificBrands = brandsIndex !== -1 ? args.slice(brandsIndex + 1) : [];

    if (testMode) {
      console.log('🧪 Running in test mode (importing small sample)');
      // For test mode, we'll import just a few Nike products
      await importTestProducts();
    } else if (specificBrands.length > 0) {
      console.log(`🎯 Importing products for brands: ${specificBrands.join(', ')}`);
      await importSpecificBrands(specificBrands);
    } else {
      console.log('📦 Running full import for all popular brands');
      await importAllProducts();
    }

    console.log('\n✅ Import script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import script failed:', error);
    process.exit(1);
  }
}

async function importTestProducts() {
  const { kicksdb } = await import('../src/lib/kicksdb.js');

  try {
    // Test API connectivity first
    console.log('Testing KicksDB API connectivity...');
    const testResponse = await kicksdb.searchByBrand('Nike', 5);

    if (testResponse.products && testResponse.products.length > 0) {
      console.log(`✅ API test successful! Found ${testResponse.products.length} Nike products`);
      testResponse.products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - $${product.retailPrice}`);
      });
    } else {
      console.log('⚠️  API test returned no products');
    }
  } catch (error) {
    console.error('❌ API test failed:', error);
    throw error;
  }
}

async function importSpecificBrands(brands) {
  const { importByBrands } = await import('../src/lib/import-products.js');

  console.log('\n📊 Starting brand-specific import...');
  const progress = await importByBrands(brands);

  console.log('\n📈 Import Summary:');
  console.log(`  Total processed: ${progress.processedProducts}`);
  console.log(`  Successful: ${progress.successfulImports}`);
  console.log(`  Errors: ${progress.errors.length}`);

  if (progress.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    progress.errors.forEach(error => console.log(`  - ${error}`));
  }
}

async function importAllProducts() {
  const { importAllProducts } = await import('../src/lib/import-products.js');

  console.log('\n📊 Starting full product import...');
  console.log('This may take several minutes due to API rate limits...\n');

  const progress = await importAllProducts();

  console.log('\n📈 Final Import Summary:');
  console.log(`  Total products: ${progress.totalProducts}`);
  console.log(`  Processed: ${progress.processedProducts}`);
  console.log(`  Successful: ${progress.successfulImports}`);
  console.log(`  Failed: ${progress.processedProducts - progress.successfulImports}`);
  console.log(`  Errors: ${progress.errors.length}`);

  const duration = Date.now() - progress.startTime.getTime();
  console.log(`  Duration: ${Math.round(duration / 1000)}s`);

  if (progress.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    progress.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
    if (progress.errors.length > 10) {
      console.log(`  ... and ${progress.errors.length - 10} more errors`);
    }
  }
}

// Run the script
runImport();