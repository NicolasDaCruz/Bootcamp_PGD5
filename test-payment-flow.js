// Test script for complete payment and stock management flow
const fetch = require('node-fetch');

async function testCompletePaymentFlow() {
  console.log('🧪 Starting Complete Payment Flow Test...\n');

  try {
    // Step 1: Check initial stock levels
    console.log('📊 Step 1: Checking initial stock levels...');
    const stockResponse = await fetch('http://localhost:3000/api/products/818a8bfc-30b0-4f61-ba69-8980303eba7e/stock');
    const stockData = await stockResponse.json();

    if (stockData.success) {
      const size41Variant = stockData.data.variants.find(v => v.size === '41');
      console.log(`   ✅ Size 41 initial stock: ${size41Variant.stock_quantity}`);
      console.log(`   ✅ Available stock: ${size41Variant.available_stock}\n`);
    } else {
      console.log('   ❌ Failed to get initial stock data\n');
      return;
    }

    // Step 2: Create payment intent with cart items
    console.log('💳 Step 2: Creating payment intent with cart items...');
    const paymentIntentData = {
      items: [{
        id: '818a8bfc-30b0-4f61-ba69-8980303eba7e',
        name: 'Vans Old Skool',
        price: 65,
        quantity: 1,
        size: 'EU 41',
        variantId: 'e255de6f-72f6-431d-bee6-50dfb696a216',
        image: 'https://example.com/vans.jpg'
      }],
      currency: 'usd',
      shipping: {
        name: 'Test User',
        address: {
          line1: '123 Test St',
          city: 'Test City',
          state: 'CA',
          postal_code: '12345',
          country: 'US'
        }
      },
      metadata: {
        cartId: 'test-cart-' + Date.now(),
        userId: 'test-user-123',
        sessionId: 'test-session-' + Date.now(),
        customer_email: 'test@example.com'
      }
    };

    const piResponse = await fetch('http://localhost:3000/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentIntentData)
    });

    const piData = await piResponse.json();

    if (piData.clientSecret) {
      console.log(`   ✅ Payment intent created: ${piData.paymentIntentId}`);
      console.log(`   ✅ Client secret: ${piData.clientSecret.substring(0, 20)}...`);
      console.log(`   ✅ Amount: $${piData.amount / 100}\n`);
    } else {
      console.log('   ❌ Failed to create payment intent');
      console.log('   📋 Response:', piData);
      return;
    }

    // Step 3: Simulate order creation (what happens after successful payment)
    console.log('🛒 Step 3: Creating order from payment intent...');
    const orderData = {
      paymentIntentId: piData.paymentIntentId,
      // Simulating a successful payment
      paymentStatus: 'succeeded'
    };

    const orderResponse = await fetch('http://localhost:3000/api/orders/create-from-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const orderResult = await orderResponse.json();

    if (orderResult.success) {
      console.log(`   ✅ Order created successfully: ${orderResult.order.id}`);
      console.log(`   ✅ Order total: $${orderResult.order.total}`);
      console.log(`   ✅ Items processed: ${orderResult.order.items.length}`);

      if (orderResult.stockUpdates) {
        console.log('   📦 Stock updates:');
        orderResult.stockUpdates.forEach(update => {
          if (update.success) {
            console.log(`      ✅ ${update.variantId || update.variant_id}: ${update.previous_stock} → ${update.new_stock}`);
          } else {
            console.log(`      ❌ ${update.variantId || update.variant_id}: ${update.error}`);
          }
        });
      }
      console.log();
    } else {
      console.log('   ❌ Order creation failed');
      console.log('   📋 Error:', orderResult.error);
      console.log('   📋 Full response:', JSON.stringify(orderResult, null, 2));
      return;
    }

    // Step 4: Verify stock was decremented
    console.log('📊 Step 4: Verifying stock was decremented...');
    const finalStockResponse = await fetch('http://localhost:3000/api/products/818a8bfc-30b0-4f61-ba69-8980303eba7e/stock');
    const finalStockData = await finalStockResponse.json();

    if (finalStockData.success) {
      const size41Final = finalStockData.data.variants.find(v => v.size === '41');
      console.log(`   ✅ Size 41 final stock: ${size41Final.stock_quantity}`);
      console.log(`   ✅ Available stock: ${size41Final.available_stock}`);

      // Check if stock decreased by 1
      const initialStock = stockData.data.variants.find(v => v.size === '41').stock_quantity;
      const expectedStock = initialStock - 1;

      if (size41Final.stock_quantity === expectedStock) {
        console.log(`   🎉 SUCCESS: Stock correctly decremented from ${initialStock} to ${size41Final.stock_quantity}!`);
      } else {
        console.log(`   ⚠️  WARNING: Expected stock ${expectedStock}, got ${size41Final.stock_quantity}`);
      }
    } else {
      console.log('   ❌ Failed to get final stock data');
    }

    console.log('\n🎯 Test Complete!');

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testCompletePaymentFlow();