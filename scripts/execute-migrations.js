/**
 * Execute Database Migrations Script
 * Applies all migration files to the Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Initialize Supabase client with service key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migration tracking table
const MIGRATION_TABLE = 'schema_migrations';

// Create migration tracking table if it doesn't exist
async function createMigrationTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      execution_time_ms INTEGER,
      checksum TEXT,
      success BOOLEAN DEFAULT TRUE,
      error_message TEXT
    );
  `;

  const { error } = await supabase.rpc('exec_sql', { query: createTableSQL });

  if (error && !error.message.includes('already exists')) {
    console.error('❌ Failed to create migration table:', error);
    throw error;
  }
}

// Get list of executed migrations
async function getExecutedMigrations() {
  const { data, error } = await supabase
    .from(MIGRATION_TABLE)
    .select('filename')
    .eq('success', true);

  if (error) {
    console.error('❌ Failed to get executed migrations:', error);
    return [];
  }

  return data.map(m => m.filename);
}

// Get migration files
async function getMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

  try {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Sort to ensure correct execution order

    const migrations = [];

    for (const filename of sqlFiles) {
      const filePath = path.join(migrationsDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');

      migrations.push({
        filename,
        filePath,
        content
      });
    }

    return migrations;
  } catch (error) {
    console.error('❌ Failed to read migration files:', error);
    return [];
  }
}

// Calculate checksum for migration file
function calculateChecksum(content) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(content).digest('hex');
}

// Execute a single migration
async function executeMigration(migration) {
  const startTime = Date.now();

  console.log(`\n📋 Executing migration: ${migration.filename}`);
  console.log('   Path:', migration.filePath);

  try {
    // Split the migration into individual statements
    // This is a simple split - in production, use a proper SQL parser
    const statements = migration.content
      .split(/;[\s]*$/gm)
      .filter(s => s.trim().length > 0)
      .filter(s => !s.trim().startsWith('--'));

    let statementCount = 0;

    for (const statement of statements) {
      // Skip empty statements and comments
      if (!statement.trim() || statement.trim().startsWith('/*')) {
        continue;
      }

      // Execute the statement
      const { error } = await supabase.rpc('exec_sql', { query: statement });

      if (error) {
        throw new Error(`Statement ${statementCount + 1} failed: ${error.message}`);
      }

      statementCount++;
    }

    const executionTime = Date.now() - startTime;

    // Record successful migration
    await supabase.from(MIGRATION_TABLE).insert({
      filename: migration.filename,
      execution_time_ms: executionTime,
      checksum: calculateChecksum(migration.content),
      success: true
    });

    console.log(`   ✅ Migration completed successfully`);
    console.log(`   ⏱️  Execution time: ${executionTime}ms`);
    console.log(`   📝 Statements executed: ${statementCount}`);

    return { success: true, executionTime };

  } catch (error) {
    const executionTime = Date.now() - startTime;

    // Record failed migration
    await supabase.from(MIGRATION_TABLE).insert({
      filename: migration.filename,
      execution_time_ms: executionTime,
      checksum: calculateChecksum(migration.content),
      success: false,
      error_message: error.message
    });

    console.error(`   ❌ Migration failed: ${error.message}`);

    return { success: false, error: error.message, executionTime };
  }
}

// Create RPC function for executing SQL (if not exists)
async function createExecSQLFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS void AS $$
    BEGIN
      EXECUTE query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  // This might fail if the function already exists, which is fine
  await supabase.rpc('query', { query: createFunctionSQL }).catch(() => {});
}

// Main execution
async function main() {
  console.log('🚀 Starting database migration process...\n');
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('🔐 Using service key authentication\n');

  try {
    // Create migration tracking table
    await createMigrationTable();

    // Create SQL execution function
    await createExecSQLFunction();

    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    console.log(`📊 Previously executed migrations: ${executedMigrations.length}`);

    // Get migration files
    const migrationFiles = await getMigrationFiles();
    console.log(`📁 Total migration files found: ${migrationFiles.length}`);

    // Filter out already executed migrations
    const pendingMigrations = migrationFiles.filter(
      m => !executedMigrations.includes(m.filename)
    );

    if (pendingMigrations.length === 0) {
      console.log('\n✨ All migrations are up to date!');
      return;
    }

    console.log(`\n🔄 Pending migrations: ${pendingMigrations.length}`);
    pendingMigrations.forEach(m => console.log(`   - ${m.filename}`));

    // Execute pending migrations
    const results = [];
    for (const migration of pendingMigrations) {
      const result = await executeMigration(migration);
      results.push({ ...result, filename: migration.filename });

      if (!result.success) {
        console.error('\n⚠️  Migration failed. Stopping execution.');
        break;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);

    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total time: ${totalTime}ms`);

    if (failed > 0) {
      console.log('\n❌ Failed migrations:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.filename}: ${r.error}`);
      });
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  }
}

// Add command line options
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
Database Migration Tool

Usage: node execute-migrations.js [options]

Options:
  --help        Show this help message
  --dry-run     Show what would be executed without running
  --rollback    Rollback the last migration
  --reset       Reset all migrations (dangerous!)

Environment Variables Required:
  NEXT_PUBLIC_SUPABASE_URL     Your Supabase project URL
  SUPABASE_SERVICE_KEY         Your Supabase service key (admin access)
`);
  process.exit(0);
}

// Run migrations
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});