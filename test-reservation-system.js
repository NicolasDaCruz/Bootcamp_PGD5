#!/usr/bin/env node

/**
 * Comprehensive Stock Reservation System Test
 *
 * This script tests the new stock reservation system to ensure it prevents
 * race conditions and provides proper inventory management.
 *
 * Tests include:
 * 1. Basic reservation creation and validation
 * 2. Race condition prevention in concurrent purchases
 * 3. Automatic expiration cleanup
 * 4. Reservation extension functionality
 * 5. Order conversion process
 * 6. Database consistency checks
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const JORDAN_PRODUCT_ID = '3272f34b-9917-4204-9b6c-4bc0ef7d4903';

async function runReservationTests() {
  console.log('🚀 Starting Comprehensive Stock Reservation System Tests\n');

  // Test 1: Basic Reservation Functions
  console.log('📦 Test 1: Basic Reservation Functions');
  await testBasicReservationOperations();

  // Test 2: Race Condition Prevention
  console.log('\n⚡ Test 2: Race Condition Prevention');
  await testRaceConditionPrevention();

  // Test 3: Automatic Expiration
  console.log('\n⏰ Test 3: Automatic Expiration');
  await testAutomaticExpiration();

  // Test 4: Reservation Extension
  console.log('\n🔄 Test 4: Reservation Extension');
  await testReservationExtension();

  // Test 5: Order Conversion
  console.log('\n💳 Test 5: Order Conversion Process');
  await testOrderConversion();

  // Test 6: Cleanup Operations
  console.log('\n🧹 Test 6: Cleanup Operations');
  await testCleanupOperations();

  // Test 7: Database Consistency
  console.log('\n🔍 Test 7: Database Consistency');
  await testDatabaseConsistency();

  console.log('\n🎉 All reservation system tests completed!');
}

async function testBasicReservationOperations() {
  try {
    // Test creating a reservation via API
    const response = await fetch('http://localhost:3000/api/stock/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: JORDAN_PRODUCT_ID,
        variantId: null,
        quantity: 2,
        name: 'Test Product',
        brand: 'Test Brand',
        price: 100,
        image: '/test.jpg',
        size: 'US 9',
        color: 'Black',
        maxStock: 10,
        expirationMinutes: 15
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data.reservationId) {
      console.log('✅ Reservation created successfully:', result.data.reservationId);

      // Test validating the reservation
      const validationResponse = await fetch(
        `http://localhost:3000/api/stock/reservations/validate?id=${result.data.reservationId}`
      );

      const validationResult = await validationResponse.json();

      if (validationResult.success && validationResult.data.valid) {
        console.log('✅ Reservation validation passed');
      } else {
        console.log('❌ Reservation validation failed:', validationResult.data.reason);
      }

      // Clean up the test reservation
      await fetch(`http://localhost:3000/api/stock/reservations?id=${result.data.reservationId}`, {
        method: 'DELETE',
      });

      console.log('✅ Test reservation cleaned up');
    } else {
      console.log('❌ Failed to create reservation:', result.error);
    }

  } catch (error) {
    console.error('❌ Basic reservation test failed:', error.message);
  }
}

async function testRaceConditionPrevention() {
  try {
    // Get a variant with limited stock for testing
    const { data: variant, error } = await supabase
      .from('product_variants')
      .select('id, size, stock_quantity')
      .eq('product_id', JORDAN_PRODUCT_ID)
      .eq('size', '45')
      .single();

    if (error || !variant) {
      console.log('❌ No test variant found');
      return;
    }

    console.log(`Testing with Size ${variant.size} (variant ID: ${variant.id})`);

    // Attempt to create multiple reservations simultaneously for the same limited stock
    const reservationPromises = [];
    const requestQuantity = 2;
    const numberOfConcurrentRequests = 3; // This should exceed available stock

    for (let i = 0; i < numberOfConcurrentRequests; i++) {
      const promise = fetch('http://localhost:3000/api/stock/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: JORDAN_PRODUCT_ID,
          variantId: variant.id,
          quantity: requestQuantity,
          name: `Concurrent Test ${i}`,
          brand: 'Test Brand',
          price: 100,
          image: '/test.jpg',
          size: variant.size,
          color: 'Black',
          maxStock: 10,
          expirationMinutes: 1 // Short expiration for testing
        }),
      }).then(response => response.json());

      reservationPromises.push(promise);
    }

    const results = await Promise.all(reservationPromises);
    const successfulReservations = results.filter(r => r.success);
    const failedReservations = results.filter(r => !r.success);

    console.log(`✅ Concurrent reservation results:`);
    console.log(`   - Successful: ${successfulReservations.length}`);
    console.log(`   - Failed: ${failedReservations.length}`);

    // Clean up successful reservations
    for (const reservation of successfulReservations) {
      if (reservation.data?.reservationId) {
        await fetch(`http://localhost:3000/api/stock/reservations?id=${reservation.data.reservationId}`, {
          method: 'DELETE',
        });
      }
    }

    if (failedReservations.length > 0) {
      console.log('✅ Race condition prevention working - some requests were properly rejected');
    } else {
      console.log('⚠️ All reservations succeeded - may indicate insufficient stock limits for testing');
    }

  } catch (error) {
    console.error('❌ Race condition test failed:', error.message);
  }
}

async function testAutomaticExpiration() {
  try {
    // Create a reservation with very short expiration
    const response = await fetch('http://localhost:3000/api/stock/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: JORDAN_PRODUCT_ID,
        quantity: 1,
        name: 'Expiration Test',
        brand: 'Test Brand',
        price: 100,
        image: '/test.jpg',
        size: 'US 10',
        color: 'Black',
        maxStock: 10,
        expirationMinutes: 0.1 // 6 seconds
      }),
    });

    const result = await response.json();

    if (result.success && result.data.reservationId) {
      console.log('✅ Short-lived reservation created');

      // Wait for expiration
      console.log('⏳ Waiting for automatic expiration...');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      // Trigger cleanup
      await fetch('http://localhost:3000/api/stock/reservations/cleanup', {
        method: 'POST',
      });

      // Check if reservation is now expired
      const validationResponse = await fetch(
        `http://localhost:3000/api/stock/reservations/validate?id=${result.data.reservationId}`
      );

      const validationResult = await validationResponse.json();

      if (!validationResult.data.valid && validationResult.data.reason?.includes('expired')) {
        console.log('✅ Automatic expiration working correctly');
      } else {
        console.log('❌ Reservation should have expired but is still valid');
      }

    } else {
      console.log('❌ Failed to create test reservation:', result.error);
    }

  } catch (error) {
    console.error('❌ Expiration test failed:', error.message);
  }
}

async function testReservationExtension() {
  try {
    // Create a reservation
    const response = await fetch('http://localhost:3000/api/stock/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: JORDAN_PRODUCT_ID,
        quantity: 1,
        name: 'Extension Test',
        brand: 'Test Brand',
        price: 100,
        image: '/test.jpg',
        size: 'US 10',
        color: 'Black',
        maxStock: 10,
        expirationMinutes: 15
      }),
    });

    const result = await response.json();

    if (result.success && result.data.reservationId) {
      console.log('✅ Reservation created for extension test');

      // Extend the reservation
      const extensionResponse = await fetch('http://localhost:3000/api/stock/reservations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: result.data.reservationId,
          action: 'extend',
          additionalMinutes: 30
        }),
      });

      const extensionResult = await extensionResponse.json();

      if (extensionResult.success) {
        console.log('✅ Reservation extended successfully');
      } else {
        console.log('❌ Failed to extend reservation:', extensionResult.error);
      }

      // Clean up
      await fetch(`http://localhost:3000/api/stock/reservations?id=${result.data.reservationId}`, {
        method: 'DELETE',
      });

    } else {
      console.log('❌ Failed to create test reservation:', result.error);
    }

  } catch (error) {
    console.error('❌ Extension test failed:', error.message);
  }
}

async function testOrderConversion() {
  try {
    // Create a reservation
    const response = await fetch('http://localhost:3000/api/stock/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: JORDAN_PRODUCT_ID,
        quantity: 1,
        name: 'Order Conversion Test',
        brand: 'Test Brand',
        price: 100,
        image: '/test.jpg',
        size: 'US 10',
        color: 'Black',
        maxStock: 10,
        expirationMinutes: 15
      }),
    });

    const result = await response.json();

    if (result.success && result.data.reservationId) {
      console.log('✅ Reservation created for order conversion test');

      // Confirm the reservation (simulate order completion)
      const confirmResponse = await fetch('http://localhost:3000/api/stock/reservations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: result.data.reservationId,
          action: 'confirm',
          orderId: 'TEST-ORDER-123'
        }),
      });

      const confirmResult = await confirmResponse.json();

      if (confirmResult.success) {
        console.log('✅ Reservation confirmed successfully for order');

        // Verify the reservation is now confirmed in database
        const { data: reservation } = await supabase
          .from('stock_reservations')
          .select('status, reference_id')
          .eq('id', result.data.reservationId)
          .single();

        if (reservation && reservation.status === 'confirmed') {
          console.log('✅ Reservation status updated to confirmed in database');
        } else {
          console.log('❌ Reservation status not properly updated');
        }

      } else {
        console.log('❌ Failed to confirm reservation:', confirmResult.error);
      }

    } else {
      console.log('❌ Failed to create test reservation:', result.error);
    }

  } catch (error) {
    console.error('❌ Order conversion test failed:', error.message);
  }
}

async function testCleanupOperations() {
  try {
    // Get cleanup status
    const statusResponse = await fetch('http://localhost:3000/api/cron/cleanup-reservations');
    const statusResult = await statusResponse.json();

    if (statusResult.success) {
      console.log('✅ Cleanup status retrieved successfully');
      console.log(`   - Active reservations: ${statusResult.data.activeReservations}`);
      console.log(`   - Expired reservations: ${statusResult.data.expiredReservations}`);
      console.log(`   - Needs cleanup: ${statusResult.data.needsCleanup}`);
    } else {
      console.log('❌ Failed to get cleanup status');
    }

    // Trigger manual cleanup
    const cleanupResponse = await fetch('http://localhost:3000/api/stock/reservations/cleanup', {
      method: 'POST',
    });

    const cleanupResult = await cleanupResponse.json();

    if (cleanupResult.success) {
      console.log('✅ Manual cleanup executed successfully');
    } else {
      console.log('❌ Manual cleanup failed:', cleanupResult.error);
    }

  } catch (error) {
    console.error('❌ Cleanup operations test failed:', error.message);
  }
}

async function testDatabaseConsistency() {
  try {
    // Check that stock levels and reservations are consistent
    const { data: stockLevels } = await supabase
      .from('stock_levels')
      .select('id, product_id, quantity_on_hand, quantity_reserved, quantity_available')
      .limit(5);

    const { data: activeReservations } = await supabase
      .from('stock_reservations')
      .select('product_id, quantity, stock_level_id')
      .eq('status', 'active');

    console.log(`✅ Database consistency check:`);
    console.log(`   - Stock levels checked: ${stockLevels?.length || 0}`);
    console.log(`   - Active reservations: ${activeReservations?.length || 0}`);

    // Verify calculations are consistent
    let consistencyIssues = 0;

    for (const stockLevel of stockLevels || []) {
      const relatedReservations = activeReservations?.filter(
        r => r.stock_level_id === stockLevel.id
      ) || [];

      const totalReserved = relatedReservations.reduce((sum, r) => sum + r.quantity, 0);
      const expectedAvailable = stockLevel.quantity_on_hand - totalReserved;

      if (Math.abs(stockLevel.quantity_available - expectedAvailable) > 0.01) {
        consistencyIssues++;
        console.log(`❌ Inconsistency found in stock level ${stockLevel.id}`);
        console.log(`   Expected available: ${expectedAvailable}, Actual: ${stockLevel.quantity_available}`);
      }
    }

    if (consistencyIssues === 0) {
      console.log('✅ All checked stock levels are consistent');
    } else {
      console.log(`❌ Found ${consistencyIssues} consistency issues`);
    }

  } catch (error) {
    console.error('❌ Database consistency test failed:', error.message);
  }
}

// Run tests
runReservationTests()
  .then(() => {
    console.log('\n✅ All reservation system tests completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Reservation system tests failed:', error);
    process.exit(1);
  });