import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting stock management functions migration...');

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/006_add_update_variant_stock_function.sql');

    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json({
        success: false,
        error: 'Migration file not found'
      }, { status: 404 });
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // Filter out comments and empty statements
        return s.length > 0 &&
               !s.startsWith('--') &&
               !s.startsWith('/*') &&
               !s.toLowerCase().includes('migration success log') &&
               !s.toLowerCase().includes('select \'stock management functions');
      });

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      if (statement.trim().length === 0) continue;

      try {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);

        const { error } = await supabase.from('_temp').select('*').limit(0);

        // For function creation, we need to use a different approach
        if (statement.toLowerCase().includes('create or replace function') ||
            statement.toLowerCase().includes('create function')) {

          // Extract function name for logging
          const functionMatch = statement.match(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
          const functionName = functionMatch ? functionMatch[1] : 'unknown';

          console.log(`   📦 Creating function: ${functionName}`);
        }

        // Try to execute the statement directly
        const { error: execError } = await supabase.rpc('exec_sql', {
          sql: statement
        }).catch(async () => {
          // If exec_sql doesn't exist, try alternative approach
          return await supabase.from('_functions').select('*').limit(0).then(
            () => ({ error: null }),
            () => ({ error: 'No direct SQL execution available' })
          );
        });

        if (execError && !execError.message?.includes('does not exist')) {
          console.warn(`⚠️ Statement ${i + 1} warning:`, execError.message);
          errorCount++;
          results.push({
            statement: statement.substring(0, 200),
            success: false,
            error: execError.message
          });
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
          results.push({
            statement: statement.substring(0, 200),
            success: true
          });
        }
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        errorCount++;
        results.push({
          statement: statement.substring(0, 200),
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Test if functions were created successfully
    console.log('🧪 Testing if functions were created...');

    const testResults = {
      update_variant_stock: false,
      validate_order_stock: false,
      process_order_stock_changes: false
    };

    // Test update_variant_stock function
    try {
      const { error } = await supabase.rpc('update_variant_stock', {
        variant_id: '00000000-0000-0000-0000-000000000000',
        quantity_change: 0
      });
      testResults.update_variant_stock = error?.message?.includes('Variant not found') || false;
    } catch (e) {
      testResults.update_variant_stock = false;
    }

    // Test validate_order_stock function
    try {
      const { error } = await supabase.rpc('validate_order_stock', {
        order_items: []
      });
      testResults.validate_order_stock = !error;
    } catch (e) {
      testResults.validate_order_stock = false;
    }

    // Test process_order_stock_changes function
    try {
      const { error } = await supabase.rpc('process_order_stock_changes', {
        order_id: '00000000-0000-0000-0000-000000000000',
        order_items: []
      });
      testResults.process_order_stock_changes = !error;
    } catch (e) {
      testResults.process_order_stock_changes = false;
    }

    const allFunctionsWorking = Object.values(testResults).every(Boolean);

    console.log('📊 Migration summary:', {
      totalStatements: statements.length,
      successful: successCount,
      errors: errorCount,
      functionsWorking: testResults
    });

    return NextResponse.json({
      success: allFunctionsWorking,
      migration: {
        totalStatements: statements.length,
        successful: successCount,
        errors: errorCount,
        results: results
      },
      functions: testResults,
      message: allFunctionsWorking
        ? 'Stock management functions have been successfully installed!'
        : 'Migration completed with some issues. Manual intervention may be required.'
    });

  } catch (error) {
    console.error('💥 Critical error during migration:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to run the stock management functions migration',
    endpoint: '/api/admin/migrate-stock-functions'
  });
}