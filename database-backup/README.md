# Database Backup System
## Supabase Sneaker Store Project

**Generated on:** 2025-09-21
**Version:** 1.0
**Project:** Database Reorganization - Task #1

---

## Overview

This comprehensive database backup system provides multiple layers of data protection for the Supabase Sneaker Store project. It includes schema backups, complete data dumps, and JSON exports of critical business data.

### Backup Types

1. **Schema Backups** - Database structure (tables, indexes, constraints, views)
2. **Data Backups** - Complete SQL dumps of all table data
3. **JSON Backups** - Critical business data in JSON format for analysis and migration
4. **Verification Tools** - Scripts to ensure backup integrity

---

## Directory Structure

```
database-backup/
├── README.md                          # This documentation
├── schemas/                           # Database schema backups
│   ├── schema_backup_YYYYMMDD_HHMMSS.sql
│   ├── schema_summary_YYYYMMDD_HHMMSS.md
│   └── latest_schema.sql             # Symlink to latest schema
├── data/                             # Data backups
│   ├── data_backup_YYYYMMDD_HHMMSS.sql
│   ├── data_backup_YYYYMMDD_HHMMSS.sql.gz
│   ├── data_backup_summary_YYYYMMDD_HHMMSS.md
│   ├── tables_YYYYMMDD_HHMMSS/       # Individual table backups
│   ├── latest_data.sql               # Symlink to latest data
│   └── latest_data.sql.gz           # Symlink to latest compressed
├── json/                            # JSON exports
│   ├── critical_data_combined_YYYYMMDD_HHMMSS.json
│   ├── json_backup_summary_YYYYMMDD_HHMMSS.md
│   ├── [table_name]_YYYYMMDD_HHMMSS.json
│   ├── latest_combined.json         # Symlink to latest combined
│   └── latest_summary.md           # Symlink to latest summary
├── scripts/                         # Backup scripts
│   ├── backup-schemas.sh            # Schema export script
│   ├── backup-data.sh              # Data export script
│   ├── backup-critical-json.js     # JSON export script (Node.js)
│   ├── backup-critical-json.sh     # JSON export wrapper
│   ├── verify-backups.sh           # Verification script
│   └── run-full-backup.sh          # Master backup script
└── verification/                    # Verification results
    ├── verification_YYYYMMDD_HHMMSS.log
    └── latest_verification.log      # Symlink to latest verification
```

---

## Quick Start

### Prerequisites

1. **Supabase CLI** installed and configured
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref gddkggcsytffswlzqezn
   ```

2. **Node.js** (for JSON exports)
   - Version 14 or higher
   - @supabase/supabase-js package

3. **Environment Variables**
   - `.env.local` file with Supabase configuration
   - Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Running Full Backup

```bash
# Navigate to backup directory
cd database-backup/scripts

# Run complete backup (all types)
./run-full-backup.sh

# Or run individual backups
./backup-schemas.sh      # Schema only
./backup-data.sh         # Data only
./backup-critical-json.sh # JSON only
```

---

## Detailed Usage

### 1. Schema Backup

**Purpose:** Backup database structure for schema migration and recovery.

```bash
./scripts/backup-schemas.sh
```

**Creates:**
- `schemas/schema_backup_YYYYMMDD_HHMMSS.sql` - Complete schema dump
- `schemas/schema_summary_YYYYMMDD_HHMMSS.md` - Human-readable documentation
- `schemas/latest_schema.sql` - Symlink to latest backup

**Recovery:**
```bash
# Restore schema to new database
psql -h [HOST] -U [USER] -d [DATABASE] -f schemas/latest_schema.sql

# Or using Supabase CLI
supabase db reset --db-url [CONNECTION_STRING]
supabase db push
```

### 2. Data Backup

**Purpose:** Complete data backup for disaster recovery and data migration.

```bash
./scripts/backup-data.sh
```

**Creates:**
- `data/data_backup_YYYYMMDD_HHMMSS.sql` - Complete data dump
- `data/data_backup_YYYYMMDD_HHMMSS.sql.gz` - Compressed version
- `data/tables_YYYYMMDD_HHMMSS/` - Individual table dumps
- `data/data_backup_summary_YYYYMMDD_HHMMSS.md` - Documentation

**Recovery:**
```bash
# Restore complete data
psql -h [HOST] -U [USER] -d [DATABASE] -f data/latest_data.sql

# Restore from compressed backup
gunzip -c data/latest_data.sql.gz | psql -h [HOST] -U [USER] -d [DATABASE]

# Restore individual table
psql -h [HOST] -U [USER] -d [DATABASE] -f data/tables_[TIMESTAMP]/users_data_[TIMESTAMP].sql
```

### 3. JSON Backup

**Purpose:** Human-readable data export for analysis, testing, and migration.

```bash
./scripts/backup-critical-json.sh
```

**Creates:**
- `json/critical_data_combined_YYYYMMDD_HHMMSS.json` - All critical data
- Individual table JSON files
- `json/json_backup_summary_YYYYMMDD_HHMMSS.md` - Documentation

**Usage:**
```javascript
// Load all critical data
const allData = require('./json/latest_combined.json');
const users = allData.tables.users.data;
const products = allData.tables.products.data;

// Load individual table
const userData = require('./json/users_YYYYMMDD_HHMMSS.json');
console.log(`Total users: ${userData.metadata.totalRecords}`);
```

---

## Recovery Procedures

### Complete Database Recovery

1. **Prepare Target Database**
   ```bash
   # Create new database or reset existing
   supabase db reset --db-url [TARGET_CONNECTION_STRING]
   ```

2. **Restore Schema**
   ```bash
   # Apply schema structure
   psql -h [HOST] -U [USER] -d [DATABASE] -f schemas/latest_schema.sql
   ```

3. **Restore Data**
   ```bash
   # Apply data
   psql -h [HOST] -U [USER] -d [DATABASE] -f data/latest_data.sql
   ```

4. **Verify Recovery**
   ```bash
   # Run verification script
   ./scripts/verify-backups.sh
   ```

### Partial Recovery (Specific Tables)

1. **Restore Table Schema**
   ```sql
   -- Extract specific table DDL from schema backup
   grep -A 50 "CREATE TABLE tablename" schemas/latest_schema.sql
   ```

2. **Restore Table Data**
   ```bash
   # Restore specific table
   psql -h [HOST] -U [USER] -d [DATABASE] -f data/tables_[TIMESTAMP]/[tablename]_data_[TIMESTAMP].sql
   ```

### Development Environment Setup

```bash
# 1. Clone production schema
psql -h [DEV_HOST] -U [USER] -d [DEV_DB] -f schemas/latest_schema.sql

# 2. Load test data from JSON
node -e "
const data = require('./json/latest_combined.json');
// Custom script to insert test data
"
```

---

## Backup Schedule Recommendations

### Production Environment

- **Daily:** Full backup (schema + data)
- **Weekly:** JSON export for analytics
- **Monthly:** Archive old backups
- **Before Changes:** Manual backup before schema changes

### Development Environment

- **Before Major Changes:** Full backup
- **Weekly:** JSON export for testing data
- **As Needed:** Individual table backups

---

## Security Considerations

### Data Protection

1. **File Permissions**
   ```bash
   # Restrict access to backup files
   chmod 600 database-backup/**/*.sql
   chmod 600 database-backup/**/*.json
   ```

2. **Environment Variables**
   - Never commit `.env` files to version control
   - Use environment-specific configuration
   - Rotate database credentials regularly

3. **Storage Security**
   - Store backups in secure locations
   - Consider encryption for sensitive data
   - Implement access controls

### Network Security

1. **Connection Security**
   - Use SSL/TLS connections
   - Whitelist IP addresses
   - Use strong authentication

2. **Backup Transfer**
   - Encrypt backups in transit
   - Use secure file transfer protocols
   - Verify checksums

---

## Monitoring and Alerts

### Backup Verification

```bash
# Run verification after each backup
./scripts/verify-backups.sh

# Check backup sizes and integrity
du -sh database-backup/**/*
md5sum database-backup/**/*.sql
```

### Automated Monitoring

1. **File Size Monitoring**
   - Alert if backup size drops significantly
   - Monitor for failed backup files

2. **Schedule Monitoring**
   - Ensure backups run on schedule
   - Alert on backup failures

3. **Storage Monitoring**
   - Monitor disk space usage
   - Implement backup rotation

---

## Troubleshooting

### Common Issues

#### 1. Supabase Connection Failed
```bash
# Check Supabase status
supabase status

# Re-authenticate
supabase login

# Re-link project
supabase link --project-ref gddkggcsytffswlzqezn
```

#### 2. Permission Denied
```bash
# Check file permissions
ls -la database-backup/scripts/

# Fix permissions
chmod +x database-backup/scripts/*.sh
```

#### 3. Node.js Dependencies Missing
```bash
# Install dependencies
cd /Users/nicodcz/Desktop/PGD\ 5/Bootcamp/sneaker-store
npm install @supabase/supabase-js
```

#### 4. Large Backup Files
```bash
# Use compression
gzip database-backup/data/*.sql

# Split large files
split -b 100M database-backup/data/large_backup.sql backup_part_
```

### Error Recovery

#### 1. Corrupted Backup Files
- Use checksums to verify integrity
- Restore from previous backup
- Re-run backup process

#### 2. Incomplete Backups
- Check disk space
- Verify network connectivity
- Review error logs

#### 3. Failed Restoration
- Verify target database permissions
- Check for schema conflicts
- Review foreign key constraints

---

## Maintenance

### Regular Tasks

1. **Weekly Review**
   - Verify backup completeness
   - Check backup file sizes
   - Review error logs

2. **Monthly Cleanup**
   - Archive old backups
   - Clean up temporary files
   - Update documentation

3. **Quarterly Testing**
   - Test full recovery process
   - Verify backup integrity
   - Update recovery procedures

### Backup Rotation

```bash
# Keep daily backups for 7 days
find database-backup/ -name "*_backup_*" -mtime +7 -delete

# Keep weekly backups for 4 weeks
find database-backup/ -name "*weekly*" -mtime +28 -delete

# Keep monthly backups for 12 months
find database-backup/ -name "*monthly*" -mtime +365 -delete
```

---

## Contact and Support

### Technical Support

- **Database Issues:** Review Supabase documentation
- **Backup Script Issues:** Check script logs and permissions
- **Recovery Problems:** Follow troubleshooting guide

### Emergency Procedures

1. **Data Loss Event**
   - Stop all database writes
   - Assess damage scope
   - Begin recovery from latest backup
   - Document incident for review

2. **Corruption Detection**
   - Identify affected tables
   - Restore from clean backup
   - Investigate root cause
   - Update backup procedures

---

## Version History

- **v1.0 (2025-09-21):** Initial backup system implementation
  - Schema backup functionality
  - Data backup with compression
  - JSON export for critical tables
  - Comprehensive documentation
  - Verification scripts

---

*Generated by Sneaker Store Database Backup System*