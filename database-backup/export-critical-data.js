/**
 * Critical Data Export Script
 * Exports important data to JSON format for additional backup
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create backup directory
const backupDir = path.join(process.cwd(), 'database-backup', 'json-exports');

async function ensureBackupDirectory() {
  try {
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`Backup directory created: ${backupDir}`);
  } catch (error) {
    console.error('Error creating backup directory:', error);
  }
}

async function exportTable(tableName, query = {}) {
  console.log(`Exporting ${tableName}...`);

  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error exporting ${tableName}:`, error);
      return { success: false, error: error.message };
    }

    const exportData = {
      tableName,
      exportDate: new Date().toISOString(),
      recordCount: count || data?.length || 0,
      data: data || []
    };

    const fileName = `${tableName}_${new Date().toISOString().split('T')[0]}.json`;
    const filePath = path.join(backupDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));

    console.log(`✓ Exported ${exportData.recordCount} records from ${tableName}`);
    return { success: true, recordCount: exportData.recordCount, fileName };

  } catch (error) {
    console.error(`Error exporting ${tableName}:`, error);
    return { success: false, error: error.message };
  }
}

async function exportCriticalTables() {
  const criticalTables = [
    'users',
    'sneakers',
    'products',
    'orders',
    'order_items',
    'cart_items',
    'stock_levels',
    'stock_movements',
    'categories',
    'reviews',
    'wishlist_items',
    'wishlists',
    'product_variants',
    'product_images',
    'shipping_rates'
  ];

  const exportResults = [];

  for (const table of criticalTables) {
    const result = await exportTable(table);
    exportResults.push({ table, ...result });
  }

  return exportResults;
}

async function createBackupManifest(results) {
  const manifest = {
    backupDate: new Date().toISOString(),
    backupVersion: '1.0.0',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    tables: results,
    summary: {
      totalTables: results.length,
      successfulExports: results.filter(r => r.success).length,
      failedExports: results.filter(r => !r.success).length,
      totalRecords: results.reduce((sum, r) => sum + (r.recordCount || 0), 0)
    }
  };

  const manifestPath = path.join(backupDir, 'backup-manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('\nBackup Manifest created:', manifestPath);
  return manifest;
}

async function exportRelationshipData() {
  console.log('\nExporting relationship data...');

  const relationships = [];

  // Export user-order relationships
  try {
    const { data: userOrders } = await supabase
      .from('orders')
      .select('id, user_id, created_at, status')
      .order('created_at', { ascending: true });

    relationships.push({
      relationship: 'user_orders',
      data: userOrders || []
    });
  } catch (error) {
    console.error('Error exporting user-order relationships:', error);
  }

  // Export product-stock relationships
  try {
    const { data: productStock } = await supabase
      .from('stock_levels')
      .select('product_id, variant_id, quantity, reserved_quantity')
      .order('product_id', { ascending: true });

    relationships.push({
      relationship: 'product_stock',
      data: productStock || []
    });
  } catch (error) {
    console.error('Error exporting product-stock relationships:', error);
  }

  // Save relationships
  const relationshipsPath = path.join(backupDir, 'relationships.json');
  await fs.writeFile(relationshipsPath, JSON.stringify({
    exportDate: new Date().toISOString(),
    relationships
  }, null, 2));

  console.log('✓ Relationship data exported');
}

async function createRestoreScript() {
  const restoreScript = `
/**
 * Data Restore Script
 * Use this script to restore data from JSON backups
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function restoreTable(tableName) {
  const filePath = path.join(process.cwd(), 'database-backup', 'json-exports', \`\${tableName}_*.json\`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const backup = JSON.parse(fileContent);

    console.log(\`Restoring \${backup.recordCount} records to \${tableName}...\`);

    // Insert data in batches
    const batchSize = 100;
    const data = backup.data;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const { error } = await supabase
        .from(tableName)
        .insert(batch);

      if (error) {
        console.error(\`Error restoring batch to \${tableName}:\`, error);
        return false;
      }

      console.log(\`Restored \${Math.min(i + batchSize, data.length)} of \${data.length} records\`);
    }

    return true;

  } catch (error) {
    console.error(\`Error restoring \${tableName}:\`, error);
    return false;
  }
}

// Example usage:
// await restoreTable('users');
// await restoreTable('products');
`;

  const restoreScriptPath = path.join(backupDir, 'restore-script.js');
  await fs.writeFile(restoreScriptPath, restoreScript);

  console.log('✓ Restore script created:', restoreScriptPath);
}

// Main execution
async function main() {
  console.log('Starting critical data export...\n');

  await ensureBackupDirectory();

  const results = await exportCriticalTables();

  await exportRelationshipData();

  const manifest = await createBackupManifest(results);

  await createRestoreScript();

  console.log('\n=================================');
  console.log('BACKUP SUMMARY');
  console.log('=================================');
  console.log(`Total Tables: ${manifest.summary.totalTables}`);
  console.log(`Successful Exports: ${manifest.summary.successfulExports}`);
  console.log(`Failed Exports: ${manifest.summary.failedExports}`);
  console.log(`Total Records Backed Up: ${manifest.summary.totalRecords}`);
  console.log(`Backup Location: ${backupDir}`);
  console.log('=================================\n');

  if (manifest.summary.failedExports > 0) {
    console.log('Failed exports:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.table}: ${r.error}`);
    });
  }
}

// Run the export
main().catch(console.error);