#!/bin/bash

# Database Backup Verification Script
# For Supabase Sneaker Store Project
# Generated on: 2025-09-21

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/Users/nicodcz/Desktop/PGD 5/Bootcamp/sneaker-store/database-backup"
VERIFICATION_DIR="$BACKUP_DIR/verification"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$VERIFICATION_DIR/verification_$TIMESTAMP.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Create verification directory
mkdir -p "$VERIFICATION_DIR"

# Function to log messages
log_message() {
    local message="$1"
    local color="${2:-reset}"
    echo -e "${!color}$message${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" >> "$LOG_FILE"
}

# Function to check file exists and is readable
check_file() {
    local file_path="$1"
    local description="$2"

    if [ -f "$file_path" ]; then
        local size=$(ls -lh "$file_path" | awk '{print $5}')
        log_message "  ✓ $description: $file_path ($size)" "GREEN"
        return 0
    else
        log_message "  ✗ $description: MISSING - $file_path" "RED"
        return 1
    fi
}

# Function to check SQL file syntax
check_sql_syntax() {
    local sql_file="$1"
    local description="$2"

    log_message "    Checking SQL syntax for $description..." "BLUE"

    # Basic SQL syntax checks
    local syntax_errors=0

    # Check for basic SQL structure
    if ! grep -q "CREATE\|INSERT\|ALTER\|DROP" "$sql_file" 2>/dev/null; then
        log_message "    ✗ No SQL statements found" "RED"
        ((syntax_errors++))
    fi

    # Check for unclosed statements (basic check)
    local semicolon_count=$(grep -c ";" "$sql_file" 2>/dev/null || echo "0")
    if [ "$semicolon_count" -eq 0 ]; then
        log_message "    ✗ No semicolons found - may indicate incomplete statements" "YELLOW"
        ((syntax_errors++))
    fi

    # Check for balanced parentheses (simple check)
    local open_parens=$(grep -o "(" "$sql_file" 2>/dev/null | wc -l)
    local close_parens=$(grep -o ")" "$sql_file" 2>/dev/null | wc -l)
    if [ "$open_parens" -ne "$close_parens" ]; then
        log_message "    ✗ Unbalanced parentheses: $open_parens open, $close_parens close" "RED"
        ((syntax_errors++))
    fi

    if [ "$syntax_errors" -eq 0 ]; then
        log_message "    ✓ SQL syntax appears valid" "GREEN"
        return 0
    else
        log_message "    ✗ SQL syntax issues found: $syntax_errors errors" "RED"
        return 1
    fi
}

# Function to check JSON file syntax
check_json_syntax() {
    local json_file="$1"
    local description="$2"

    log_message "    Checking JSON syntax for $description..." "BLUE"

    if command -v jq &> /dev/null; then
        if jq empty "$json_file" &>/dev/null; then
            log_message "    ✓ JSON syntax is valid" "GREEN"

            # Check for expected structure
            if jq -e '.metadata' "$json_file" &>/dev/null; then
                log_message "    ✓ Expected metadata structure found" "GREEN"
            else
                log_message "    ✗ Missing expected metadata structure" "YELLOW"
            fi

            # Check record count
            local record_count=$(jq -r '.metadata.totalRecords // 0' "$json_file" 2>/dev/null || echo "0")
            log_message "    ✓ Records: $record_count" "GREEN"

            return 0
        else
            log_message "    ✗ Invalid JSON syntax" "RED"
            return 1
        fi
    else
        log_message "    Warning: jq not installed, skipping JSON validation" "YELLOW"
        return 0
    fi
}

# Function to verify database connection
verify_database_connection() {
    log_message "2. Verifying database connection..." "YELLOW"

    if command -v supabase &> /dev/null; then
        if supabase status &>/dev/null; then
            log_message "  ✓ Supabase connection successful" "GREEN"
            return 0
        else
            log_message "  ✗ Supabase connection failed" "RED"
            log_message "    Run: supabase login && supabase link" "YELLOW"
            return 1
        fi
    else
        log_message "  ✗ Supabase CLI not found" "RED"
        return 1
    fi
}

# Function to get table row counts from database
get_database_row_counts() {
    log_message "3. Getting current database row counts..." "YELLOW"

    # Define critical tables to check
    local tables=(
        "users"
        "products"
        "orders"
        "order_items"
        "categories"
        "product_variants"
        "reviews"
        "wishlists"
    )

    local row_counts_file="$VERIFICATION_DIR/current_row_counts_$TIMESTAMP.txt"
    echo "# Database Row Counts - $(date)" > "$row_counts_file"
    echo "# Table_Name,Row_Count" >> "$row_counts_file"

    for table in "${tables[@]}"; do
        if command -v supabase &> /dev/null; then
            # Use Supabase to get row count
            local count=$(supabase db sql -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tail -n 1 | tr -d ' ' || echo "ERROR")

            if [ "$count" != "ERROR" ]; then
                log_message "  ✓ $table: $count rows" "GREEN"
                echo "$table,$count" >> "$row_counts_file"
            else
                log_message "  ✗ $table: Failed to get count" "RED"
                echo "$table,ERROR" >> "$row_counts_file"
            fi
        else
            log_message "  Warning: Cannot get row counts without Supabase CLI" "YELLOW"
            break
        fi
    done

    log_message "  Row counts saved to: $row_counts_file" "BLUE"
}

# Main verification function
main() {
    log_message "=== Database Backup Verification Script ===" "CYAN"
    log_message "Timestamp: $TIMESTAMP" "CYAN"
    log_message "Backup Directory: $BACKUP_DIR" "CYAN"
    log_message "Log File: $LOG_FILE" "CYAN"
    log_message "" "NC"

    local total_checks=0
    local passed_checks=0
    local failed_checks=0

    # 1. Check backup file structure
    log_message "1. Checking backup file structure..." "YELLOW"

    # Check directory structure
    local dirs=("schemas" "data" "json" "scripts" "verification")
    for dir in "${dirs[@]}"; do
        if [ -d "$BACKUP_DIR/$dir" ]; then
            log_message "  ✓ Directory exists: $dir/" "GREEN"
            ((passed_checks++))
        else
            log_message "  ✗ Directory missing: $dir/" "RED"
            ((failed_checks++))
        fi
        ((total_checks++))
    done

    # Check for latest schema backup
    log_message "  Checking schema backups..." "BLUE"
    if check_file "$BACKUP_DIR/schemas/latest_schema.sql" "Latest schema backup"; then
        ((passed_checks++))
        # Verify SQL syntax
        if check_sql_syntax "$BACKUP_DIR/schemas/latest_schema.sql" "schema backup"; then
            ((passed_checks++))
        else
            ((failed_checks++))
        fi
        ((total_checks++))
    else
        ((failed_checks++))
    fi
    ((total_checks++))

    # Check for latest data backup
    log_message "  Checking data backups..." "BLUE"
    if check_file "$BACKUP_DIR/data/latest_data.sql" "Latest data backup"; then
        ((passed_checks++))
        # Verify SQL syntax
        if check_sql_syntax "$BACKUP_DIR/data/latest_data.sql" "data backup"; then
            ((passed_checks++))
        else
            ((failed_checks++))
        fi
        ((total_checks++))
    else
        ((failed_checks++))
    fi
    ((total_checks++))

    # Check for compressed data backup
    if check_file "$BACKUP_DIR/data/latest_data.sql.gz" "Latest compressed data backup"; then
        ((passed_checks++))

        # Test compression integrity
        log_message "    Testing compression integrity..." "BLUE"
        if gzip -t "$BACKUP_DIR/data/latest_data.sql.gz" 2>/dev/null; then
            log_message "    ✓ Compressed file integrity OK" "GREEN"
            ((passed_checks++))
        else
            log_message "    ✗ Compressed file integrity failed" "RED"
            ((failed_checks++))
        fi
        ((total_checks++))
    else
        ((failed_checks++))
    fi
    ((total_checks++))

    # Check for JSON backups
    log_message "  Checking JSON backups..." "BLUE"
    if check_file "$BACKUP_DIR/json/latest_combined.json" "Latest combined JSON backup"; then
        ((passed_checks++))
        # Verify JSON syntax
        if check_json_syntax "$BACKUP_DIR/json/latest_combined.json" "combined JSON backup"; then
            ((passed_checks++))
        else
            ((failed_checks++))
        fi
        ((total_checks++))
    else
        ((failed_checks++))
    fi
    ((total_checks++))

    # Check individual JSON files
    local json_tables=("users" "products" "orders")
    for table in "${json_tables[@]}"; do
        local json_pattern="$BACKUP_DIR/json/${table}_*.json"
        local json_files=($(ls $json_pattern 2>/dev/null | head -1))

        if [ ${#json_files[@]} -gt 0 ] && [ -f "${json_files[0]}" ]; then
            log_message "  ✓ $table JSON backup exists" "GREEN"
            ((passed_checks++))

            if check_json_syntax "${json_files[0]}" "$table JSON backup"; then
                ((passed_checks++))
            else
                ((failed_checks++))
            fi
            ((total_checks++))
        else
            log_message "  ✗ $table JSON backup missing" "RED"
            ((failed_checks++))
        fi
        ((total_checks++))
    done

    # Verify database connection and get current state
    if verify_database_connection; then
        ((passed_checks++))
        get_database_row_counts
    else
        ((failed_checks++))
        log_message "  Warning: Cannot verify against current database" "YELLOW"
    fi
    ((total_checks++))

    # 4. Check script permissions
    log_message "4. Checking script permissions..." "YELLOW"

    local scripts=("backup-schemas.sh" "backup-data.sh" "backup-critical-json.sh" "verify-backups.sh")
    for script in "${scripts[@]}"; do
        local script_path="$BACKUP_DIR/scripts/$script"
        if [ -f "$script_path" ]; then
            if [ -x "$script_path" ]; then
                log_message "  ✓ $script is executable" "GREEN"
                ((passed_checks++))
            else
                log_message "  ✗ $script is not executable" "RED"
                log_message "    Run: chmod +x $script_path" "YELLOW"
                ((failed_checks++))
            fi
        else
            log_message "  ✗ $script is missing" "RED"
            ((failed_checks++))
        fi
        ((total_checks++))
    done

    # 5. Generate verification summary
    log_message "5. Generating verification summary..." "YELLOW"

    local verification_summary="$VERIFICATION_DIR/verification_summary_$TIMESTAMP.md"

    cat > "$verification_summary" << EOF
# Backup Verification Report
**Generated:** $(date)
**Timestamp:** $timestamp

## Summary
- **Total Checks:** $total_checks
- **Passed:** $passed_checks
- **Failed:** $failed_checks
- **Success Rate:** $(( passed_checks * 100 / total_checks ))%

## Status
$(if [ $failed_checks -eq 0 ]; then echo "✅ **ALL CHECKS PASSED** - Backup system is healthy"; else echo "❌ **ISSUES FOUND** - Review failed checks below"; fi)

## Detailed Results
$(cat "$LOG_FILE" | grep -E "✓|✗" | sed 's/^/- /')

## Next Steps
$(if [ $failed_checks -eq 0 ]; then
    echo "- Regular monitoring recommended"
    echo "- Next verification in 24 hours"
    echo "- Consider automated verification scheduling"
else
    echo "- Address failed checks immediately"
    echo "- Re-run verification after fixes"
    echo "- Review backup procedures"
fi)

## Files Verified
- Schema Backup: \`schemas/latest_schema.sql\`
- Data Backup: \`data/latest_data.sql\`
- Compressed Backup: \`data/latest_data.sql.gz\`
- JSON Backup: \`json/latest_combined.json\`
- Individual JSON files for critical tables

## Log Files
- Detailed Log: \`verification/verification_$TIMESTAMP.log\`
- This Report: \`verification/verification_summary_$TIMESTAMP.md\`

---
*Generated by Sneaker Store Backup Verification System*
EOF

    log_message "  ✓ Verification summary created: $verification_summary" "GREEN"

    # Create latest symlinks
    ln -sf "verification_$TIMESTAMP.log" "$VERIFICATION_DIR/latest_verification.log"
    ln -sf "verification_summary_$TIMESTAMP.md" "$VERIFICATION_DIR/latest_summary.md"

    # Final summary
    log_message "" "NC"
    log_message "=== Verification Complete ===" "CYAN"
    log_message "Total Checks: $total_checks" "CYAN"
    log_message "Passed: $passed_checks" "GREEN"
    log_message "Failed: $failed_checks" "RED"
    log_message "Success Rate: $(( passed_checks * 100 / total_checks ))%" "CYAN"

    if [ $failed_checks -eq 0 ]; then
        log_message "" "NC"
        log_message "🎉 ALL CHECKS PASSED! Backup system is healthy." "GREEN"
        log_message "" "NC"
        log_message "Files:" "CYAN"
        log_message "  - Detailed log: $LOG_FILE" "CYAN"
        log_message "  - Summary report: $verification_summary" "CYAN"
        return 0
    else
        log_message "" "NC"
        log_message "⚠️  ISSUES FOUND! Review the report and fix failed checks." "RED"
        log_message "" "NC"
        log_message "Files:" "CYAN"
        log_message "  - Detailed log: $LOG_FILE" "CYAN"
        log_message "  - Summary report: $verification_summary" "CYAN"
        return 1
    fi
}

# Run main function
main "$@"