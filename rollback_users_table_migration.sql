-- ROLLBACK SCRIPT FOR USERS TABLE MIGRATION
-- This script reverses all changes made by the users table enhancement migration
-- USE WITH CAUTION - This will remove all enhanced vendor features

-- WARNING: This rollback will permanently delete data in the new columns!
-- Make sure to backup your data before running this script.

BEGIN;

-- Step 1: Drop all new triggers
DROP TRIGGER IF EXISTS trigger_update_vendor_slug ON users;
DROP TRIGGER IF EXISTS trigger_validate_vendor_data ON users;
DROP TRIGGER IF EXISTS trigger_update_user_timestamps ON users;

-- Step 2: Drop all new functions
DROP FUNCTION IF EXISTS generate_vendor_slug(text);
DROP FUNCTION IF EXISTS update_vendor_slug();
DROP FUNCTION IF EXISTS validate_vendor_data();
DROP FUNCTION IF EXISTS update_user_timestamps();
DROP FUNCTION IF EXISTS update_vendor_metrics();

-- Step 3: Drop the vendor profiles view
DROP VIEW IF EXISTS vendor_profiles;

-- Step 4: Drop all RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Public can view verified vendors" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Step 5: Disable RLS (if it wasn't enabled before)
-- Note: Only uncomment if RLS was not previously enabled
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 6: Drop all new indexes
DROP INDEX IF EXISTS idx_users_vendor_id;
DROP INDEX IF EXISTS idx_users_vendor_slug_unique;
DROP INDEX IF EXISTS idx_users_vendor_rating;
DROP INDEX IF EXISTS idx_users_vendor_featured;
DROP INDEX IF EXISTS idx_users_vendor_subscription;
DROP INDEX IF EXISTS idx_users_recent_vendor_activity;
DROP INDEX IF EXISTS idx_users_vendor_status_verification;
DROP INDEX IF EXISTS idx_users_subscription_tier;
DROP INDEX IF EXISTS idx_users_featured_vendors_rating;
DROP INDEX IF EXISTS idx_users_vendor_profile_completion;

-- Step 7: Drop all new constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_vendor_rating_range;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_vendor_review_count_positive;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_vendor_subscription_tier;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_vendor_slug_format;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_vendor_fields_consistency;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_no_self_vendor_reference;

-- Step 8: Remove all new columns (THIS WILL DELETE DATA!)
-- WARNING: The following commands will permanently delete data!

-- Remove vendor hierarchy column
ALTER TABLE users DROP COLUMN IF EXISTS vendor_id;

-- Remove SEO and marketing columns
ALTER TABLE users DROP COLUMN IF EXISTS vendor_slug;
ALTER TABLE users DROP COLUMN IF EXISTS vendor_rating;
ALTER TABLE users DROP COLUMN IF EXISTS vendor_review_count;
ALTER TABLE users DROP COLUMN IF EXISTS vendor_featured;

-- Remove subscription columns
ALTER TABLE users DROP COLUMN IF EXISTS vendor_subscription_tier;
ALTER TABLE users DROP COLUMN IF EXISTS vendor_subscription_expires_at;

-- Remove onboarding and tracking columns
ALTER TABLE users DROP COLUMN IF EXISTS vendor_onboarding_completed;
ALTER TABLE users DROP COLUMN IF EXISTS vendor_last_login_at;

-- Remove social and operational columns
ALTER TABLE users DROP COLUMN IF EXISTS vendor_social_links;
ALTER TABLE users DROP COLUMN IF EXISTS vendor_operating_hours;

-- Remove computed column (if it exists)
ALTER TABLE users DROP COLUMN IF EXISTS vendor_profile_completion_score;

-- Step 9: Reset vendor analytics to basic structure
UPDATE users
SET vendor_analytics = jsonb_build_object(
    'total_sales', COALESCE(vendor_analytics->>'total_sales', '0')::numeric,
    'average_rating', COALESCE(vendor_analytics->>'average_rating', '0')::numeric,
    'total_products', COALESCE(vendor_analytics->>'total_products', '0')::integer
)
WHERE is_vendor = true;

-- Step 10: Reset vendor permissions to basic structure
UPDATE users
SET vendor_permissions = jsonb_build_object(
    'can_manage_orders', true,
    'can_update_profile', true,
    'can_view_analytics', true,
    'can_manage_products', true
)
WHERE is_vendor = true;

-- Step 11: Reset vendor settings to basic structure
UPDATE users
SET vendor_settings = jsonb_build_object(
    'auto_approve_orders', false,
    'default_shipping_policy', '',
    'notification_preferences', '{}'::jsonb
)
WHERE is_vendor = true;

-- Step 12: Reset vendor metrics to basic structure
UPDATE users
SET vendor_metrics = jsonb_build_object(
    'total_revenue', 0,
    'orders_fulfilled', 0,
    'response_time_avg', 0,
    'customer_satisfaction', 0
)
WHERE is_vendor = true;

-- Step 13: Reset vendor contact info to basic structure
UPDATE users
SET vendor_contact_info = jsonb_build_object(
    'phone', COALESCE(phone, ''),
    'website', '',
    'social_media', '{}'::jsonb
)
WHERE is_vendor = true;

-- Step 14: Reset vendor business address to empty
UPDATE users
SET vendor_business_address = '{}'::jsonb
WHERE is_vendor = true;

COMMIT;

-- Verification queries to check rollback success
-- Uncomment to run verification after rollback:

/*
-- Check that new columns are removed
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'vendor_id', 'vendor_slug', 'vendor_rating', 'vendor_review_count',
    'vendor_featured', 'vendor_subscription_tier', 'vendor_subscription_expires_at',
    'vendor_onboarding_completed', 'vendor_last_login_at', 'vendor_social_links',
    'vendor_operating_hours', 'vendor_profile_completion_score'
  );

-- Check that new indexes are removed
SELECT indexname
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname LIKE '%vendor_id%'
   OR indexname LIKE '%vendor_slug%'
   OR indexname LIKE '%vendor_rating%';

-- Check that new functions are removed
SELECT proname
FROM pg_proc
WHERE proname IN (
    'generate_vendor_slug', 'update_vendor_slug', 'validate_vendor_data',
    'update_user_timestamps', 'update_vendor_metrics'
);

-- Check vendor data structure
SELECT
    jsonb_object_keys(vendor_analytics) as analytics_keys,
    jsonb_object_keys(vendor_permissions) as permission_keys,
    jsonb_object_keys(vendor_settings) as settings_keys
FROM users
WHERE is_vendor = true
LIMIT 1;
*/