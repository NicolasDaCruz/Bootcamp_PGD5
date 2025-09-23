#!/bin/bash

# JSON Backup Wrapper Script
# For Supabase Sneaker Store Project
# Generated on: 2025-09-21

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/Users/nicodcz/Desktop/PGD 5/Bootcamp/sneaker-store/database-backup"
SCRIPT_DIR="$BACKUP_DIR/scripts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== JSON Backup Wrapper Script ===${NC}"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js not found. Please install Node.js first.${NC}"
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if we're in the project directory
PROJECT_DIR="/Users/nicodcz/Desktop/PGD 5/Bootcamp/sneaker-store"
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo -e "${RED}Error: Project directory not found at $PROJECT_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}1. Checking Node.js dependencies...${NC}"

# Check if @supabase/supabase-js is installed
cd "$PROJECT_DIR"
if ! npm list @supabase/supabase-js &> /dev/null; then
    echo -e "${YELLOW}Installing @supabase/supabase-js...${NC}"
    npm install @supabase/supabase-js
fi

echo -e "${YELLOW}2. Loading environment variables...${NC}"

# Load environment variables
if [ -f "$PROJECT_DIR/.env.local" ]; then
    echo "  Loading from .env.local..."
    export $(grep -v '^#' "$PROJECT_DIR/.env.local" | xargs)
elif [ -f "$PROJECT_DIR/.env" ]; then
    echo "  Loading from .env..."
    export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
else
    echo -e "${YELLOW}  Warning: No .env file found. Using default configuration.${NC}"
fi

echo -e "${YELLOW}3. Running JSON backup script...${NC}"

# Run the Node.js backup script
cd "$PROJECT_DIR"
node "$SCRIPT_DIR/backup-critical-json.js"

echo ""
echo -e "${GREEN}=== JSON Backup Wrapper Complete ===${NC}"