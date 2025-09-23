#!/usr/bin/env node

/**
 * Database Schema Analysis Script
 * Analyzes the current Supabase database schema structure
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
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class DatabaseAnalyzer {
  constructor() {
    this.results = {
      tables: {},
      foreignKeys: [],
      dataVolume: {},
      orphanedData: [],
      errors: [],
      analysis: {
        timestamp: new Date().toISOString(),
        totalTables: 0,
        totalColumns: 0,
        totalRecords: 0
      }
    };
  }

  async analyze() {
    console.log('🔍 Starting database schema analysis...');
    console.log('📊 Connected to:', supabaseUrl);

    try {
      // Step 1: List all tables and columns
      await this.listTablesAndColumns();

      // Step 2: Identify foreign key relationships
      await this.identifyForeignKeys();

      // Step 3: Analyze data volume per table
      await this.analyzeDataVolume();

      // Step 4: Identify orphaned data
      await this.identifyOrphanedData();

      // Generate comprehensive report
      await this.generateReport();

      console.log('✅ Database schema analysis completed successfully!');
      console.log('📄 Reports generated in scripts/database-analysis/ directory');

    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      this.results.errors.push({
        step: 'general',
        error: error.message,
        stack: error.stack
      });
      await this.generateReport();
    }
  }

  async listTablesAndColumns() {
    console.log('\n📋 Step 1: Listing all tables and columns...');

    try {
      // Get all tables from information_schema
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_database_tables');

      if (tablesError) {
        // Fallback: Try direct query to information_schema
        const { data: directTables, error: directError } = await supabase
          .from('information_schema.tables')
          .select('table_name, table_schema')
          .eq('table_schema', 'public');

        if (directError) {
          // Use raw SQL as last resort
          const { data: sqlTables, error: sqlError } = await supabase
            .rpc('execute_sql', {
              query: `
                SELECT table_name, table_schema
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
              `
            });

          if (sqlError) {
            throw new Error(`Failed to get tables: ${sqlError.message}`);
          }
          this.processTables(sqlTables);
        } else {
          this.processTables(directTables);
        }
      } else {
        this.processTables(tables);
      }

      // Get columns for each table
      for (const tableName of Object.keys(this.results.tables)) {
        await this.getTableColumns(tableName);
      }

      this.results.analysis.totalTables = Object.keys(this.results.tables).length;
      this.results.analysis.totalColumns = Object.values(this.results.tables)
        .reduce((sum, table) => sum + table.columns.length, 0);

      console.log(`✅ Found ${this.results.analysis.totalTables} tables with ${this.results.analysis.totalColumns} total columns`);

    } catch (error) {
      console.error('❌ Error listing tables:', error.message);
      this.results.errors.push({
        step: 'listTables',
        error: error.message
      });
    }
  }

  processTables(tables) {
    if (!tables || !Array.isArray(tables)) {
      throw new Error('Invalid tables data received');
    }

    tables.forEach(table => {
      const tableName = table.table_name;
      this.results.tables[tableName] = {
        name: tableName,
        schema: table.table_schema || 'public',
        columns: [],
        constraints: [],
        indexes: []
      };
    });
  }

  async getTableColumns(tableName) {
    try {
      // Get column information
      const { data: columns, error } = await supabase
        .rpc('execute_sql', {
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
        throw new Error(`Failed to get columns for ${tableName}: ${error.message}`);
      }

      this.results.tables[tableName].columns = columns || [];

    } catch (error) {
      console.error(`❌ Error getting columns for ${tableName}:`, error.message);
      this.results.errors.push({
        step: 'getColumns',
        table: tableName,
        error: error.message
      });
    }
  }

  async identifyForeignKeys() {
    console.log('\n🔗 Step 2: Identifying foreign key relationships...');

    try {
      const { data: foreignKeys, error } = await supabase
        .rpc('execute_sql', {
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
        throw new Error(`Failed to get foreign keys: ${error.message}`);
      }

      this.results.foreignKeys = foreignKeys || [];
      console.log(`✅ Found ${this.results.foreignKeys.length} foreign key relationships`);

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

    for (const tableName of Object.keys(this.results.tables)) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.warn(`⚠️  Could not count records in ${tableName}: ${error.message}`);
          this.results.dataVolume[tableName] = {
            count: null,
            error: error.message
          };
        } else {
          this.results.dataVolume[tableName] = {
            count: count || 0,
            error: null
          };
          totalRecords += count || 0;
        }

      } catch (error) {
        console.error(`❌ Error counting ${tableName}:`, error.message);
        this.results.dataVolume[tableName] = {
          count: null,
          error: error.message
        };
      }
    }

    this.results.analysis.totalRecords = totalRecords;
    console.log(`✅ Total records across all tables: ${totalRecords.toLocaleString()}`);
  }

  async identifyOrphanedData() {
    console.log('\n🔍 Step 4: Identifying orphaned data...');

    // Check for orphaned records based on foreign key relationships
    for (const fk of this.results.foreignKeys) {
      try {
        const { data: orphaned, error } = await supabase
          .rpc('execute_sql', {
            query: `
              SELECT COUNT(*) as orphaned_count
              FROM ${fk.source_table} s
              LEFT JOIN ${fk.target_table} t ON s.${fk.source_column} = t.${fk.target_column}
              WHERE s.${fk.source_column} IS NOT NULL
                AND t.${fk.target_column} IS NULL;
            `
          });

        if (error) {
          console.warn(`⚠️  Could not check orphaned data for ${fk.source_table}.${fk.source_column}: ${error.message}`);
        } else if (orphaned && orphaned[0] && orphaned[0].orphaned_count > 0) {
          this.results.orphanedData.push({
            sourceTable: fk.source_table,
            sourceColumn: fk.source_column,
            targetTable: fk.target_table,
            targetColumn: fk.target_column,
            orphanedCount: orphaned[0].orphaned_count,
            constraintName: fk.constraint_name
          });

          console.log(`🚨 Found ${orphaned[0].orphaned_count} orphaned records in ${fk.source_table}.${fk.source_column}`);
        }

      } catch (error) {
        console.error(`❌ Error checking orphaned data for ${fk.source_table}:`, error.message);
        this.results.errors.push({
          step: 'orphanedData',
          foreignKey: fk,
          error: error.message
        });
      }
    }

    console.log(`✅ Orphaned data analysis completed. Found ${this.results.orphanedData.length} issues.`);
  }

  async generateReport() {
    console.log('\n📄 Generating comprehensive analysis report...');

    // Create analysis directory
    const analysisDir = path.join(__dirname, 'database-analysis');
    try {
      await fs.mkdir(analysisDir, { recursive: true });
    } catch (error) {
      console.error('Could not create analysis directory:', error.message);
    }

    // Generate detailed JSON report
    const jsonReport = JSON.stringify(this.results, null, 2);
    await fs.writeFile(
      path.join(analysisDir, 'database-schema-analysis.json'),
      jsonReport
    );

    // Generate human-readable markdown report
    const markdownReport = this.generateMarkdownReport();
    await fs.writeFile(
      path.join(analysisDir, 'database-schema-analysis.md'),
      markdownReport
    );

    // Generate specific reports for each subtask
    await this.generateSubtaskReports(analysisDir);

    console.log('📊 Reports generated:');
    console.log('  - database-schema-analysis.json (complete data)');
    console.log('  - database-schema-analysis.md (human-readable summary)');
    console.log('  - tables-and-columns.md (subtask 2.1)');
    console.log('  - foreign-key-relationships.md (subtask 2.2)');
    console.log('  - data-volume-analysis.md (subtask 2.3)');
    console.log('  - orphaned-data-report.md (subtask 2.4)');
  }

  generateMarkdownReport() {
    const timestamp = new Date().toISOString();

    return `# Database Schema Analysis Report

**Generated:** ${timestamp}
**Database:** ${supabaseUrl}
**Analysis Tool:** Database Schema Analyzer v1.0

## Executive Summary

- **Total Tables:** ${this.results.analysis.totalTables}
- **Total Columns:** ${this.results.analysis.totalColumns}
- **Total Records:** ${this.results.analysis.totalRecords.toLocaleString()}
- **Foreign Key Relationships:** ${this.results.foreignKeys.length}
- **Orphaned Data Issues:** ${this.results.orphanedData.length}
- **Errors Encountered:** ${this.results.errors.length}

## Table Overview

${Object.entries(this.results.tables).map(([tableName, table]) => `
### ${tableName}
- **Schema:** ${table.schema}
- **Columns:** ${table.columns.length}
- **Records:** ${this.results.dataVolume[tableName]?.count?.toLocaleString() || 'Unknown'}
${table.columns.length > 0 ? `
#### Columns:
${table.columns.map(col => `- **${col.column_name}** (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''}${col.column_default ? `, DEFAULT: ${col.column_default}` : ''})`).join('\n')}
` : ''}
`).join('\n')}

## Foreign Key Relationships

${this.results.foreignKeys.length > 0 ? this.results.foreignKeys.map(fk => `
- **${fk.source_table}.${fk.source_column}** → **${fk.target_table}.${fk.target_column}**
  - Constraint: ${fk.constraint_name}
  - Update Rule: ${fk.update_rule}
  - Delete Rule: ${fk.delete_rule}
`).join('\n') : 'No foreign key relationships found.'}

## Data Volume Analysis

${Object.entries(this.results.dataVolume).map(([tableName, volume]) => `
- **${tableName}:** ${volume.count !== null ? volume.count.toLocaleString() + ' records' : 'Could not determine (' + volume.error + ')'}
`).join('')}

## Orphaned Data Issues

${this.results.orphanedData.length > 0 ? this.results.orphanedData.map(orphan => `
### ${orphan.sourceTable}.${orphan.sourceColumn}
- **Target:** ${orphan.targetTable}.${orphan.targetColumn}
- **Orphaned Records:** ${orphan.orphanedCount}
- **Constraint:** ${orphan.constraintName}
`).join('\n') : 'No orphaned data found.'}

## Errors and Issues

${this.results.errors.length > 0 ? this.results.errors.map(error => `
### ${error.step}${error.table ? ` (${error.table})` : ''}
\`\`\`
${error.error}
\`\`\`
`).join('\n') : 'No errors encountered during analysis.'}

## Recommendations

### Schema Issues to Address:
${this.results.orphanedData.length > 0 ? `
1. **Orphaned Data Cleanup:** Clean up ${this.results.orphanedData.length} orphaned data relationships
` : ''}
${this.results.errors.length > 0 ? `
2. **Error Resolution:** Resolve ${this.results.errors.length} analysis errors
` : ''}

### Next Steps:
1. Review and clean up orphaned data relationships
2. Validate foreign key constraints
3. Consider adding missing indexes for performance
4. Review data types for optimization opportunities

---
*Report generated by Database Schema Analyzer for Task #2: Analyze current database schema structure*
`;
  }

  async generateSubtaskReports(analysisDir) {
    // Subtask 2.1: Tables and Columns Report
    const tablesReport = `# Tables and Columns Report (Task 2.1)

**Generated:** ${new Date().toISOString()}

## Summary
- **Total Tables:** ${this.results.analysis.totalTables}
- **Total Columns:** ${this.results.analysis.totalColumns}

## Detailed Table Structure

${Object.entries(this.results.tables).map(([tableName, table]) => `
## ${tableName}

**Schema:** ${table.schema}
**Column Count:** ${table.columns.length}

### Columns:

| Column Name | Data Type | Nullable | Default | Max Length | Precision | Scale |
|-------------|-----------|----------|---------|------------|-----------|-------|
${table.columns.map(col =>
  `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || ''} | ${col.character_maximum_length || ''} | ${col.numeric_precision || ''} | ${col.numeric_scale || ''} |`
).join('\n')}
`).join('\n')}

## Raw Data Export

\`\`\`json
${JSON.stringify(this.results.tables, null, 2)}
\`\`\`
`;

    await fs.writeFile(path.join(analysisDir, 'tables-and-columns.md'), tablesReport);

    // Subtask 2.2: Foreign Key Relationships Report
    const foreignKeysReport = `# Foreign Key Relationships Report (Task 2.2)

**Generated:** ${new Date().toISOString()}

## Summary
- **Total Foreign Keys:** ${this.results.foreignKeys.length}

## Relationship Mapping

${this.results.foreignKeys.length > 0 ? `
| Source Table | Source Column | Target Table | Target Column | Constraint Name | Update Rule | Delete Rule |
|--------------|---------------|--------------|---------------|-----------------|-------------|-------------|
${this.results.foreignKeys.map(fk =>
  `| ${fk.source_table} | ${fk.source_column} | ${fk.target_table} | ${fk.target_column} | ${fk.constraint_name} | ${fk.update_rule} | ${fk.delete_rule} |`
).join('\n')}

## Relationship Diagram (Text Format)

${this.results.foreignKeys.map(fk => `${fk.source_table}.${fk.source_column} ──→ ${fk.target_table}.${fk.target_column}`).join('\n')}
` : 'No foreign key relationships found in the database.'}

## Raw Data Export

\`\`\`json
${JSON.stringify(this.results.foreignKeys, null, 2)}
\`\`\`
`;

    await fs.writeFile(path.join(analysisDir, 'foreign-key-relationships.md'), foreignKeysReport);

    // Subtask 2.3: Data Volume Analysis Report
    const dataVolumeReport = `# Data Volume Analysis Report (Task 2.3)

**Generated:** ${new Date().toISOString()}

## Summary
- **Total Records:** ${this.results.analysis.totalRecords.toLocaleString()}
- **Tables Analyzed:** ${Object.keys(this.results.dataVolume).length}

## Record Counts by Table

| Table Name | Record Count | Status |
|------------|--------------|--------|
${Object.entries(this.results.dataVolume).map(([tableName, volume]) =>
  `| ${tableName} | ${volume.count !== null ? volume.count.toLocaleString() : 'Error'} | ${volume.error || 'Success'} |`
).join('\n')}

## Largest Tables (by record count)

${Object.entries(this.results.dataVolume)
  .filter(([, volume]) => volume.count !== null)
  .sort(([, a], [, b]) => (b.count || 0) - (a.count || 0))
  .slice(0, 10)
  .map(([tableName, volume]) => `- **${tableName}:** ${volume.count.toLocaleString()} records`)
  .join('\n')}

## Raw Data Export

\`\`\`json
${JSON.stringify(this.results.dataVolume, null, 2)}
\`\`\`
`;

    await fs.writeFile(path.join(analysisDir, 'data-volume-analysis.md'), dataVolumeReport);

    // Subtask 2.4: Orphaned Data Report
    const orphanedDataReport = `# Orphaned Data Report (Task 2.4)

**Generated:** ${new Date().toISOString()}

## Summary
- **Orphaned Data Issues:** ${this.results.orphanedData.length}

${this.results.orphanedData.length > 0 ? `
## Issues Found

${this.results.orphanedData.map((orphan, index) => `
### Issue ${index + 1}: ${orphan.sourceTable}.${orphan.sourceColumn}

- **Source:** ${orphan.sourceTable}.${orphan.sourceColumn}
- **Target:** ${orphan.targetTable}.${orphan.targetColumn}
- **Orphaned Records:** ${orphan.orphanedCount}
- **Constraint:** ${orphan.constraintName}

**Recommended Action:** Clean up ${orphan.orphanedCount} orphaned records in ${orphan.sourceTable} that reference non-existent records in ${orphan.targetTable}.

\`\`\`sql
-- Query to find orphaned records:
SELECT *
FROM ${orphan.sourceTable} s
LEFT JOIN ${orphan.targetTable} t ON s.${orphan.sourceColumn} = t.${orphan.targetColumn}
WHERE s.${orphan.sourceColumn} IS NOT NULL
  AND t.${orphan.targetColumn} IS NULL;
\`\`\`
`).join('\n')}

## Cleanup Recommendations

1. **Backup Data:** Always backup before cleaning orphaned data
2. **Review Business Logic:** Ensure orphaned data cleanup won't break application logic
3. **Cascading Deletes:** Consider implementing proper cascading delete rules
4. **Data Integrity:** Add proper foreign key constraints if missing

` : `
## No Orphaned Data Found

The database appears to have good referential integrity with no orphaned records detected.
`}

## Raw Data Export

\`\`\`json
${JSON.stringify(this.results.orphanedData, null, 2)}
\`\`\`
`;

    await fs.writeFile(path.join(analysisDir, 'orphaned-data-report.md'), orphanedDataReport);
  }
}

// Main execution
async function main() {
  console.log('🚀 Database Schema Analyzer');
  console.log('Task #2: Analyze current database schema structure');
  console.log('==========================================\n');

  const analyzer = new DatabaseAnalyzer();
  await analyzer.analyze();
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { DatabaseAnalyzer };