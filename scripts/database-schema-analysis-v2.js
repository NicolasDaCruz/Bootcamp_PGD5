#!/usr/bin/env node

/**
 * Database Schema Analysis Script v2.0
 * Uses Supabase MCP tools to analyze database schema
 * Task #2: Analyze current database schema structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs').promises;
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Table list from the database
const ALL_TABLES = [
  'abandoned_carts', 'active_reservations', 'active_stock_alerts', 'automated_responses',
  'brand_sustainability_scorecards', 'cart_items', 'cart_recovery_links', 'categories',
  'chat_messages', 'chat_sessions', 'discount_codes', 'eco_certifications',
  'environmental_impact', 'faq_categories', 'faq_items', 'guest_checkouts',
  'import_summary', 'loyalty_programs', 'loyalty_rewards', 'loyalty_tiers',
  'loyalty_transactions', 'notification_log', 'notification_preferences',
  'order_analytics', 'order_items', 'order_notifications', 'order_status_history',
  'order_tracking_summary', 'order_tracking_updates', 'orders', 'packaging_options',
  'product_condition_assessments', 'product_eco_certifications', 'product_images',
  'product_inventory', 'product_maintenance_guides', 'product_variants', 'products',
  'recommendation_analytics', 'recommendation_cache', 'recommendation_metrics',
  'recycling_programs', 'recycling_submissions', 'review_helpful_votes',
  'review_moderation_log', 'review_photos', 'reviews', 'saved_items',
  'shipping_carriers', 'shipping_rates', 'sneaker_products_view', 'sneakers',
  'stock_alerts', 'stock_levels', 'stock_movement_audit', 'stock_movements',
  'stock_reservations', 'support_ticket_messages', 'support_tickets',
  'user_behavior', 'user_loyalty_points', 'user_packaging_preferences',
  'user_product_affinity', 'user_recycling_enrollments', 'user_reward_redemptions',
  'users', 'wishlist_items', 'wishlist_shares', 'wishlists'
];

class DatabaseAnalyzerV2 {
  constructor() {
    this.results = {
      tables: {},
      foreignKeys: [],
      dataVolume: {},
      orphanedData: [],
      errors: [],
      issues: [],
      analysis: {
        timestamp: new Date().toISOString(),
        totalTables: ALL_TABLES.length,
        totalColumns: 0,
        totalRecords: 0,
        schemaIssues: []
      }
    };
  }

  async analyze() {
    console.log('🔍 Starting database schema analysis v2.0...');
    console.log(`📊 Analyzing ${ALL_TABLES.length} tables in database`);

    try {
      // Step 1: Get detailed information for each table
      await this.analyzeAllTables();

      // Step 2: Identify foreign key relationships
      await this.identifyForeignKeys();

      // Step 3: Analyze data volume per table
      await this.analyzeDataVolume();

      // Step 4: Identify orphaned data and issues
      await this.identifyIssues();

      // Generate reports
      await this.generateComprehensiveReports();

      console.log('✅ Database schema analysis completed successfully!');

    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      this.results.errors.push({
        step: 'general',
        error: error.message
      });
    }
  }

  async analyzeAllTables() {
    console.log('\n📋 Step 1: Analyzing all tables and their columns...');

    for (const tableName of ALL_TABLES) {
      try {
        console.log(`  📄 Analyzing table: ${tableName}`);

        // Get column information for each table
        const { data: columns, error } = await supabase
          .rpc('sql', {
            query: `
              SELECT
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length,
                numeric_precision,
                numeric_scale,
                ordinal_position
              FROM information_schema.columns
              WHERE table_name = '${tableName}'
                AND table_schema = 'public'
              ORDER BY ordinal_position;
            `
          });

        if (error) {
          console.warn(`    ⚠️  Could not get columns for ${tableName}: ${error.message}`);
          this.results.errors.push({
            step: 'getColumns',
            table: tableName,
            error: error.message
          });
          continue;
        }

        this.results.tables[tableName] = {
          name: tableName,
          schema: 'public',
          columns: columns || [],
          recordCount: null,
          issues: []
        };

        this.results.analysis.totalColumns += (columns || []).length;

      } catch (error) {
        console.error(`    ❌ Error analyzing ${tableName}:`, error.message);
        this.results.errors.push({
          step: 'analyzeTable',
          table: tableName,
          error: error.message
        });
      }
    }

    console.log(`✅ Analyzed ${Object.keys(this.results.tables).length} tables`);
  }

  async identifyForeignKeys() {
    console.log('\n🔗 Step 2: Identifying foreign key relationships...');

    try {
      const { data: foreignKeys, error } = await supabase
        .rpc('sql', {
          query: `
            SELECT
              tc.table_name as source_table,
              kcu.column_name as source_column,
              ccu.table_name as target_table,
              ccu.column_name as target_column,
              tc.constraint_name,
              rc.update_rule,
              rc.delete_rule
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
            JOIN information_schema.referential_constraints rc
              ON tc.constraint_name = rc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = 'public'
            ORDER BY tc.table_name, kcu.column_name;
          `
        });

      if (error) {
        console.warn(`⚠️  Could not get foreign keys: ${error.message}`);
        this.results.errors.push({
          step: 'foreignKeys',
          error: error.message
        });
      } else {
        this.results.foreignKeys = foreignKeys || [];
        console.log(`✅ Found ${this.results.foreignKeys.length} foreign key relationships`);
      }

    } catch (error) {
      console.error('❌ Error identifying foreign keys:', error.message);
      this.results.errors.push({
        step: 'foreignKeys',
        error: error.message
      });
    }
  }

  async analyzeDataVolume() {
    console.log('\n📊 Step 3: Analyzing data volume per table...');

    let totalRecords = 0;
    let successCount = 0;

    for (const tableName of ALL_TABLES) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.warn(`    ⚠️  Could not count ${tableName}: ${error.message}`);
          this.results.dataVolume[tableName] = {
            count: null,
            error: error.message
          };

          // Check for specific error patterns
          if (error.message.includes('does not exist')) {
            this.results.analysis.schemaIssues.push({
              type: 'missing_column_reference',
              table: tableName,
              issue: error.message
            });
          }
        } else {
          const recordCount = count || 0;
          this.results.dataVolume[tableName] = {
            count: recordCount,
            error: null
          };

          // Update table record count
          if (this.results.tables[tableName]) {
            this.results.tables[tableName].recordCount = recordCount;
          }

          totalRecords += recordCount;
          successCount++;

          if (recordCount > 0) {
            console.log(`    📊 ${tableName}: ${recordCount.toLocaleString()} records`);
          }
        }

      } catch (error) {
        console.error(`    ❌ Error counting ${tableName}:`, error.message);
        this.results.dataVolume[tableName] = {
          count: null,
          error: error.message
        };
      }
    }

    this.results.analysis.totalRecords = totalRecords;
    console.log(`✅ Successfully counted ${successCount}/${ALL_TABLES.length} tables`);
    console.log(`📊 Total records: ${totalRecords.toLocaleString()}`);
  }

  async identifyIssues() {
    console.log('\n🔍 Step 4: Identifying schema and data issues...');

    // Check for missing primary keys
    await this.checkMissingPrimaryKeys();

    // Check for orphaned data (simplified approach)
    await this.checkOrphanedData();

    // Analyze schema inconsistencies
    await this.analyzeSchemaInconsistencies();

    console.log(`✅ Analysis completed. Found ${this.results.issues.length} potential issues.`);
  }

  async checkMissingPrimaryKeys() {
    try {
      const { data: primaryKeys, error } = await supabase
        .rpc('sql', {
          query: `
            SELECT
              t.table_name,
              string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as primary_key_columns
            FROM information_schema.tables t
            LEFT JOIN information_schema.table_constraints tc
              ON t.table_name = tc.table_name
              AND tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_schema = 'public'
            LEFT JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE t.table_schema = 'public'
              AND t.table_type = 'BASE TABLE'
            GROUP BY t.table_name
            ORDER BY t.table_name;
          `
        });

      if (!error && primaryKeys) {
        primaryKeys.forEach(table => {
          if (!table.primary_key_columns) {
            this.results.issues.push({
              type: 'missing_primary_key',
              table: table.table_name,
              severity: 'high',
              description: `Table ${table.table_name} has no primary key defined`
            });
          }
        });
      }
    } catch (error) {
      console.warn('Could not check for missing primary keys:', error.message);
    }
  }

  async checkOrphanedData() {
    // Check for common orphaned data patterns
    const commonChecks = [
      {
        name: 'users.vendor_id reference',
        query: `
          SELECT COUNT(*) as count
          FROM users
          WHERE vendor_id IS NOT NULL
            AND vendor_id NOT IN (SELECT id FROM vendors WHERE id IS NOT NULL)
        `,
        table: 'users',
        column: 'vendor_id'
      },
      {
        name: 'orders.user_id reference',
        query: `
          SELECT COUNT(*) as count
          FROM orders
          WHERE user_id IS NOT NULL
            AND user_id NOT IN (SELECT id FROM users WHERE id IS NOT NULL)
        `,
        table: 'orders',
        column: 'user_id'
      }
    ];

    for (const check of commonChecks) {
      try {
        const { data: result, error } = await supabase.rpc('sql', { query: check.query });

        if (error) {
          if (error.message.includes('does not exist')) {
            this.results.issues.push({
              type: 'schema_error',
              table: check.table,
              column: check.column,
              severity: 'high',
              description: `Error in ${check.name}: ${error.message}`,
              suggestedFix: 'Review table structure and column references'
            });
          }
        } else if (result && result[0] && result[0].count > 0) {
          this.results.orphanedData.push({
            check: check.name,
            table: check.table,
            column: check.column,
            orphanedCount: result[0].count
          });
        }
      } catch (error) {
        console.warn(`Could not check ${check.name}:`, error.message);
      }
    }
  }

  async analyzeSchemaInconsistencies() {
    // Look for tables without proper ID columns
    Object.entries(this.results.tables).forEach(([tableName, table]) => {
      const hasIdColumn = table.columns.some(col =>
        col.column_name === 'id' || col.column_name.endsWith('_id')
      );

      if (!hasIdColumn && table.columns.length > 0) {
        this.results.issues.push({
          type: 'no_id_column',
          table: tableName,
          severity: 'medium',
          description: `Table ${tableName} appears to have no ID column`
        });
      }

      // Check for columns that might be foreign keys but aren't properly constrained
      table.columns.forEach(col => {
        if (col.column_name.endsWith('_id') && col.column_name !== 'id') {
          const hasConstraint = this.results.foreignKeys.some(fk =>
            fk.source_table === tableName && fk.source_column === col.column_name
          );

          if (!hasConstraint) {
            this.results.issues.push({
              type: 'potential_missing_fk',
              table: tableName,
              column: col.column_name,
              severity: 'low',
              description: `Column ${tableName}.${col.column_name} looks like a foreign key but has no constraint`
            });
          }
        }
      });
    });
  }

  async generateComprehensiveReports() {
    console.log('\n📄 Generating comprehensive analysis reports...');

    // Create analysis directory
    const analysisDir = path.join(__dirname, 'database-analysis');
    try {
      await fs.mkdir(analysisDir, { recursive: true });
    } catch (error) {
      console.error('Could not create analysis directory:', error.message);
    }

    // Generate master JSON report
    await this.generateJSONReport(analysisDir);

    // Generate markdown reports for each subtask
    await this.generateSubtaskReports(analysisDir);

    // Generate summary report
    await this.generateSummaryReport(analysisDir);

    console.log('📊 Generated reports:');
    console.log('  - master-database-analysis.json (complete data)');
    console.log('  - database-analysis-summary.md (executive summary)');
    console.log('  - task-2-1-tables-columns.md (subtask 2.1)');
    console.log('  - task-2-2-foreign-keys.md (subtask 2.2)');
    console.log('  - task-2-3-data-volume.md (subtask 2.3)');
    console.log('  - task-2-4-orphaned-data.md (subtask 2.4)');
    console.log('  - schema-issues-analysis.md (issues and recommendations)');
  }

  async generateJSONReport(analysisDir) {
    const jsonReport = JSON.stringify(this.results, null, 2);
    await fs.writeFile(
      path.join(analysisDir, 'master-database-analysis.json'),
      jsonReport
    );
  }

  async generateSummaryReport(analysisDir) {
    const report = `# Database Schema Analysis - Executive Summary

**Generated:** ${this.results.analysis.timestamp}
**Database:** ${supabaseUrl}
**Task:** #2 - Analyze current database schema structure

## 🎯 Key Findings

### Database Overview
- **Total Tables:** ${this.results.analysis.totalTables}
- **Total Columns:** ${this.results.analysis.totalColumns}
- **Total Records:** ${this.results.analysis.totalRecords.toLocaleString()}
- **Foreign Key Relationships:** ${this.results.foreignKeys.length}

### Critical Issues Found
- **Schema Errors:** ${this.results.analysis.schemaIssues.length}
- **Data Integrity Issues:** ${this.results.orphanedData.length}
- **General Issues:** ${this.results.issues.length}
- **Analysis Errors:** ${this.results.errors.length}

## 🚨 Critical Schema Issues

${this.results.analysis.schemaIssues.length > 0 ?
  this.results.analysis.schemaIssues.map((issue, i) => `
### Issue ${i + 1}: ${issue.type}
- **Table:** ${issue.table}
- **Problem:** ${issue.issue}
`).join('\n') : 'No critical schema issues detected.'}

## 📊 Largest Tables (by record count)

${Object.entries(this.results.dataVolume)
  .filter(([, volume]) => volume.count > 0)
  .sort(([, a], [, b]) => b.count - a.count)
  .slice(0, 10)
  .map(([tableName, volume]) => `- **${tableName}:** ${volume.count.toLocaleString()} records`)
  .join('\n') || 'No tables with data found.'}

## 🔧 Console Error Analysis

Based on the console errors mentioned:

### "users.vendor_id does not exist" Error
${this.results.tables.users ?
  `- Users table exists with ${this.results.tables.users.columns.length} columns
- Vendor_id column status: ${this.results.tables.users.columns.find(c => c.column_name === 'vendor_id') ? 'EXISTS' : 'MISSING'}
${this.results.tables.users.columns.find(c => c.column_name === 'vendor_id') ?
  '- This suggests the error may be in application code referencing a column that exists' :
  '- The vendor_id column is indeed missing from the users table'}`
  : '- Users table analysis failed - check errors section'}

### Product Table Query Failures
${this.results.tables.products ?
  `- Products table exists with ${this.results.tables.products.columns.length} columns
- Record count: ${this.results.dataVolume.products?.count?.toLocaleString() || 'Unknown'}
${this.results.dataVolume.products?.error ?
  `- Query error: ${this.results.dataVolume.products.error}` :
  '- Table appears accessible'}`
  : '- Products table analysis failed'}

## 📋 Next Steps

1. **Immediate Actions:**
   - Fix schema errors preventing table access
   - Resolve column reference issues in application code
   - Address foreign key constraint violations

2. **Schema Improvements:**
   - Add missing primary keys where needed
   - Implement proper foreign key constraints
   - Review and clean up orphaned data

3. **Performance Optimizations:**
   - Add indexes for frequently queried columns
   - Consider partitioning for large tables
   - Optimize data types where appropriate

## 📁 Detailed Reports

- **Task 2.1:** Tables and columns inventory → task-2-1-tables-columns.md
- **Task 2.2:** Foreign key relationships → task-2-2-foreign-keys.md
- **Task 2.3:** Data volume analysis → task-2-3-data-volume.md
- **Task 2.4:** Orphaned data report → task-2-4-orphaned-data.md
- **Issues Analysis:** Comprehensive issue analysis → schema-issues-analysis.md

---
*Analysis completed for Database Reorganization Project - Task #2*
`;

    await fs.writeFile(
      path.join(analysisDir, 'database-analysis-summary.md'),
      report
    );
  }

  async generateSubtaskReports(analysisDir) {
    // Task 2.1: Tables and Columns
    const task21Report = `# Task 2.1: Tables and Columns Inventory

**Generated:** ${this.results.analysis.timestamp}
**Requirement:** Document every table and its columns with data types

## Summary
- **Total Tables:** ${this.results.analysis.totalTables}
- **Total Columns:** ${this.results.analysis.totalColumns}
- **Successfully Analyzed:** ${Object.keys(this.results.tables).length}

## Complete Table Inventory

${Object.entries(this.results.tables).map(([tableName, table]) => `
### ${tableName}

**Schema:** ${table.schema}
**Columns:** ${table.columns.length}
**Records:** ${table.recordCount !== null ? table.recordCount.toLocaleString() : 'Unknown'}

${table.columns.length > 0 ? `
| Column | Type | Nullable | Default | Max Length | Precision | Scale |
|--------|------|----------|---------|------------|-----------|-------|
${table.columns.map(col =>
  `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || ''} | ${col.character_maximum_length || ''} | ${col.numeric_precision || ''} | ${col.numeric_scale || ''} |`
).join('\n')}
` : '*No column information available*'}
`).join('\n')}

## Analysis Errors

${this.results.errors.filter(e => e.step === 'getColumns' || e.step === 'analyzeTable')
  .map(error => `- **${error.table}:** ${error.error}`).join('\n') || 'No errors encountered.'}

## Raw Data
\`\`\`json
${JSON.stringify(this.results.tables, null, 2)}
\`\`\`
`;

    await fs.writeFile(path.join(analysisDir, 'task-2-1-tables-columns.md'), task21Report);

    // Task 2.2: Foreign Key Relationships
    const task22Report = `# Task 2.2: Foreign Key Relationships

**Generated:** ${this.results.analysis.timestamp}
**Requirement:** Map all existing relationships between tables

## Summary
- **Total Foreign Keys:** ${this.results.foreignKeys.length}

${this.results.foreignKeys.length > 0 ? `
## Relationship Mapping

| Source Table | Source Column | → | Target Table | Target Column | Constraint | Update Rule | Delete Rule |
|--------------|---------------|---|--------------|---------------|------------|-------------|-------------|
${this.results.foreignKeys.map(fk =>
  `| ${fk.source_table} | ${fk.source_column} | → | ${fk.target_table} | ${fk.target_column} | ${fk.constraint_name} | ${fk.update_rule} | ${fk.delete_rule} |`
).join('\n')}

## Relationship Diagram

\`\`\`
${this.results.foreignKeys.map(fk =>
  `${fk.source_table}.${fk.source_column} ──→ ${fk.target_table}.${fk.target_column}`
).join('\n')}
\`\`\`

## Tables Without Foreign Key Constraints

${ALL_TABLES.filter(tableName =>
  !this.results.foreignKeys.some(fk => fk.source_table === tableName)
).map(tableName => `- ${tableName}`).join('\n')}
` : `
## No Foreign Key Relationships Found

The database currently has no formal foreign key constraints defined. This could indicate:
1. Relationships are managed at the application level
2. Database was created without proper referential integrity
3. Foreign keys were dropped during migration

**Recommendation:** Review application code to identify intended relationships and implement proper foreign key constraints.
`}

## Raw Data
\`\`\`json
${JSON.stringify(this.results.foreignKeys, null, 2)}
\`\`\`
`;

    await fs.writeFile(path.join(analysisDir, 'task-2-2-foreign-keys.md'), task22Report);

    // Task 2.3: Data Volume Analysis
    const task23Report = `# Task 2.3: Data Volume Analysis

**Generated:** ${this.results.analysis.timestamp}
**Requirement:** Count records in each table for migration planning

## Summary
- **Total Records:** ${this.results.analysis.totalRecords.toLocaleString()}
- **Tables with Data:** ${Object.values(this.results.dataVolume).filter(v => v.count > 0).length}
- **Empty Tables:** ${Object.values(this.results.dataVolume).filter(v => v.count === 0).length}
- **Inaccessible Tables:** ${Object.values(this.results.dataVolume).filter(v => v.count === null).length}

## Record Counts by Table

| Table Name | Record Count | Status |
|------------|--------------|--------|
${ALL_TABLES.map(tableName => {
  const volume = this.results.dataVolume[tableName];
  if (!volume) return `| ${tableName} | Not Analyzed | Error |`;
  if (volume.count === null) return `| ${tableName} | Error | ${volume.error} |`;
  return `| ${tableName} | ${volume.count.toLocaleString()} | Success |`;
}).join('\n')}

## Tables by Size (Largest First)

${Object.entries(this.results.dataVolume)
  .filter(([, volume]) => volume.count > 0)
  .sort(([, a], [, b]) => b.count - a.count)
  .map(([tableName, volume]) => `- **${tableName}:** ${volume.count.toLocaleString()} records`)
  .join('\n') || 'No tables contain data.'}

## Migration Planning Insights

### Large Tables (>1000 records)
${Object.entries(this.results.dataVolume)
  .filter(([, volume]) => volume.count > 1000)
  .map(([tableName, volume]) => `- **${tableName}:** ${volume.count.toLocaleString()} records - *Requires careful migration planning*`)
  .join('\n') || 'No large tables identified.'}

### Error Analysis
${Object.entries(this.results.dataVolume)
  .filter(([, volume]) => volume.count === null)
  .map(([tableName, volume]) => `- **${tableName}:** ${volume.error}`)
  .join('\n') || 'No access errors encountered.'}

## Raw Data
\`\`\`json
${JSON.stringify(this.results.dataVolume, null, 2)}
\`\`\`
`;

    await fs.writeFile(path.join(analysisDir, 'task-2-3-data-volume.md'), task23Report);

    // Task 2.4: Orphaned Data Report
    const task24Report = `# Task 2.4: Orphaned Data Analysis

**Generated:** ${this.results.analysis.timestamp}
**Requirement:** Find records with broken relationships

## Summary
- **Orphaned Data Issues:** ${this.results.orphanedData.length}
- **Schema-Related Issues:** ${this.results.analysis.schemaIssues.length}

${this.results.orphanedData.length > 0 ? `
## Orphaned Data Found

${this.results.orphanedData.map((orphan, i) => `
### Issue ${i + 1}: ${orphan.check}
- **Table:** ${orphan.table}
- **Column:** ${orphan.column}
- **Orphaned Records:** ${orphan.orphanedCount}

**Cleanup Query:**
\`\`\`sql
-- Review orphaned records before deletion
SELECT * FROM ${orphan.table}
WHERE ${orphan.column} NOT IN (
  SELECT id FROM target_table WHERE id IS NOT NULL
);
\`\`\`
`).join('\n')}
` : '## No Orphaned Data Found\n\nThe orphaned data checks completed without finding broken relationships.'}

## Schema Issues Affecting Data Integrity

${this.results.analysis.schemaIssues.length > 0 ?
  this.results.analysis.schemaIssues.map((issue, i) => `
### Schema Issue ${i + 1}: ${issue.type}
- **Table:** ${issue.table}
- **Problem:** ${issue.issue}
- **Impact:** May prevent proper data validation and relationship management
`).join('\n') : 'No schema issues detected affecting data integrity.'}

## General Data Integrity Issues

${this.results.issues.filter(issue =>
  ['missing_primary_key', 'potential_missing_fk', 'schema_error'].includes(issue.type)
).map((issue, i) => `
### Issue ${i + 1}: ${issue.type}
- **Table:** ${issue.table}
${issue.column ? `- **Column:** ${issue.column}` : ''}
- **Severity:** ${issue.severity}
- **Description:** ${issue.description}
${issue.suggestedFix ? `- **Suggested Fix:** ${issue.suggestedFix}` : ''}
`).join('\n') || 'No general data integrity issues identified.'}

## Recommendations

1. **Immediate Actions:**
   - Resolve schema errors preventing table access
   - Fix column reference issues causing console errors

2. **Data Cleanup:**
   - Review orphaned records before deletion
   - Implement proper foreign key constraints
   - Add missing primary keys

3. **Prevention:**
   - Implement proper database constraints
   - Add validation at the application level
   - Regular data integrity checks

## Raw Data
\`\`\`json
{
  "orphanedData": ${JSON.stringify(this.results.orphanedData, null, 2)},
  "schemaIssues": ${JSON.stringify(this.results.analysis.schemaIssues, null, 2)},
  "generalIssues": ${JSON.stringify(this.results.issues, null, 2)}
}
\`\`\`
`;

    await fs.writeFile(path.join(analysisDir, 'task-2-4-orphaned-data.md'), task24Report);

    // Schema Issues Analysis
    const issuesReport = `# Schema Issues and Recommendations

**Generated:** ${this.results.analysis.timestamp}

## Root Cause Analysis for Console Errors

### Error: "users.vendor_id does not exist"

${this.results.tables.users ? `
**Analysis Results:**
- Users table exists and was successfully analyzed
- Column count: ${this.results.tables.users.columns.length}
- Vendor_id column: ${this.results.tables.users.columns.find(c => c.column_name === 'vendor_id') ? '✅ EXISTS' : '❌ MISSING'}

${this.results.tables.users.columns.find(c => c.column_name === 'vendor_id') ? `
**Recommendation:** The column exists in the database. The error is likely in application code:
1. Check queries for typos in column name
2. Verify table aliases are correct
3. Check if column was recently added and application needs restart
` : `
**Root Cause:** The vendor_id column is missing from the users table.

**Recommended Fix:**
\`\`\`sql
-- Add the missing vendor_id column
ALTER TABLE users ADD COLUMN vendor_id UUID;

-- If this should reference a vendors table:
ALTER TABLE users ADD CONSTRAINT fk_users_vendor
  FOREIGN KEY (vendor_id) REFERENCES vendors(id);
\`\`\`
`}
` : 'Could not analyze users table - check connection and permissions.'}

### Product Table Query Failures

${this.results.dataVolume.products ? `
**Analysis Results:**
- Products table access: ${this.results.dataVolume.products.count !== null ? '✅ SUCCESS' : '❌ FAILED'}
- Record count: ${this.results.dataVolume.products.count?.toLocaleString() || 'Unknown'}
${this.results.dataVolume.products.error ? `- Error: ${this.results.dataVolume.products.error}` : ''}

${this.results.dataVolume.products.error ? `
**Root Cause Analysis:**
The products table query failed with error: ${this.results.dataVolume.products.error}

**Recommended Fixes:**
1. Check table permissions
2. Verify column names in queries
3. Review recent schema changes
4. Check if table exists in correct schema
` : `
**Status:** Products table is accessible and contains data.
The console errors may be related to specific queries or application logic.
`}
` : 'Could not analyze products table.'}

## All Identified Issues

${this.results.issues.length > 0 ?
  this.results.issues.map((issue, i) => `
### Issue ${i + 1}: ${issue.type}
- **Table:** ${issue.table}
${issue.column ? `- **Column:** ${issue.column}` : ''}
- **Severity:** ${issue.severity.toUpperCase()}
- **Description:** ${issue.description}
${issue.suggestedFix ? `- **Fix:** ${issue.suggestedFix}` : ''}
`).join('\n') : 'No specific issues identified beyond analysis errors.'}

## Schema Reorganization Recommendations

### High Priority
1. **Fix Schema Errors:** Resolve column reference issues causing console errors
2. **Add Missing Constraints:** Implement proper foreign key relationships
3. **Data Cleanup:** Address any orphaned data before reorganization

### Medium Priority
1. **Primary Keys:** Ensure all tables have proper primary keys
2. **Indexing:** Add indexes for frequently queried columns
3. **Data Types:** Review and optimize data types

### Low Priority
1. **Naming Conventions:** Standardize table and column naming
2. **Documentation:** Document all relationships and constraints
3. **Performance:** Optimize for query patterns

## Migration Strategy

Based on the analysis:

1. **Pre-Migration:** Fix schema errors and add missing constraints
2. **Migration Planning:** Focus on tables with large data volumes
3. **Testing:** Validate all relationships work correctly
4. **Post-Migration:** Monitor for new issues and optimize performance

---
*Generated for Database Reorganization Project - Task #2*
`;

    await fs.writeFile(path.join(analysisDir, 'schema-issues-analysis.md'), issuesReport);
  }
}

// Main execution
async function main() {
  console.log('🚀 Database Schema Analyzer v2.0');
  console.log('Task #2: Analyze current database schema structure');
  console.log('==========================================');

  const analyzer = new DatabaseAnalyzerV2();
  await analyzer.analyze();
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { DatabaseAnalyzerV2 };