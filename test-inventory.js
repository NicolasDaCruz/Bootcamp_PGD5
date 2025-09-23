// Test script for inventory management system
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ryuwogdvwcxgidoqnbxn.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dXdvZ2R2d2N4Z2lkb3FuYnhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1MDAzNzUsImV4cCI6MjA0NzA3NjM3NX0.7A0EY2N79dQK0YmQWdnccQfmeyo5hsNVaIFqotKjQJo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInventorySystem() {
  console.log('🧪 Testing Inventory Management System\n');
  console.log('=====================================\n');

  try {
    // 1. Test database schema
    console.log('1. Testing Database Schema...');
    const tables = [
      'products',
      'product_variants',
      'product_inventory',
      'stock_movements',
      'stock_alerts',
      'stock_reservations'
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ Table ${table}: Error - ${error.message}`);
      } else {
        console.log(`   ✅ Table ${table}: Found (${count} records)`);
      }
    }

    // 2. Test inventory relationships
    console.log('\n2. Testing Inventory Relationships...');
    const { data: sampleProduct, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        stock_quantity,
        product_inventory (
          current_stock,
          available_stock,
          reserved_stock
        ),
        product_variants (
          id,
          name,
          stock_quantity
        )
      `)
      .limit(1)
      .single();

    if (productError) {
      console.log(`   ❌ Relationship test failed: ${productError.message}`);
    } else {
      console.log('   ✅ Product relationships working');
      if (sampleProduct) {
        console.log(`      Sample: ${sampleProduct.name}`);
        console.log(`      Stock: ${sampleProduct.stock_quantity}`);
        console.log(`      Variants: ${sampleProduct.product_variants?.length || 0}`);
        console.log(`      Inventory Records: ${sampleProduct.product_inventory?.length || 0}`);
      }
    }

    // 3. Test stock alerts
    console.log('\n3. Testing Stock Alerts...');
    const { data: alerts, error: alertError } = await supabase
      .from('stock_alerts')
      .select('alert_type, is_active')
      .eq('is_active', true)
      .limit(5);

    if (alertError) {
      console.log(`   ❌ Alerts query failed: ${alertError.message}`);
    } else {
      console.log(`   ✅ Active alerts: ${alerts.length}`);
      const alertTypes = alerts.reduce((acc, alert) => {
        acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
        return acc;
      }, {});
      Object.entries(alertTypes).forEach(([type, count]) => {
        console.log(`      ${type}: ${count}`);
      });
    }

    // 4. Test stock movements
    console.log('\n4. Testing Stock Movements...');
    const { data: movements, error: movementError } = await supabase
      .from('stock_movements')
      .select('movement_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (movementError) {
      console.log(`   ❌ Movements query failed: ${movementError.message}`);
    } else {
      console.log(`   ✅ Recent movements: ${movements.length}`);
      movements.forEach(m => {
        const date = new Date(m.created_at);
        console.log(`      ${m.movement_type} - ${date.toLocaleDateString()}`);
      });
    }

    // 5. Test real-time subscriptions
    console.log('\n5. Testing Real-time Subscriptions...');
    const channel = supabase
      .channel('test-inventory')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_inventory'
        },
        (payload) => {
          console.log('   📡 Real-time update received:', payload.eventType);
        }
      );

    const status = await new Promise((resolve) => {
      channel.subscribe((status) => {
        resolve(status);
      });
    });

    if (status === 'SUBSCRIBED') {
      console.log('   ✅ Real-time subscription active');
    } else {
      console.log(`   ❌ Real-time subscription failed: ${status}`);
    }

    // Clean up
    supabase.removeChannel(channel);

    console.log('\n=====================================');
    console.log('✅ Inventory system test completed!');
    console.log('=====================================\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }

  process.exit(0);
}

// Run tests
testInventorySystem();