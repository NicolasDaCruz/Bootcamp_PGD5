#!/usr/bin/env node

/**
 * Edge Case Testing for Stock Management System
 * Tests various failure scenarios and edge cases
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const JORDAN_PRODUCT_ID = '3272f34b-9917-4204-9b6c-4bc0ef7d4903';

async function runEdgeCaseTests() {
  console.log('🧪 Starting Edge Case Tests\n');

  await testConcurrentPurchases();
  await testStockRunsOutDuringCheckout();
  await testInvalidVariantAccess();
  await testNegativeStockPrevention();
  await testLargeQuantityOrders();
  await testDatabaseConnectionIssues();

  console.log('\n🎯 Edge case testing completed!');
}

async function testConcurrentPurchases() {
  console.log('⚡ Test: Concurrent Purchases (Race Condition)');

  try {
    // Get a variant with limited stock
    const { data: variant } = await supabase
      .from('product_variants')
      .select('id, size, stock_quantity')
      .eq('product_id', JORDAN_PRODUCT_ID)
      .eq('size', '45') // Should have 3 items
      .single();

    if (!variant) {
      console.log('❌ No variant found for testing');
      return;
    }

    console.log(`Testing with Size ${variant.size} (${variant.stock_quantity} available)`);

    // Simulate two concurrent purchase attempts
    const purchase1 = decreaseStock(variant.id, 2, 'concurrent-test-1');
    const purchase2 = decreaseStock(variant.id, 2, 'concurrent-test-2');

    const results = await Promise.allSettled([purchase1, purchase2]);

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failCount = results.filter(r => r.status === 'rejected' || !r.value?.success).length;

    console.log(`✅ Concurrent test results: ${successCount} succeeded, ${failCount} failed`);

    if (successCount === 1 && failCount === 1) {
      console.log('✅ Race condition handled correctly - only one purchase succeeded');
    } else if (successCount === 2) {
      console.log('⚠️ Both purchases succeeded - potential overselling');
    } else {
      console.log('⚠️ Both purchases failed - system may be too restrictive');
    }

  } catch (error) {
    console.error('❌ Concurrent purchase test failed:', error.message);
  }
}

async function testStockRunsOutDuringCheckout() {
  console.log('\n🛍️ Test: Stock Runs Out During Checkout');

  try {
    // Get current stock for size 43 (should have 5)
    const { data: variant } = await supabase
      .from('product_variants')
      .select('id, size, stock_quantity')
      .eq('product_id', JORDAN_PRODUCT_ID)
      .eq('size', '43')
      .single();

    if (!variant) {
      console.log('❌ No variant found for testing');
      return;
    }

    console.log(`Starting with Size ${variant.size}: ${variant.stock_quantity} available`);

    // Simulate adding to cart when stock is available
    console.log('Customer 1: Adding 3 items to cart (stock check passes)');

    // Simulate another customer quickly buying all stock
    console.log('Customer 2: Quickly purchases all 5 items');
    await decreaseStock(variant.id, 5, 'quick-purchase');

    // Now customer 1 tries to checkout
    console.log('Customer 1: Attempting to checkout with 3 items...');
    const checkoutResult = await attemptCheckout(variant.id, 3);

    if (!checkoutResult.success) {
      console.log('✅ Checkout correctly failed due to insufficient stock');
      console.log(`   Error: ${checkoutResult.error}`);
    } else {
      console.log('❌ Checkout succeeded despite insufficient stock - potential overselling');
    }

    // Restore stock for other tests
    await restoreStock(variant.id, 5);

  } catch (error) {
    console.error('❌ Stock depletion test failed:', error.message);
  }
}

async function testInvalidVariantAccess() {
  console.log('\n🔍 Test: Invalid Variant Access');

  try {
    // Test with non-existent variant ID
    const fakeVariantId = '00000000-0000-0000-0000-000000000000';

    const result = await attemptCheckout(fakeVariantId, 1);

    if (!result.success) {
      console.log('✅ Invalid variant correctly rejected');
      console.log(`   Error: ${result.error}`);
    } else {
      console.log('❌ Invalid variant was accepted - security issue');
    }

  } catch (error) {
    console.error('❌ Invalid variant test failed:', error.message);
  }
}

async function testNegativeStockPrevention() {
  console.log('\n📊 Test: Negative Stock Prevention');

  try {
    // Get size 41 (should have 0 stock)
    const { data: variant } = await supabase
      .from('product_variants')
      .select('id, size, stock_quantity')
      .eq('product_id', JORDAN_PRODUCT_ID)
      .eq('size', '41')
      .single();

    if (!variant) {
      console.log('❌ No variant found for testing');
      return;
    }

    console.log(`Testing with Size ${variant.size}: ${variant.stock_quantity} available`);

    // Try to decrease stock when already at 0
    const result = await decreaseStock(variant.id, 1, 'negative-test');

    if (!result.success) {
      console.log('✅ Negative stock correctly prevented');
      console.log(`   Error: ${result.error}`);
    } else {
      console.log('❌ Negative stock was allowed - critical issue');
    }

  } catch (error) {
    console.error('❌ Negative stock test failed:', error.message);
  }
}

async function testLargeQuantityOrders() {
  console.log('\n📦 Test: Large Quantity Orders');

  try {
    // Try to order more than available (size 42 has 41 items)
    const { data: variant } = await supabase
      .from('product_variants')
      .select('id, size, stock_quantity')
      .eq('product_id', JORDAN_PRODUCT_ID)
      .eq('size', '42')
      .single();

    if (!variant) {
      console.log('❌ No variant found for testing');
      return;
    }

    console.log(`Testing with Size ${variant.size}: ${variant.stock_quantity} available`);

    // Try to order more than available
    const excessiveQuantity = variant.stock_quantity + 10;
    console.log(`Attempting to order ${excessiveQuantity} items...`);

    const result = await attemptCheckout(variant.id, excessiveQuantity);

    if (!result.success) {
      console.log('✅ Large quantity order correctly rejected');
      console.log(`   Error: ${result.error}`);
    } else {
      console.log('❌ Large quantity order was accepted - potential overselling');
    }

  } catch (error) {
    console.error('❌ Large quantity test failed:', error.message);
  }
}

async function testDatabaseConnectionIssues() {
  console.log('\n💥 Test: Database Connection Issues');

  try {
    // Simulate database query with intentionally bad query
    const { data, error } = await supabase
      .from('nonexistent_table')
      .select('*')
      .limit(1);

    if (error) {
      console.log('✅ Database error correctly handled');
      console.log(`   Error type: ${error.message.substring(0, 50)}...`);
    } else {
      console.log('❌ Invalid query succeeded - unexpected');
    }

  } catch (error) {
    console.log('✅ Database connection error caught by try-catch');
    console.log(`   Error: ${error.message.substring(0, 50)}...`);
  }
}

// Helper functions
async function decreaseStock(variantId, quantity, reference) {
  try {
    const { data: currentVariant } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', variantId)
      .single();

    if (!currentVariant || currentVariant.stock_quantity < quantity) {
      return { success: false, error: 'Insufficient stock' };
    }

    const { error } = await supabase
      .from('product_variants')
      .update({
        stock_quantity: currentVariant.stock_quantity - quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', variantId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log the movement
    await supabase
      .from('stock_movements')
      .insert({
        product_id: JORDAN_PRODUCT_ID,
        variant_id: variantId,
        movement_type: 'sale',
        quantity: -quantity,
        reason: 'test_purchase',
        reference_id: reference,
        notes: 'Edge case test purchase'
      });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function attemptCheckout(variantId, quantity) {
  try {
    // Simulate the checkout validation process
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock_quantity, computed_available_stock')
      .eq('id', variantId)
      .single();

    if (!variant) {
      return { success: false, error: 'Variant not found' };
    }

    const availableStock = variant.computed_available_stock ?? variant.stock_quantity;

    if (availableStock < quantity) {
      return { success: false, error: `Only ${availableStock} items available` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function restoreStock(variantId, quantity) {
  try {
    const { data: currentVariant } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', variantId)
      .single();

    if (!currentVariant) return;

    await supabase
      .from('product_variants')
      .update({
        stock_quantity: currentVariant.stock_quantity + quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', variantId);

    // Log the movement
    await supabase
      .from('stock_movements')
      .insert({
        product_id: JORDAN_PRODUCT_ID,
        variant_id: variantId,
        movement_type: 'adjustment',
        quantity: quantity,
        reason: 'test_restoration',
        reference_id: 'edge-test-restore',
        notes: 'Restoring stock after edge case test'
      });

  } catch (error) {
    console.warn('Warning: Could not restore stock:', error.message);
  }
}

// Run tests
runEdgeCaseTests()
  .then(() => {
    console.log('\n✅ Edge case testing completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Edge case testing failed:', error);
    process.exit(1);
  });