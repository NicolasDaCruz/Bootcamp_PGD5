#!/bin/bash

# Comprehensive Database Schema Backup Script
# For Supabase Sneaker Store Project
# Generated on: 2025-09-21

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/Users/nicodcz/Desktop/PGD 5/Bootcamp/sneaker-store/database-backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SCHEMA_DIR="$BACKUP_DIR/schemas"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Supabase Schema Backup Script ===${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Backup Directory: $BACKUP_DIR"
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI not found. Please install it first.${NC}"
    echo "Install with: npm install -g supabase"
    exit 1
fi

# Create schema backup directory if it doesn't exist
mkdir -p "$SCHEMA_DIR"

echo -e "${YELLOW}1. Checking Supabase connection...${NC}"
# Test connection by checking status
if ! supabase status; then
    echo -e "${RED}Error: Unable to connect to Supabase. Make sure you're logged in and the project is linked.${NC}"
    echo "Run: supabase login"
    echo "Run: supabase link"
    exit 1
fi

echo -e "${YELLOW}2. Exporting database schema...${NC}"

# Export complete schema using pg_dump through Supabase
SCHEMA_FILE="$SCHEMA_DIR/schema_backup_$TIMESTAMP.sql"

# Use supabase db dump to export schema
if supabase db dump --schema-only --file "$SCHEMA_FILE"; then
    echo -e "${GREEN}✓ Schema exported successfully to: $SCHEMA_FILE${NC}"
else
    echo -e "${RED}✗ Failed to export schema${NC}"
    exit 1
fi

# Create a latest symlink for easy access
ln -sf "schema_backup_$TIMESTAMP.sql" "$SCHEMA_DIR/latest_schema.sql"

echo -e "${YELLOW}3. Generating schema documentation...${NC}"

# Create a readable schema summary
SCHEMA_DOC="$SCHEMA_DIR/schema_summary_$TIMESTAMP.md"

cat > "$SCHEMA_DOC" << EOF
# Database Schema Summary
Generated on: $(date)
Backup file: schema_backup_$TIMESTAMP.sql

## Database Information
- Project: Supabase Sneaker Store
- Schema: public
- Backup Type: Schema only (no data)

## Tables Included in Backup
The following tables and their structures are included in this backup:

EOF

# Add table list to documentation
echo "- abandoned_carts" >> "$SCHEMA_DOC"
echo "- active_reservations" >> "$SCHEMA_DOC"
echo "- active_stock_alerts" >> "$SCHEMA_DOC"
echo "- automated_responses" >> "$SCHEMA_DOC"
echo "- brand_sustainability_scorecards" >> "$SCHEMA_DOC"
echo "- cart_items" >> "$SCHEMA_DOC"
echo "- cart_recovery_links" >> "$SCHEMA_DOC"
echo "- categories" >> "$SCHEMA_DOC"
echo "- chat_messages" >> "$SCHEMA_DOC"
echo "- chat_sessions" >> "$SCHEMA_DOC"
echo "- discount_codes" >> "$SCHEMA_DOC"
echo "- eco_certifications" >> "$SCHEMA_DOC"
echo "- environmental_impact" >> "$SCHEMA_DOC"
echo "- faq_categories" >> "$SCHEMA_DOC"
echo "- faq_items" >> "$SCHEMA_DOC"
echo "- guest_checkouts" >> "$SCHEMA_DOC"
echo "- import_summary" >> "$SCHEMA_DOC"
echo "- loyalty_programs" >> "$SCHEMA_DOC"
echo "- loyalty_rewards" >> "$SCHEMA_DOC"
echo "- loyalty_tiers" >> "$SCHEMA_DOC"
echo "- loyalty_transactions" >> "$SCHEMA_DOC"
echo "- notification_log" >> "$SCHEMA_DOC"
echo "- notification_preferences" >> "$SCHEMA_DOC"
echo "- order_analytics" >> "$SCHEMA_DOC"
echo "- order_items" >> "$SCHEMA_DOC"
echo "- order_notifications" >> "$SCHEMA_DOC"
echo "- order_status_history" >> "$SCHEMA_DOC"
echo "- order_tracking_summary" >> "$SCHEMA_DOC"
echo "- order_tracking_updates" >> "$SCHEMA_DOC"
echo "- orders" >> "$SCHEMA_DOC"
echo "- packaging_options" >> "$SCHEMA_DOC"
echo "- product_condition_assessments" >> "$SCHEMA_DOC"
echo "- product_eco_certifications" >> "$SCHEMA_DOC"
echo "- product_images" >> "$SCHEMA_DOC"
echo "- product_inventory" >> "$SCHEMA_DOC"
echo "- product_maintenance_guides" >> "$SCHEMA_DOC"
echo "- product_variants" >> "$SCHEMA_DOC"
echo "- products" >> "$SCHEMA_DOC"
echo "- recommendation_analytics" >> "$SCHEMA_DOC"
echo "- recommendation_cache" >> "$SCHEMA_DOC"
echo "- recommendation_metrics" >> "$SCHEMA_DOC"
echo "- recycling_programs" >> "$SCHEMA_DOC"
echo "- recycling_submissions" >> "$SCHEMA_DOC"
echo "- review_helpful_votes" >> "$SCHEMA_DOC"
echo "- review_moderation_log" >> "$SCHEMA_DOC"
echo "- review_photos" >> "$SCHEMA_DOC"
echo "- reviews" >> "$SCHEMA_DOC"
echo "- saved_items" >> "$SCHEMA_DOC"
echo "- shipping_carriers" >> "$SCHEMA_DOC"
echo "- shipping_rates" >> "$SCHEMA_DOC"
echo "- sneaker_products_view (view)" >> "$SCHEMA_DOC"
echo "- sneakers" >> "$SCHEMA_DOC"
echo "- stock_alerts" >> "$SCHEMA_DOC"
echo "- stock_levels" >> "$SCHEMA_DOC"
echo "- stock_movement_audit" >> "$SCHEMA_DOC"
echo "- stock_movements" >> "$SCHEMA_DOC"
echo "- stock_reservations" >> "$SCHEMA_DOC"
echo "- support_ticket_messages" >> "$SCHEMA_DOC"
echo "- support_tickets" >> "$SCHEMA_DOC"
echo "- user_behavior" >> "$SCHEMA_DOC"
echo "- user_loyalty_points" >> "$SCHEMA_DOC"
echo "- user_packaging_preferences" >> "$SCHEMA_DOC"
echo "- user_product_affinity" >> "$SCHEMA_DOC"
echo "- user_recycling_enrollments" >> "$SCHEMA_DOC"
echo "- user_reward_redemptions" >> "$SCHEMA_DOC"
echo "- users" >> "$SCHEMA_DOC"
echo "- wishlist_items" >> "$SCHEMA_DOC"
echo "- wishlist_shares" >> "$SCHEMA_DOC"
echo "- wishlists" >> "$SCHEMA_DOC"

cat >> "$SCHEMA_DOC" << EOF

## Recovery Instructions
To restore the schema:
1. Connect to your target database
2. Run: psql -h [HOST] -U [USER] -d [DATABASE] -f schema_backup_$TIMESTAMP.sql

## Notes
- This backup contains only the schema structure (tables, indexes, constraints)
- Data must be restored separately using the data backup files
- Views and stored procedures are included
- Row Level Security (RLS) policies are included
EOF

echo -e "${GREEN}✓ Schema documentation generated: $SCHEMA_DOC${NC}"

echo ""
echo -e "${GREEN}=== Schema Backup Complete ===${NC}"
echo "Files created:"
echo "  - Schema: $SCHEMA_FILE"
echo "  - Documentation: $SCHEMA_DOC"
echo "  - Latest symlink: $SCHEMA_DIR/latest_schema.sql"
echo ""
echo "Next steps:"
echo "  1. Run data backup script: ./backup-data.sh"
echo "  2. Run JSON export script: ./backup-critical-json.sh"