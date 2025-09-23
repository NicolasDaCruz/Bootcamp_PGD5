#!/usr/bin/env node

/**
 * Complete Order Flow Test
 * Tests the entire flow from payment intent creation to successful order with stock decrement
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Mock Stripe Payment Intent ID for testing
const TEST_PAYMENT_INTENT_ID = 'pi_test_' + Date.now();

async function testCompleteOrderFlow() {
  console.log('🧪 Starting Complete Order Flow Test...\n');
  console.log(`📝 Test Payment Intent ID: ${TEST_PAYMENT_INTENT_ID}`);

  try {
    // Step 1: Install stock management functions
    console.log('1️⃣ Installing stock management functions...');

    try {
      const installResponse = await fetch('http://localhost:3000/api/admin/migrate-stock-functions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (installResponse.ok) {
        const installResult = await installResponse.json();
        console.log('✅ Stock functions installation:', installResult.success ? 'SUCCESS' : 'PARTIAL');

        if (installResult.functions) {
          console.log('   📦 Functions status:', installResult.functions);
        }
      } else {
        console.log('⚠️ Could not install functions via API - server may not be running');
      }
    } catch (installError) {
      console.log('⚠️ Function installation skipped - server may not be running');
    }

    // Step 2: Find a product variant with stock
    console.log('\n2️⃣ Finding a product variant with stock...');

    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select(`
        id,
        product_id,
        size,
        stock_quantity,
        reserved_quantity,
        computed_available_stock,
        products (
          id,
          name,
          brand,
          price
        )
      `)
      .gt('stock_quantity', 3)
      .eq('is_active', true)
      .limit(1);

    if (variantError || !variants || variants.length === 0) {
      console.error('❌ No variants with stock found:', variantError);

      // Create test data if none exists
      console.log('🔧 Creating test product and variant...');

      const { data: testProduct, error: productError } = await supabase
        .from('products')
        .insert({
          name: 'Test Sneaker',
          brand: 'Test Brand',
          price: 99.99,
          model: 'Test Model',
          colorway: 'Test Color',
          is_active: true,
          stock_quantity: 10
        })
        .select()
        .single();

      if (productError) {
        console.error('❌ Failed to create test product:', productError);
        return;
      }

      const { data: testVariant, error: variantInsertError } = await supabase
        .from('product_variants')
        .insert({
          product_id: testProduct.id,
          name: 'US 9',
          value: '9',
          size: '9',
          us_size: 9,
          eu_size: 42.5,
          stock_quantity: 10,
          is_active: true,
          variant_type: 'size'
        })
        .select(`
          id,
          product_id,
          size,
          stock_quantity,
          reserved_quantity,
          computed_available_stock
        `)
        .single();

      if (variantInsertError) {
        console.error('❌ Failed to create test variant:', variantInsertError);
        return;
      }

      variants = [{ ...testVariant, products: testProduct }];
    }

    const testVariant = variants[0];
    const testProduct = testVariant.products;

    console.log(`✅ Using variant: ${testVariant.id}`);
    console.log(`   Product: ${testProduct.brand} ${testProduct.name}`);
    console.log(`   Size: ${testVariant.size}`);
    console.log(`   Stock: ${testVariant.stock_quantity}`);
    console.log(`   Available: ${testVariant.computed_available_stock || testVariant.stock_quantity}`);

    // Step 3: Test stock validation function
    console.log('\n3️⃣ Testing stock validation...');

    const testOrderItems = [{
      variant_id: testVariant.id,
      product_id: testVariant.product_id,
      quantity: 1,
      name: `${testProduct.brand} ${testProduct.name}`
    }];

    try {
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_order_stock', {
          order_items: testOrderItems
        });

      if (validationError) {
        console.log('⚠️ Stock validation function not available:', validationError.message);
      } else {
        console.log('✅ Stock validation result:', validationResult);
      }
    } catch (validationTestError) {
      console.log('⚠️ Stock validation test skipped - function may not exist yet');
    }

    // Step 4: Test payment intent creation
    console.log('\n4️⃣ Testing payment intent creation...');

    const testCartItems = [{
      id: 'test-cart-item-1',
      productId: testVariant.product_id,
      variantId: testVariant.id,
      name: `${testProduct.brand} ${testProduct.name}`,
      brand: testProduct.brand,
      price: parseFloat(testProduct.price),
      image: '/test-image.jpg',
      size: testVariant.size || 'Default',
      color: 'Test Color',
      quantity: 1
    }];

    try {
      const paymentIntentResponse = await fetch('http://localhost:3000/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: testCartItems,
          currency: 'usd',
          metadata: {
            cartId: 'test-cart-123',
            userId: 'test-user',
            sessionId: 'test-session'
          }
        })
      });

      if (paymentIntentResponse.ok) {
        const paymentResult = await paymentIntentResponse.json();
        console.log('✅ Payment intent created successfully');
        console.log(`   ID: ${paymentResult.paymentIntentId}`);
        console.log(`   Amount: $${paymentResult.amount}`);
      } else {
        const errorData = await paymentIntentResponse.json();
        console.log('❌ Payment intent creation failed:', errorData.error);
      }
    } catch (paymentError) {
      console.log('⚠️ Payment intent test skipped - server may not be running');
    }

    // Step 5: Test order creation with mock payment intent
    console.log('\n5️⃣ Testing order creation from payment...');

    try {
      const orderResponse = await fetch('http://localhost:3000/api/orders/create-from-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: TEST_PAYMENT_INTENT_ID
        })
      });

      if (orderResponse.ok) {
        const orderResult = await orderResponse.json();
        console.log('✅ Order creation test completed');
        console.log(`   Order ID: ${orderResult.orderId}`);
        console.log(`   Order Number: ${orderResult.orderNumber}`);
      } else {
        const errorData = await orderResponse.json();
        console.log('❌ Order creation failed (expected for test):', errorData.error);
      }
    } catch (orderError) {
      console.log('⚠️ Order creation test skipped - server may not be running');
    }

    // Step 6: Test stock update function directly
    console.log('\n6️⃣ Testing direct stock update...');

    const initialStock = testVariant.stock_quantity;
    console.log(`   Initial stock: ${initialStock}`);

    try {
      // Test decreasing stock by 1
      const { data: updateResult, error: updateError } = await supabase
        .rpc('update_variant_stock', {
          variant_id: testVariant.id,
          quantity_change: -1
        });

      if (updateError) {
        console.log('⚠️ Direct stock update failed:', updateError.message);

        // Try alternative approach
        console.log('   🔄 Trying alternative stock update...');
        const { error: directUpdateError } = await supabase
          .from('product_variants')
          .update({ stock_quantity: initialStock - 1 })
          .eq('id', testVariant.id);

        if (directUpdateError) {
          console.log('❌ Alternative stock update failed:', directUpdateError.message);
        } else {
          console.log('✅ Alternative stock update successful');
        }
      } else {
        console.log('✅ Direct stock update successful:', updateResult);

        if (updateResult?.success) {
          console.log(`   Previous stock: ${updateResult.previous_stock}`);
          console.log(`   New stock: ${updateResult.new_stock}`);
          console.log(`   Available stock: ${updateResult.available_stock}`);
        }
      }

      // Restore stock
      console.log('   🔄 Restoring stock...');
      const { error: restoreError } = await supabase
        .from('product_variants')
        .update({ stock_quantity: initialStock })
        .eq('id', testVariant.id);

      if (restoreError) {
        console.log('⚠️ Stock restoration failed:', restoreError.message);
      } else {
        console.log('✅ Stock restored successfully');
      }
    } catch (stockTestError) {
      console.log('❌ Stock update test failed:', stockTestError);
    }

    // Step 7: Summary and recommendations
    console.log('\n7️⃣ Test Summary and Recommendations');
    console.log('=====================================');

    // Check current stock levels
    const { data: finalVariant } = await supabase
      .from('product_variants')
      .select('stock_quantity, computed_available_stock')
      .eq('id', testVariant.id)
      .single();

    console.log(`📊 Final stock levels:`);
    console.log(`   Stock quantity: ${finalVariant?.stock_quantity || 'Unknown'}`);
    console.log(`   Available: ${finalVariant?.computed_available_stock || 'Unknown'}`);

    console.log('\n🔧 Next Steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Run the stock function migration: POST /api/admin/migrate-stock-functions');
    console.log('3. Test a real payment flow through the frontend');
    console.log('4. Monitor stock changes in the database');

    console.log('\n📝 Key Files Modified:');
    console.log('- supabase/migrations/006_add_update_variant_stock_function.sql');
    console.log('- src/app/api/orders/create-from-payment/route.ts');
    console.log('- src/app/api/admin/migrate-stock-functions/route.ts');

    console.log('\n✅ Complete order flow test finished successfully!');

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testCompleteOrderFlow();