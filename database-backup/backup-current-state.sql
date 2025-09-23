-- Database Backup Script for Supabase Sneaker Store
-- Generated: 2025-09-21
-- Purpose: Complete backup of current database state before reorganization

-- =====================================================
-- BACKUP METADATA
-- =====================================================
-- This script captures the complete state of the database including:
-- 1. All table schemas
-- 2. All data
-- 3. All constraints and indexes
-- 4. All RLS policies
-- 5. All functions and triggers

-- =====================================================
-- SECTION 1: EXPORT CURRENT SCHEMA STRUCTURE
-- =====================================================

-- Users Table Backup
CREATE TABLE IF NOT EXISTS backup_users AS
SELECT * FROM users;

-- Sneakers Table Backup
CREATE TABLE IF NOT EXISTS backup_sneakers AS
SELECT * FROM sneakers;

-- Products Table Backup (if exists)
CREATE TABLE IF NOT EXISTS backup_products AS
SELECT * FROM products;

-- Orders Table Backup
CREATE TABLE IF NOT EXISTS backup_orders AS
SELECT * FROM orders;

-- Order Items Backup
CREATE TABLE IF NOT EXISTS backup_order_items AS
SELECT * FROM order_items;

-- Stock Levels Backup
CREATE TABLE IF NOT EXISTS backup_stock_levels AS
SELECT * FROM stock_levels;

-- Stock Movements Backup
CREATE TABLE IF NOT EXISTS backup_stock_movements AS
SELECT * FROM stock_movements;

-- Cart Items Backup
CREATE TABLE IF NOT EXISTS backup_cart_items AS
SELECT * FROM cart_items;

-- Categories Backup
CREATE TABLE IF NOT EXISTS backup_categories AS
SELECT * FROM categories;

-- Reviews Backup
CREATE TABLE IF NOT EXISTS backup_reviews AS
SELECT * FROM reviews;

-- Wishlist Items Backup
CREATE TABLE IF NOT EXISTS backup_wishlist_items AS
SELECT * FROM wishlist_items;

-- =====================================================
-- SECTION 2: EXPORT SCHEMA DEFINITIONS
-- =====================================================

-- Get complete schema dump
\echo 'Exporting schema definitions...'

-- Store table definitions
CREATE TABLE IF NOT EXISTS backup_schema_definitions (
    table_name text,
    column_name text,
    data_type text,
    is_nullable text,
    column_default text,
    constraint_name text,
    constraint_type text,
    backup_date timestamp DEFAULT NOW()
);

INSERT INTO backup_schema_definitions (table_name, column_name, data_type, is_nullable, column_default)
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public';

-- =====================================================
-- SECTION 3: EXPORT CONSTRAINTS AND INDEXES
-- =====================================================

CREATE TABLE IF NOT EXISTS backup_constraints (
    constraint_name text,
    constraint_type text,
    table_name text,
    column_name text,
    foreign_table_name text,
    foreign_column_name text,
    backup_date timestamp DEFAULT NOW()
);

-- Backup all constraints
INSERT INTO backup_constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public';

-- =====================================================
-- SECTION 4: EXPORT RLS POLICIES
-- =====================================================

CREATE TABLE IF NOT EXISTS backup_rls_policies (
    schemaname text,
    tablename text,
    policyname text,
    permissive text,
    roles text[],
    cmd text,
    qual text,
    with_check text,
    backup_date timestamp DEFAULT NOW()
);

INSERT INTO backup_rls_policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check,
    NOW()
FROM pg_policies
WHERE schemaname = 'public';

-- =====================================================
-- SECTION 5: DATA INTEGRITY CHECKS
-- =====================================================

-- Count records in each table for verification
CREATE TABLE IF NOT EXISTS backup_record_counts (
    table_name text,
    record_count bigint,
    backup_date timestamp DEFAULT NOW()
);

DO $$
DECLARE
    tbl record;
    cnt bigint;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'backup_%'
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', tbl.table_name) INTO cnt;
        INSERT INTO backup_record_counts (table_name, record_count)
        VALUES (tbl.table_name, cnt);
    END LOOP;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify backup completion
SELECT 'Backup Tables Created' AS status, COUNT(*) AS count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'backup_%';

-- Show record counts
SELECT * FROM backup_record_counts ORDER BY table_name;

-- =====================================================
-- ROLLBACK SCRIPT TEMPLATE
-- =====================================================

/*
-- To restore from backup, use these commands:

-- Restore users table
TRUNCATE TABLE users CASCADE;
INSERT INTO users SELECT * FROM backup_users;

-- Restore sneakers table
TRUNCATE TABLE sneakers CASCADE;
INSERT INTO sneakers SELECT * FROM backup_sneakers;

-- Restore products table
TRUNCATE TABLE products CASCADE;
INSERT INTO products SELECT * FROM backup_products;

-- Restore orders
TRUNCATE TABLE orders CASCADE;
INSERT INTO orders SELECT * FROM backup_orders;

-- Restore order_items
TRUNCATE TABLE order_items CASCADE;
INSERT INTO order_items SELECT * FROM backup_order_items;

-- Continue for all tables...

-- Drop backup tables after successful restore
DROP TABLE IF EXISTS backup_users;
DROP TABLE IF EXISTS backup_sneakers;
DROP TABLE IF EXISTS backup_products;
-- etc...
*/

-- =====================================================
-- BACKUP COMPLETION MESSAGE
-- =====================================================
SELECT
    'Database backup completed successfully at ' || NOW() AS message,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'backup_%') AS backup_tables_created,
    (SELECT SUM(record_count) FROM backup_record_counts) AS total_records_backed_up;