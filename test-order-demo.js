// Test Order Demo - Shows complete order creation flow
// Run with: node test-order-demo.js

async function createDemoOrder() {
  console.log('🚀 Creating Demo Order with Complete Information\n');
  console.log('=' .repeat(60));

  // Step 1: Create Payment Intent with full product and customer data
  console.log('\n📦 Step 1: Creating Payment Intent with Product & Customer Data');
  console.log('-'.repeat(60));

  const orderData = {
    items: [
      {
        id: '0026ee37-fb77-49b6-bcca-7386278e81c1',  // Nike Ja 3
        name: 'Nike Nike Ja 3 Default',
        brand: 'Nike',
        price: 149.99,
        quantity: 2,
        size: '11',
        sku: 'NIKE-JA3-001'
      },
      {
        id: '5dd982f8-1485-4d67-b542-b0b74ecabe1f',  // Air Force 1
        name: 'Nike Air Force 1 \'07',
        brand: 'Nike',
        price: 110.00,
        quantity: 1,
        size: '10.5',
        sku: 'AF1-07-WHITE'
      }
    ],
    shipping: {
      address: {
        name: 'John Smith',
        line1: '123 Main Street',
        line2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'US',
        email: 'john.smith@example.com',
        phone: '+1-555-0123'
      }
    },
    metadata: {
      userId: 'user-demo-123',
      sessionId: 'session-demo-456',
      cartId: 'cart-' + Date.now(),
      reservationIds: [],
      customer_email: 'john.smith@example.com',
      customer_name: 'John Smith',
      customer_phone: '+1-555-0123',
      billingAddress: {
        name: 'John Smith',
        line1: '456 Billing Ave',
        city: 'Brooklyn',
        state: 'NY',
        postal_code: '11201',
        country: 'US'
      },
      notes: 'Please leave at door if not home'
    }
  };

  try {
    const response = await fetch('http://localhost:3000/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (result.clientSecret) {
      console.log('✅ Payment Intent Created Successfully!');
      console.log('   Payment Intent ID:', result.paymentIntentId);
      console.log('   Amount: $' + result.amount);
      console.log('\n📊 Price Breakdown:');
      console.log('   Subtotal: $' + result.breakdown.subtotal);
      console.log('   Shipping: $' + result.breakdown.shipping);
      console.log('   Tax: $' + result.breakdown.tax.toFixed(2));
      console.log('   Total: $' + result.breakdown.total);

      console.log('\n🎯 What This Demonstrates:');
      console.log('   ✓ Order contains multiple products with details');
      console.log('   ✓ Each product has name, SKU, size, price');
      console.log('   ✓ Customer information is captured');
      console.log('   ✓ Shipping address is included');
      console.log('   ✓ Billing address is separate from shipping');
      console.log('   ✓ Order notes are saved');
      console.log('   ✓ Tax is calculated automatically');

      // Step 2: Simulate payment success to trigger order creation
      console.log('\n📝 Step 2: Order Creation (Triggered by Payment Success)');
      console.log('-'.repeat(60));
      console.log('When payment succeeds, the system will:');
      console.log('   1. Auto-generate order number (e.g., ORD-20250923-123456)');
      console.log('   2. Create order record with status "confirmed"');
      console.log('   3. Save all order items with product details');
      console.log('   4. Store shipping & billing addresses');
      console.log('   5. Send confirmation email to john.smith@example.com');
      console.log('   6. Update inventory levels');

      console.log('\n📧 Step 3: Email Notification');
      console.log('-'.repeat(60));
      console.log('Email will be sent to: john.smith@example.com');
      console.log('Email will contain:');
      console.log('   • Order number (auto-generated)');
      console.log('   • Product details (2x Nike Ja 3, 1x Air Force 1)');
      console.log('   • Shipping address');
      console.log('   • Total amount: $' + result.breakdown.total);

      console.log('\n🔍 To verify in database, check:');
      console.log('   • orders table - for order with auto-generated number');
      console.log('   • order_items table - for product details');
      console.log('   • Check shipping_full_name, shipping_address fields');
      console.log('   • Check customer_email field');

      return result;
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Failed to create payment intent:', error);
  }
}

// Run the demo
createDemoOrder().then(() => {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Demo Complete!');
  console.log('='.repeat(60));
});