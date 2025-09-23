#!/usr/bin/env node

/**
 * Critical Data JSON Backup Script
 * For Supabase Sneaker Store Project
 * Generated on: 2025-09-21
 *
 * This script exports critical business data as JSON files for:
 * - Data analysis and reporting
 * - Easy data migration between systems
 * - Human-readable backup format
 * - Application testing with real data structure
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuration
const BACKUP_DIR = '/Users/nicodcz/Desktop/PGD 5/Bootcamp/sneaker-store/database-backup';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
                 new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];

// Supabase configuration from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gddkggcsytffswlzqezn.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGtnZ2NzeXRmZnN3bHpxZXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjQ4NzYsImV4cCI6MjA3MzYwMDg3Nn0.DhsjkEE1VH5PgCCXLnEH_fdjMINQrN0KDBk3v1vuOp4';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Define critical tables and their export configurations
const criticalTables = {
    users: {
        tableName: 'users',
        description: 'User accounts and profiles',
        columns: ['id', 'email', 'full_name', 'created_at', 'updated_at', 'phone', 'address'],
        orderBy: 'created_at'
    },
    products: {
        tableName: 'products',
        description: 'Product catalog',
        columns: ['id', 'name', 'description', 'price', 'brand', 'category_id', 'created_at', 'updated_at', 'is_active'],
        orderBy: 'created_at'
    },
    orders: {
        tableName: 'orders',
        description: 'Customer orders',
        columns: ['id', 'user_id', 'total_amount', 'status', 'shipping_address', 'created_at', 'updated_at'],
        orderBy: 'created_at'
    },
    order_items: {
        tableName: 'order_items',
        description: 'Individual items in orders',
        columns: ['id', 'order_id', 'product_id', 'quantity', 'price', 'size', 'created_at'],
        orderBy: 'created_at'
    },
    categories: {
        tableName: 'categories',
        description: 'Product categories',
        columns: ['id', 'name', 'description', 'parent_id', 'created_at'],
        orderBy: 'name'
    },
    product_variants: {
        tableName: 'product_variants',
        description: 'Product size/color variants',
        columns: ['id', 'product_id', 'size', 'color', 'sku', 'price_adjustment', 'created_at'],
        orderBy: 'product_id'
    },
    product_inventory: {
        tableName: 'product_inventory',
        description: 'Product stock levels',
        columns: ['id', 'product_id', 'variant_id', 'quantity', 'reserved_quantity', 'updated_at'],
        orderBy: 'product_id'
    },
    reviews: {
        tableName: 'reviews',
        description: 'Product reviews and ratings',
        columns: ['id', 'product_id', 'user_id', 'rating', 'comment', 'created_at', 'is_verified'],
        orderBy: 'created_at'
    },
    wishlists: {
        tableName: 'wishlists',
        description: 'User wishlists',
        columns: ['id', 'user_id', 'name', 'is_public', 'created_at'],
        orderBy: 'created_at'
    },
    loyalty_programs: {
        tableName: 'loyalty_programs',
        description: 'Loyalty program configurations',
        columns: ['id', 'name', 'description', 'points_per_dollar', 'is_active', 'created_at'],
        orderBy: 'name'
    }
};

async function ensureDirectoryExists(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

async function exportTableToJSON(tableConfig) {
    const { tableName, description, columns, orderBy } = tableConfig;

    log(`  Exporting ${tableName}...`, 'blue');

    try {
        // Build query
        let query = supabase
            .from(tableName)
            .select(columns.join(','));

        if (orderBy) {
            query = query.order(orderBy);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        // Create export object with metadata
        const exportData = {
            metadata: {
                table: tableName,
                description: description,
                exportedAt: new Date().toISOString(),
                totalRecords: data ? data.length : 0,
                columns: columns
            },
            data: data || []
        };

        // Write to JSON file
        const jsonDir = path.join(BACKUP_DIR, 'json');
        await ensureDirectoryExists(jsonDir);

        const filename = `${tableName}_${timestamp}.json`;
        const filepath = path.join(jsonDir, filename);

        await fs.writeFile(
            filepath,
            JSON.stringify(exportData, null, 2),
            'utf8'
        );

        log(`    ✓ ${tableName}: ${data.length} records exported to ${filename}`, 'green');

        return {
            table: tableName,
            records: data.length,
            filename: filename,
            success: true
        };

    } catch (error) {
        log(`    ✗ ${tableName}: Export failed - ${error.message}`, 'red');
        return {
            table: tableName,
            records: 0,
            filename: null,
            success: false,
            error: error.message
        };
    }
}

async function createCombinedExport(exportResults) {
    log('Creating combined export file...', 'yellow');

    const combinedData = {
        metadata: {
            project: 'Supabase Sneaker Store',
            exportType: 'Critical Business Data',
            exportedAt: new Date().toISOString(),
            timestamp: timestamp,
            totalTables: exportResults.length,
            successfulTables: exportResults.filter(r => r.success).length,
            failedTables: exportResults.filter(r => !r.success).length
        },
        tables: {}
    };

    // Load each exported JSON file and combine
    for (const result of exportResults) {
        if (result.success) {
            try {
                const filepath = path.join(BACKUP_DIR, 'json', result.filename);
                const fileContent = await fs.readFile(filepath, 'utf8');
                const tableData = JSON.parse(fileContent);
                combinedData.tables[result.table] = tableData;
            } catch (error) {
                log(`    Warning: Could not include ${result.table} in combined export: ${error.message}`, 'yellow');
            }
        }
    }

    // Write combined file
    const combinedFilename = `critical_data_combined_${timestamp}.json`;
    const combinedFilepath = path.join(BACKUP_DIR, 'json', combinedFilename);

    await fs.writeFile(
        combinedFilepath,
        JSON.stringify(combinedData, null, 2),
        'utf8'
    );

    log(`  ✓ Combined export created: ${combinedFilename}`, 'green');
    return combinedFilename;
}

async function createBackupSummary(exportResults, combinedFilename) {
    log('Generating backup summary...', 'yellow');

    const summaryContent = `# JSON Backup Summary
Generated on: ${new Date().toISOString()}
Timestamp: ${timestamp}

## Overview
- Project: Supabase Sneaker Store
- Backup Type: Critical Business Data (JSON Format)
- Total Tables: ${exportResults.length}
- Successful Exports: ${exportResults.filter(r => r.success).length}
- Failed Exports: ${exportResults.filter(r => !r.success).length}

## Exported Files

### Individual Table Exports
${exportResults.map(result => {
    if (result.success) {
        return `- **${result.table}**: ${result.filename} (${result.records} records)`;
    } else {
        return `- **${result.table}**: EXPORT FAILED - ${result.error}`;
    }
}).join('\n')}

### Combined Export
- **All Tables**: ${combinedFilename}

## File Structure
\`\`\`
database-backup/json/
├── ${combinedFilename}                    # Combined export
${exportResults.filter(r => r.success).map(r => `├── ${r.filename}`).join('\n')}
└── json_backup_summary_${timestamp}.md   # This summary
\`\`\`

## Usage Examples

### Loading Individual Table Data
\`\`\`javascript
// Load user data
const userData = require('./users_${timestamp}.json');
console.log(\`Total users: \${userData.metadata.totalRecords}\`);
const users = userData.data;
\`\`\`

### Loading Combined Data
\`\`\`javascript
// Load all critical data
const allData = require('./critical_data_combined_${timestamp}.json');
const users = allData.tables.users.data;
const products = allData.tables.products.data;
const orders = allData.tables.orders.data;
\`\`\`

### Data Analysis
\`\`\`javascript
// Analyze order patterns
const orderData = require('./orders_${timestamp}.json');
const totalRevenue = orderData.data.reduce((sum, order) => sum + order.total_amount, 0);
console.log(\`Total revenue: $\${totalRevenue}\`);
\`\`\`

## Recovery/Import Instructions

### For Application Testing
1. Copy JSON files to your test environment
2. Use the data to seed test databases
3. Import using custom scripts or database tools

### For Data Migration
1. Parse JSON files using your preferred language
2. Transform data as needed for target system
3. Use bulk import tools for efficient loading

### For Analytics
1. Load JSON files into analytics tools (Python pandas, R, etc.)
2. Use for business intelligence and reporting
3. Create data visualizations and insights

## File Integrity
Each JSON file includes:
- Metadata with export timestamp
- Column information
- Record count for verification
- Full data array

## Security Notes
- JSON files contain actual production data
- Ensure proper access controls
- Consider encryption for sensitive data
- Do not commit to public repositories

---
Generated by Sneaker Store Backup System
`;

    const summaryFilename = `json_backup_summary_${timestamp}.md`;
    const summaryFilepath = path.join(BACKUP_DIR, 'json', summaryFilename);

    await fs.writeFile(summaryFilepath, summaryContent, 'utf8');
    log(`  ✓ Backup summary created: ${summaryFilename}`, 'green');

    return summaryFilename;
}

async function main() {
    log('=== Supabase JSON Backup Script ===', 'cyan');
    log(`Timestamp: ${timestamp}`, 'cyan');
    log(`Backup Directory: ${BACKUP_DIR}`, 'cyan');
    log('');

    // Test Supabase connection
    log('1. Testing Supabase connection...', 'yellow');
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });

        if (error) {
            throw error;
        }

        log('  ✓ Supabase connection successful', 'green');
    } catch (error) {
        log(`  ✗ Supabase connection failed: ${error.message}`, 'red');
        log('  Please check your Supabase configuration and network connection.', 'red');
        process.exit(1);
    }

    // Export each critical table
    log('2. Exporting critical tables to JSON...', 'yellow');
    const exportResults = [];

    for (const [key, tableConfig] of Object.entries(criticalTables)) {
        const result = await exportTableToJSON(tableConfig);
        exportResults.push(result);
    }

    // Create combined export
    log('3. Creating combined export...', 'yellow');
    const combinedFilename = await createCombinedExport(exportResults);

    // Create backup summary
    log('4. Generating documentation...', 'yellow');
    const summaryFilename = await createBackupSummary(exportResults, combinedFilename);

    // Create latest symlinks
    log('5. Creating latest symlinks...', 'yellow');
    try {
        const jsonDir = path.join(BACKUP_DIR, 'json');
        const latestCombined = path.join(jsonDir, 'latest_combined.json');
        const latestSummary = path.join(jsonDir, 'latest_summary.md');

        // Remove existing symlinks if they exist
        try {
            await fs.unlink(latestCombined);
        } catch {}
        try {
            await fs.unlink(latestSummary);
        } catch {}

        // Create new symlinks
        await fs.symlink(combinedFilename, latestCombined);
        await fs.symlink(summaryFilename, latestSummary);

        log('  ✓ Latest symlinks created', 'green');
    } catch (error) {
        log(`  Warning: Could not create symlinks: ${error.message}`, 'yellow');
    }

    // Final summary
    log('', 'reset');
    log('=== JSON Backup Complete ===', 'green');

    const successCount = exportResults.filter(r => r.success).length;
    const totalRecords = exportResults.reduce((sum, r) => sum + r.records, 0);

    log(`Successful exports: ${successCount}/${exportResults.length}`, 'green');
    log(`Total records exported: ${totalRecords}`, 'green');
    log('', 'reset');

    log('Files created:', 'cyan');
    log(`  - Combined JSON: ${combinedFilename}`, 'cyan');
    log(`  - Summary: ${summaryFilename}`, 'cyan');
    log(`  - Individual files: ${successCount} table exports`, 'cyan');
    log('', 'reset');

    if (exportResults.some(r => !r.success)) {
        log('Warnings:', 'yellow');
        exportResults
            .filter(r => !r.success)
            .forEach(r => log(`  - ${r.table}: ${r.error}`, 'yellow'));
        log('', 'reset');
    }

    log('Next steps:', 'cyan');
    log('  1. Review backup documentation', 'cyan');
    log('  2. Run verification script: ./verify-backups.sh', 'cyan');
    log('  3. Test data integrity and completeness', 'cyan');
}

// Handle errors
process.on('unhandledRejection', (error) => {
    log(`Unhandled error: ${error.message}`, 'red');
    process.exit(1);
});

// Run the script
if (require.main === module) {
    main().catch(error => {
        log(`Script failed: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    });
}

module.exports = {
    main,
    exportTableToJSON,
    criticalTables
};