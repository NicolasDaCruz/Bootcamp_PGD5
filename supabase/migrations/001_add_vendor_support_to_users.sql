-- Migration: Add Vendor Support to Users Table
-- Version: 001
-- Description: Adds vendor_id and vendor-related fields to support multi-vendor functionality

-- =====================================================
-- ADD VENDOR COLUMNS TO USERS TABLE
-- =====================================================

-- Add vendor_id column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS vendor_id UUID UNIQUE,
ADD COLUMN IF NOT EXISTS is_vendor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vendor_name TEXT,
ADD COLUMN IF NOT EXISTS vendor_status TEXT DEFAULT 'pending' CHECK (vendor_status IN ('pending', 'active', 'suspended', 'inactive')),
ADD COLUMN IF NOT EXISTS vendor_commission_rate DECIMAL(5, 2) DEFAULT 10.00 CHECK (vendor_commission_rate >= 0 AND vendor_commission_rate <= 100),
ADD COLUMN IF NOT EXISTS vendor_joined_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS vendor_description TEXT,
ADD COLUMN IF NOT EXISTS vendor_logo_url TEXT,
ADD COLUMN IF NOT EXISTS vendor_banner_url TEXT,
ADD COLUMN IF NOT EXISTS vendor_policies JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vendor_analytics JSONB DEFAULT '{"total_sales": 0, "total_products": 0, "average_rating": 0}',
ADD COLUMN IF NOT EXISTS vendor_payment_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vendor_shipping_info JSONB DEFAULT '{}';

-- Create index on vendor_id for performance
CREATE INDEX IF NOT EXISTS idx_users_vendor_id ON users(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_vendor ON users(is_vendor) WHERE is_vendor = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_vendor_status ON users(vendor_status) WHERE is_vendor = TRUE;

-- =====================================================
-- CREATE VENDOR PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS vendor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL UNIQUE,
    business_name TEXT NOT NULL,
    business_registration TEXT,
    tax_id TEXT,
    business_address TEXT,
    business_city TEXT,
    business_country TEXT,
    business_postal_code TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    bank_account_info JSONB DEFAULT '{}',
    payout_schedule TEXT DEFAULT 'weekly' CHECK (payout_schedule IN ('daily', 'weekly', 'monthly')),
    minimum_payout_amount DECIMAL(10, 2) DEFAULT 100.00,
    current_balance DECIMAL(10, 2) DEFAULT 0.00,
    total_payouts DECIMAL(10, 2) DEFAULT 0.00,
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    verification_documents JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for vendor_profiles
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_vendor_id ON vendor_profiles(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_verification_status ON vendor_profiles(verification_status);

-- =====================================================
-- CREATE VENDOR PERMISSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS vendor_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    permission_type TEXT NOT NULL,
    permission_value BOOLEAN DEFAULT FALSE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(vendor_id, permission_type)
);

CREATE INDEX IF NOT EXISTS idx_vendor_permissions_vendor_id ON vendor_permissions(vendor_id);

-- =====================================================
-- UPDATE TRIGGER FOR VENDOR FIELDS
-- =====================================================

CREATE OR REPLACE FUNCTION update_vendor_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_vendor = TRUE AND OLD.is_vendor = FALSE THEN
        NEW.vendor_joined_at = NOW();
        NEW.vendor_id = gen_random_uuid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vendor_timestamp ON users;
CREATE TRIGGER trigger_update_vendor_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    WHEN (NEW.is_vendor IS DISTINCT FROM OLD.is_vendor)
    EXECUTE FUNCTION update_vendor_timestamp();

-- =====================================================
-- UPDATE TRIGGER FOR vendor_profiles
-- =====================================================

CREATE OR REPLACE FUNCTION update_vendor_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vendor_profile_timestamp ON vendor_profiles;
CREATE TRIGGER trigger_update_vendor_profile_timestamp
    BEFORE UPDATE ON vendor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_profile_timestamp();

-- =====================================================
-- ROW LEVEL SECURITY FOR VENDOR TABLES
-- =====================================================

-- Enable RLS on vendor_profiles
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Vendors can view and update their own profiles
CREATE POLICY vendor_profiles_vendor_policy ON vendor_profiles
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can view all vendor profiles
CREATE POLICY vendor_profiles_admin_view_policy ON vendor_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Enable RLS on vendor_permissions
ALTER TABLE vendor_permissions ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own permissions
CREATE POLICY vendor_permissions_vendor_view_policy ON vendor_permissions
    FOR SELECT
    USING (
        vendor_id IN (
            SELECT vendor_id FROM users
            WHERE id = auth.uid()
        )
    );

-- Only admins can manage permissions
CREATE POLICY vendor_permissions_admin_policy ON vendor_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- =====================================================
-- SAMPLE DATA FOR TESTING (REMOVE IN PRODUCTION)
-- =====================================================

-- Example: Convert existing user to vendor (uncomment to test)
-- UPDATE users
-- SET is_vendor = TRUE,
--     vendor_name = 'Sample Vendor Store',
--     vendor_status = 'active'
-- WHERE email = 'vendor@example.com';

-- =====================================================
-- ROLLBACK SCRIPT
-- =====================================================

/*
-- To rollback this migration, run:

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_vendor_timestamp ON users;
DROP TRIGGER IF EXISTS trigger_update_vendor_profile_timestamp ON vendor_profiles;

-- Drop functions
DROP FUNCTION IF EXISTS update_vendor_timestamp();
DROP FUNCTION IF EXISTS update_vendor_profile_timestamp();

-- Drop policies
DROP POLICY IF EXISTS vendor_profiles_vendor_policy ON vendor_profiles;
DROP POLICY IF EXISTS vendor_profiles_admin_view_policy ON vendor_profiles;
DROP POLICY IF EXISTS vendor_permissions_vendor_view_policy ON vendor_permissions;
DROP POLICY IF EXISTS vendor_permissions_admin_policy ON vendor_permissions;

-- Drop tables
DROP TABLE IF EXISTS vendor_permissions;
DROP TABLE IF EXISTS vendor_profiles;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_vendor_id;
DROP INDEX IF EXISTS idx_users_is_vendor;
DROP INDEX IF EXISTS idx_users_vendor_status;

-- Remove columns from users table
ALTER TABLE users
DROP COLUMN IF EXISTS vendor_id,
DROP COLUMN IF EXISTS is_vendor,
DROP COLUMN IF EXISTS vendor_name,
DROP COLUMN IF EXISTS vendor_status,
DROP COLUMN IF EXISTS vendor_commission_rate,
DROP COLUMN IF EXISTS vendor_joined_at,
DROP COLUMN IF EXISTS vendor_description,
DROP COLUMN IF EXISTS vendor_logo_url,
DROP COLUMN IF EXISTS vendor_banner_url,
DROP COLUMN IF EXISTS vendor_policies,
DROP COLUMN IF EXISTS vendor_analytics,
DROP COLUMN IF EXISTS vendor_payment_info,
DROP COLUMN IF EXISTS vendor_shipping_info;
*/