#!/bin/bash

# Comprehensive Database Data Backup Script
# For Supabase Sneaker Store Project
# Generated on: 2025-09-21

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/Users/nicodcz/Desktop/PGD 5/Bootcamp/sneaker-store/database-backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATA_DIR="$BACKUP_DIR/data"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Supabase Data Backup Script ===${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Backup Directory: $BACKUP_DIR"
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI not found. Please install it first.${NC}"
    echo "Install with: npm install -g supabase"
    exit 1
fi

# Create data backup directory if it doesn't exist
mkdir -p "$DATA_DIR"

echo -e "${YELLOW}1. Checking Supabase connection...${NC}"
# Test connection by checking status
if ! supabase status; then
    echo -e "${RED}Error: Unable to connect to Supabase. Make sure you're logged in and the project is linked.${NC}"
    echo "Run: supabase login"
    echo "Run: supabase link"
    exit 1
fi

echo -e "${YELLOW}2. Exporting complete database data...${NC}"

# Export complete data using pg_dump through Supabase
DATA_FILE="$DATA_DIR/data_backup_$TIMESTAMP.sql"

# Use supabase db dump to export data only
if supabase db dump --data-only --file "$DATA_FILE"; then
    echo -e "${GREEN}✓ Complete data exported successfully to: $DATA_FILE${NC}"
else
    echo -e "${RED}✗ Failed to export complete data${NC}"
    exit 1
fi

echo -e "${YELLOW}3. Creating table-specific data backups...${NC}"

# Create directory for individual table backups
TABLE_DIR="$DATA_DIR/tables_$TIMESTAMP"
mkdir -p "$TABLE_DIR"

# Define critical tables for individual backup
CRITICAL_TABLES=(
    "users"
    "products"
    "orders"
    "order_items"
    "categories"
    "product_variants"
    "product_inventory"
    "reviews"
    "stock_levels"
    "stock_movements"
    "wishlists"
    "cart_items"
    "loyalty_programs"
    "loyalty_transactions"
)

echo -e "${BLUE}Backing up critical tables individually...${NC}"

for table in "${CRITICAL_TABLES[@]}"; do
    echo -n "  Backing up $table... "
    TABLE_FILE="$TABLE_DIR/${table}_data_$TIMESTAMP.sql"

    if supabase db dump --data-only --table "$table" --file "$TABLE_FILE"; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
        # Continue with other tables even if one fails
    fi
done

echo -e "${YELLOW}4. Creating compressed backup...${NC}"

# Create a compressed version of the complete backup
COMPRESSED_FILE="$DATA_DIR/data_backup_$TIMESTAMP.sql.gz"
if gzip -c "$DATA_FILE" > "$COMPRESSED_FILE"; then
    echo -e "${GREEN}✓ Compressed backup created: $COMPRESSED_FILE${NC}"

    # Get file sizes for comparison
    ORIGINAL_SIZE=$(ls -lh "$DATA_FILE" | awk '{print $5}')
    COMPRESSED_SIZE=$(ls -lh "$COMPRESSED_FILE" | awk '{print $5}')
    echo "  Original size: $ORIGINAL_SIZE"
    echo "  Compressed size: $COMPRESSED_SIZE"
else
    echo -e "${RED}✗ Failed to create compressed backup${NC}"
fi

# Create latest symlinks for easy access
ln -sf "data_backup_$TIMESTAMP.sql" "$DATA_DIR/latest_data.sql"
ln -sf "data_backup_$TIMESTAMP.sql.gz" "$DATA_DIR/latest_data.sql.gz"

echo -e "${YELLOW}5. Generating data backup documentation...${NC}"

# Create a readable data backup summary
DATA_DOC="$DATA_DIR/data_backup_summary_$TIMESTAMP.md"

cat > "$DATA_DOC" << EOF
# Database Data Backup Summary
Generated on: $(date)
Backup files:
- Complete data: data_backup_$TIMESTAMP.sql
- Compressed data: data_backup_$TIMESTAMP.sql.gz
- Individual tables: tables_$TIMESTAMP/

## Database Information
- Project: Supabase Sneaker Store
- Schema: public
- Backup Type: Data only (INSERT statements)

## Backup Contents

### Complete Data Backup
File: data_backup_$TIMESTAMP.sql
Size: $(ls -lh "$DATA_FILE" | awk '{print $5}')
Contains: All table data from all tables

### Compressed Backup
File: data_backup_$TIMESTAMP.sql.gz
Size: $(ls -lh "$COMPRESSED_FILE" | awk '{print $5}')
Contains: Compressed version of complete data backup

### Individual Table Backups
Directory: tables_$TIMESTAMP/
Contains individual SQL files for critical tables:

EOF

# Add table backup list to documentation
for table in "${CRITICAL_TABLES[@]}"; do
    TABLE_FILE="$TABLE_DIR/${table}_data_$TIMESTAMP.sql"
    if [ -f "$TABLE_FILE" ]; then
        TABLE_SIZE=$(ls -lh "$TABLE_FILE" | awk '{print $5}')
        echo "- $table: ${table}_data_$TIMESTAMP.sql ($TABLE_SIZE)" >> "$DATA_DOC"
    else
        echo "- $table: BACKUP FAILED" >> "$DATA_DOC"
    fi
done

cat >> "$DATA_DOC" << EOF

## Recovery Instructions

### Complete Database Restore
To restore all data:
\`\`\`bash
# Restore complete data backup
psql -h [HOST] -U [USER] -d [DATABASE] -f data_backup_$TIMESTAMP.sql

# Or restore from compressed backup
gunzip -c data_backup_$TIMESTAMP.sql.gz | psql -h [HOST] -U [USER] -d [DATABASE]
\`\`\`

### Individual Table Restore
To restore specific tables:
\`\`\`bash
# Restore single table
psql -h [HOST] -U [USER] -d [DATABASE] -f tables_$TIMESTAMP/[table_name]_data_$TIMESTAMP.sql
\`\`\`

### Supabase Restore
For Supabase projects:
\`\`\`bash
# Using Supabase CLI
supabase db reset --db-url [CONNECTION_STRING]
supabase db push  # Apply schema first
# Then restore data using psql commands above
\`\`\`

## Important Notes
- Data backups contain INSERT statements only
- Schema must be restored first before restoring data
- Foreign key constraints may affect restore order
- Use transaction blocks for safer restoration
- Test restoration process in development environment first

## Verification
After restoration, verify data integrity:
1. Check row counts match original database
2. Verify critical data relationships
3. Test application functionality
4. Check for any constraint violations
EOF

echo -e "${GREEN}✓ Data backup documentation generated: $DATA_DOC${NC}"

echo ""
echo -e "${GREEN}=== Data Backup Complete ===${NC}"
echo "Files created:"
echo "  - Complete data: $DATA_FILE"
echo "  - Compressed: $COMPRESSED_FILE"
echo "  - Individual tables: $TABLE_DIR/"
echo "  - Documentation: $DATA_DOC"
echo "  - Latest symlinks: $DATA_DIR/latest_data.sql*"
echo ""
echo "Next steps:"
echo "  1. Run JSON export script: ./backup-critical-json.sh"
echo "  2. Verify backup integrity: ./verify-backups.sh"