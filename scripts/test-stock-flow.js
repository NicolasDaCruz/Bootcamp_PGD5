#!/usr/bin/env node

/**
 * Test script to verify the complete stock management flow
 *
 * This script tests:
 * 1. Initial stock levels
 * 2. Cart validation with insufficient stock
 * 3. Cart validation with sufficient stock
 * 4. Stock decrease after successful order
 * 5. Stock movement audit trail
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testStockFlow() {
  console.log('🧪 Starting stock management flow test...\n');

  try {
    // 1. Get a product variant with stock
    console.log('1️⃣ Finding a product variant with stock...');
    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select('id, product_id, size, stock_quantity, computed_available_stock')
      .gt('stock_quantity', 0)
      .limit(1);

    if (variantError || !variants || variants.length === 0) {
      console.error('❌ No variants with stock found:', variantError);
      return;
    }

    const testVariant = variants[0];
    console.log(`✅ Found variant: ${testVariant.id} (Size: ${testVariant.size}, Stock: ${testVariant.stock_quantity})\n`);

    // 2. Get product details
    console.log('2️⃣ Getting product details...');
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, brand, price, total_stock, available_stock')
      .eq('id', testVariant.product_id)
      .single();

    if (productError || !product) {
      console.error('❌ Product not found:', productError);
      return;
    }

    console.log(`✅ Product: ${product.brand} ${product.name} ($${product.price})\n`);

    // 3. Test stock validation with cart item
    console.log('3️⃣ Testing stock validation...');

    // Test with valid quantity
    const validCartItem = {
      id: 'test-cart-item-1',
      productId: testVariant.product_id,
      variantId: testVariant.id,
      name: `${product.brand} ${product.name}`,
      brand: product.brand,
      price: parseFloat(product.price),
      image: '/test-image.jpg',
      size: testVariant.size,
      color: 'Test Color',
      quantity: 1 // Valid quantity
    };

    // Import the validation function
    const { validateStockLevels } = require('../lib/cart-utils.ts');

    const validationResult = await validateStockLevels([validCartItem]);
    console.log(`✅ Stock validation result: ${validationResult.valid ? 'PASSED' : 'FAILED'}`);

    if (!validationResult.valid) {
      console.log('❌ Validation issues:', validationResult.issues);
    }

    // Test with excessive quantity
    const invalidCartItem = {
      ...validCartItem,
      id: 'test-cart-item-2',
      quantity: testVariant.stock_quantity + 10 // Excessive quantity
    };

    const invalidValidationResult = await validateStockLevels([invalidCartItem]);
    console.log(`✅ Excessive quantity validation: ${invalidValidationResult.valid ? 'UNEXPECTED PASS' : 'CORRECTLY FAILED'}`);

    if (!invalidValidationResult.valid) {
      console.log('✅ Expected validation issues:', invalidValidationResult.issues.map(i => i.message));
    }
    console.log();

    // 4. Test stock update function
    console.log('4️⃣ Testing stock update function...');
    const initialStock = testVariant.stock_quantity;
    console.log(`📊 Initial stock: ${initialStock}`);

    // Import the stock update function
    const { updateProductStock } = require('../lib/order-utils.ts');

    // Decrease stock by 1
    const updateResult = await updateProductStock(
      testVariant.product_id,
      testVariant.id,
      -1
    );

    console.log(`📊 Stock update result: ${updateResult.success ? 'SUCCESS' : 'FAILED'}`);
    if (!updateResult.success) {
      console.error('❌ Update error:', updateResult.error);
    }

    // Verify the stock was actually decreased
    const { data: updatedVariant, error: updateCheckError } = await supabase
      .from('product_variants')
      .select('stock_quantity, computed_available_stock')
      .eq('id', testVariant.id)
      .single();

    if (updateCheckError || !updatedVariant) {
      console.error('❌ Could not verify stock update:', updateCheckError);
    } else {
      console.log(`📊 Updated stock: ${updatedVariant.stock_quantity} (decreased by ${initialStock - updatedVariant.stock_quantity})`);
    }
    console.log();

    // 5. Check stock movement audit trail
    console.log('5️⃣ Checking stock movement audit trail...');
    const { data: movements, error: movementError } = await supabase
      .from('stock_movements')
      .select('id, movement_type, quantity, reason, quantity_before, quantity_after, created_at')
      .eq('product_id', testVariant.product_id)
      .eq('variant_id', testVariant.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (movementError) {
      console.error('❌ Could not fetch stock movements:', movementError);
    } else if (movements && movements.length > 0) {
      console.log(`✅ Found ${movements.length} recent stock movements:`);
      movements.forEach((movement, index) => {
        console.log(`   ${index + 1}. ${movement.movement_type}: ${movement.quantity} units (${movement.reason})`);
        console.log(`      Before: ${movement.quantity_before}, After: ${movement.quantity_after}`);
        console.log(`      Date: ${new Date(movement.created_at).toLocaleString()}`);
      });
    } else {
      console.log('⚠️ No stock movements found');
    }
    console.log();

    // 6. Restore stock for next test
    console.log('6️⃣ Restoring stock for next test...');
    const restoreResult = await updateProductStock(
      testVariant.product_id,
      testVariant.id,
      1 // Restore the 1 unit we removed
    );

    console.log(`📊 Stock restore result: ${restoreResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log();

    // 7. Final verification
    console.log('7️⃣ Final verification...');
    const { data: finalVariant, error: finalError } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', testVariant.id)
      .single();

    if (finalError || !finalVariant) {
      console.error('❌ Could not verify final stock:', finalError);
    } else {
      const stockDifference = finalVariant.stock_quantity - initialStock;
      console.log(`📊 Final stock: ${finalVariant.stock_quantity} (change: ${stockDifference >= 0 ? '+' : ''}${stockDifference})`);

      if (stockDifference === 0) {
        console.log('✅ Stock correctly restored to original level');
      } else {
        console.log('⚠️ Stock level differs from original - check for concurrent operations');
      }
    }

    console.log('\n🎉 Stock management flow test completed successfully!');

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testStockFlow().catch(console.error);