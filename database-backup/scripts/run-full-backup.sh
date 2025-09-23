#!/bin/bash

# Master Database Backup Script
# For Supabase Sneaker Store Project
# Generated on: 2025-09-21

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/Users/nicodcz/Desktop/PGD 5/Bootcamp/sneaker-store/database-backup"
SCRIPT_DIR="$BACKUP_DIR/scripts"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Function to print with timestamp
print_with_timestamp() {
    local message="$1"
    local color="${2:-NC}"
    echo -e "${!color}[$(date '+%H:%M:%S')] $message${NC}"
}

# Function to run script with error handling
run_script() {
    local script_name="$1"
    local description="$2"
    local script_path="$SCRIPT_DIR/$script_name"

    print_with_timestamp "Starting $description..." "YELLOW"

    if [ ! -f "$script_path" ]; then
        print_with_timestamp "ERROR: Script not found: $script_path" "RED"
        return 1
    fi

    if [ ! -x "$script_path" ]; then
        print_with_timestamp "ERROR: Script not executable: $script_path" "RED"
        print_with_timestamp "Run: chmod +x $script_path" "YELLOW"
        return 1
    fi

    local start_time=$(date +%s)

    if "$script_path"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        print_with_timestamp "✓ $description completed successfully (${duration}s)" "GREEN"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        print_with_timestamp "✗ $description failed (${duration}s)" "RED"
        return 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_with_timestamp "Checking prerequisites..." "YELLOW"

    local errors=0

    # Check Supabase CLI
    if ! command -v supabase &> /dev/null; then
        print_with_timestamp "ERROR: Supabase CLI not found" "RED"
        print_with_timestamp "Install with: npm install -g supabase" "YELLOW"
        ((errors++))
    else
        print_with_timestamp "✓ Supabase CLI found" "GREEN"
    fi

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_with_timestamp "ERROR: Node.js not found" "RED"
        print_with_timestamp "Install from: https://nodejs.org/" "YELLOW"
        ((errors++))
    else
        local node_version=$(node --version)
        print_with_timestamp "✓ Node.js found: $node_version" "GREEN"
    fi

    # Check project directory and dependencies
    local project_dir="/Users/nicodcz/Desktop/PGD 5/Bootcamp/sneaker-store"
    if [ ! -f "$project_dir/package.json" ]; then
        print_with_timestamp "ERROR: Project directory not found: $project_dir" "RED"
        ((errors++))
    else
        print_with_timestamp "✓ Project directory found" "GREEN"

        # Check for Supabase package
        cd "$project_dir"
        if ! npm list @supabase/supabase-js &> /dev/null; then
            print_with_timestamp "WARNING: @supabase/supabase-js not installed" "YELLOW"
            print_with_timestamp "Installing @supabase/supabase-js..." "YELLOW"
            npm install @supabase/supabase-js
        else
            print_with_timestamp "✓ @supabase/supabase-js package found" "GREEN"
        fi
    fi

    # Check environment file
    if [ -f "$project_dir/.env.local" ]; then
        print_with_timestamp "✓ Environment file found: .env.local" "GREEN"
    elif [ -f "$project_dir/.env" ]; then
        print_with_timestamp "✓ Environment file found: .env" "GREEN"
    else
        print_with_timestamp "WARNING: No environment file found" "YELLOW"
        print_with_timestamp "Create .env.local with Supabase configuration" "YELLOW"
    fi

    # Check backup directory structure
    local dirs=("schemas" "data" "json" "scripts" "verification")
    for dir in "${dirs[@]}"; do
        if [ ! -d "$BACKUP_DIR/$dir" ]; then
            print_with_timestamp "Creating directory: $dir" "BLUE"
            mkdir -p "$BACKUP_DIR/$dir"
        fi
    done

    if [ $errors -gt 0 ]; then
        print_with_timestamp "Prerequisites check failed: $errors errors" "RED"
        return 1
    else
        print_with_timestamp "Prerequisites check passed" "GREEN"
        return 0
    fi
}

# Main function
main() {
    print_with_timestamp "===============================================" "CYAN"
    print_with_timestamp "    SUPABASE DATABASE BACKUP SYSTEM" "CYAN"
    print_with_timestamp "    Sneaker Store Project - Full Backup" "CYAN"
    print_with_timestamp "===============================================" "CYAN"
    print_with_timestamp "Timestamp: $TIMESTAMP" "CYAN"
    print_with_timestamp "Backup Directory: $BACKUP_DIR" "CYAN"
    print_with_timestamp "" "NC"

    local overall_start_time=$(date +%s)
    local failed_steps=0
    local total_steps=4

    # Step 1: Check prerequisites
    print_with_timestamp "STEP 1/4: Prerequisites Check" "MAGENTA"
    if ! check_prerequisites; then
        print_with_timestamp "Prerequisites check failed. Aborting backup." "RED"
        exit 1
    fi
    print_with_timestamp "" "NC"

    # Step 2: Schema backup
    print_with_timestamp "STEP 2/4: Schema Backup" "MAGENTA"
    if ! run_script "backup-schemas.sh" "schema backup"; then
        ((failed_steps++))
        print_with_timestamp "Schema backup failed, but continuing with other backups..." "YELLOW"
    fi
    print_with_timestamp "" "NC"

    # Step 3: Data backup
    print_with_timestamp "STEP 3/4: Data Backup" "MAGENTA"
    if ! run_script "backup-data.sh" "data backup"; then
        ((failed_steps++))
        print_with_timestamp "Data backup failed, but continuing with other backups..." "YELLOW"
    fi
    print_with_timestamp "" "NC"

    # Step 4: JSON backup
    print_with_timestamp "STEP 4/4: JSON Backup" "MAGENTA"
    if ! run_script "backup-critical-json.sh" "JSON backup"; then
        ((failed_steps++))
        print_with_timestamp "JSON backup failed, but continuing..." "YELLOW"
    fi
    print_with_timestamp "" "NC"

    # Run verification
    print_with_timestamp "VERIFICATION: Running backup verification..." "MAGENTA"
    if run_script "verify-backups.sh" "backup verification"; then
        print_with_timestamp "✓ Backup verification completed" "GREEN"
    else
        print_with_timestamp "✗ Backup verification failed" "RED"
        ((failed_steps++))
    fi

    # Calculate total time
    local overall_end_time=$(date +%s)
    local total_duration=$((overall_end_time - overall_start_time))
    local minutes=$((total_duration / 60))
    local seconds=$((total_duration % 60))

    print_with_timestamp "" "NC"
    print_with_timestamp "===============================================" "CYAN"
    print_with_timestamp "           BACKUP SUMMARY" "CYAN"
    print_with_timestamp "===============================================" "CYAN"
    print_with_timestamp "Total Steps: $total_steps" "CYAN"
    print_with_timestamp "Failed Steps: $failed_steps" "CYAN"
    print_with_timestamp "Success Rate: $(( (total_steps - failed_steps) * 100 / total_steps ))%" "CYAN"
    print_with_timestamp "Total Time: ${minutes}m ${seconds}s" "CYAN"
    print_with_timestamp "" "NC"

    if [ $failed_steps -eq 0 ]; then
        print_with_timestamp "🎉 FULL BACKUP COMPLETED SUCCESSFULLY!" "GREEN"
        print_with_timestamp "" "NC"
        print_with_timestamp "All backup files have been created:" "GREEN"
        print_with_timestamp "  • Schema: $BACKUP_DIR/schemas/latest_schema.sql" "GREEN"
        print_with_timestamp "  • Data: $BACKUP_DIR/data/latest_data.sql" "GREEN"
        print_with_timestamp "  • JSON: $BACKUP_DIR/json/latest_combined.json" "GREEN"
        print_with_timestamp "  • Verification: $BACKUP_DIR/verification/latest_verification.log" "GREEN"
        print_with_timestamp "" "NC"
        print_with_timestamp "Next Steps:" "CYAN"
        print_with_timestamp "  1. Review verification report" "CYAN"
        print_with_timestamp "  2. Store backups in secure location" "CYAN"
        print_with_timestamp "  3. Schedule regular backups" "CYAN"
        print_with_timestamp "  4. Test recovery procedures" "CYAN"
    else
        print_with_timestamp "⚠️  BACKUP COMPLETED WITH ISSUES" "YELLOW"
        print_with_timestamp "" "NC"
        print_with_timestamp "$failed_steps out of $total_steps steps failed." "YELLOW"
        print_with_timestamp "Please review the error messages above and:" "YELLOW"
        print_with_timestamp "  1. Fix any configuration issues" "YELLOW"
        print_with_timestamp "  2. Check network connectivity" "YELLOW"
        print_with_timestamp "  3. Verify Supabase authentication" "YELLOW"
        print_with_timestamp "  4. Re-run specific backup scripts" "YELLOW"
        print_with_timestamp "" "NC"
        print_with_timestamp "Available Commands:" "CYAN"
        print_with_timestamp "  • Schema only: ./backup-schemas.sh" "CYAN"
        print_with_timestamp "  • Data only: ./backup-data.sh" "CYAN"
        print_with_timestamp "  • JSON only: ./backup-critical-json.sh" "CYAN"
        print_with_timestamp "  • Verification: ./verify-backups.sh" "CYAN"
    fi

    print_with_timestamp "" "NC"
    print_with_timestamp "===============================================" "CYAN"

    # Return exit code based on success
    if [ $failed_steps -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Handle interruption
trap 'print_with_timestamp "Backup interrupted by user" "RED"; exit 130' INT TERM

# Run main function
main "$@"