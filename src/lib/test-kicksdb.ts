// Simple test script for KicksDB API connectivity
import { kicksdb, POPULAR_BRANDS } from './kicksdb';

export async function testKicksDBConnectivity() {
  console.log('🚀 Testing KicksDB API connectivity...\n');

  try {
    // Test basic API connectivity with Nike
    console.log('📞 Testing API with Nike products...');
    const nikeResults = await kicksdb.searchByBrand('Nike', 5);

    if (nikeResults.products && nikeResults.products.length > 0) {
      console.log(`✅ Success! Found ${nikeResults.products.length} Nike products:`);
      nikeResults.products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - $${product.retailPrice}`);
        console.log(`     Brand: ${product.brand}, ID: ${product.id}`);
        if (product.image?.original) {
          console.log(`     Image: ${product.image.original}`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️  API returned no products');
    }

    // Test trending endpoint
    console.log('📈 Testing trending endpoint...');
    const trending = await kicksdb.getTrending(3);

    if (trending.products && trending.products.length > 0) {
      console.log(`✅ Found ${trending.products.length} trending products:`);
      trending.products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (${product.brand}) - $${product.retailPrice}`);
      });
    }

    console.log('\n🎉 KicksDB API integration test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ KicksDB API test failed:', error);
    return false;
  }
}

export async function testAllBrands() {
  console.log('🔍 Testing API connectivity for all popular brands...\n');

  const results = [];

  for (const brand of POPULAR_BRANDS.slice(0, 3)) { // Test first 3 brands
    try {
      console.log(`Testing ${brand}...`);
      const response = await kicksdb.searchByBrand(brand, 2);

      if (response.products && response.products.length > 0) {
        console.log(`✅ ${brand}: Found ${response.products.length} products`);
        results.push({
          brand,
          success: true,
          count: response.products.length,
          sample: response.products[0]?.name || 'N/A',
        });
      } else {
        console.log(`⚠️  ${brand}: No products found`);
        results.push({
          brand,
          success: false,
          count: 0,
          sample: 'N/A',
        });
      }

      // Wait between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ ${brand}: Error -`, error);
      results.push({
        brand,
        success: false,
        count: 0,
        sample: 'Error',
      });
    }
  }

  console.log('\n📊 Brand Test Summary:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.brand}: ${result.count} products (${result.sample})`);
  });

  return results;
}

// If run directly
if (require.main === module) {
  testKicksDBConnectivity()
    .then(() => testAllBrands())
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}