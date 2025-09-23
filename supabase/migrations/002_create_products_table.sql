-- Migration: Create Comprehensive Products Table
-- Version: 002
-- Description: Creates new products table for KicksDB API data with full stock support

-- =====================================================
-- DROP EXISTING PRODUCTS TABLE (IF EXISTS)
-- =====================================================

-- Backup existing products data first
CREATE TABLE IF NOT EXISTS products_backup_002 AS
SELECT * FROM products WHERE EXISTS (SELECT 1 FROM products LIMIT 1);

-- Drop existing table and constraints
DROP TABLE IF EXISTS products CASCADE;

-- =====================================================
-- CREATE NEW PRODUCTS TABLE
-- =====================================================

CREATE TABLE products (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- KicksDB API fields
    kicksdb_id TEXT UNIQUE,
    kicksdb_sku TEXT,
    kicksdb_gtin TEXT,
    kicksdb_style_code TEXT,

    -- Basic product information
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    name TEXT NOT NULL,
    colorway TEXT,
    nickname TEXT,
    category TEXT DEFAULT 'sneakers',
    subcategory TEXT,

    -- Descriptions and details
    description TEXT,
    detailed_description TEXT,
    story_html TEXT,
    highlights TEXT[],

    -- Pricing information
    retail_price DECIMAL(10, 2),
    sale_price DECIMAL(10, 2),
    discount_percentage DECIMAL(5, 2),
    currency TEXT DEFAULT 'USD',
    price_history JSONB DEFAULT '[]',

    -- Release information
    release_date DATE,
    release_year INTEGER,
    release_month INTEGER,
    announced_date DATE,

    -- Physical attributes
    gender TEXT CHECK (gender IN ('mens', 'womens', 'youth', 'unisex', 'kids')),
    sizing_type TEXT DEFAULT 'US',
    available_sizes JSONB DEFAULT '[]',
    materials TEXT[],
    weight_grams INTEGER,

    -- Images and media
    main_image_url TEXT,
    images JSONB DEFAULT '[]',
    thumbnail_url TEXT,
    video_url TEXT,
    three_sixty_images JSONB DEFAULT '[]',

    -- Stock management
    total_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (total_quantity - reserved_quantity) STORED,
    low_stock_threshold INTEGER DEFAULT 5,
    is_in_stock BOOLEAN GENERATED ALWAYS AS (available_quantity > 0) STORED,
    stock_status TEXT GENERATED ALWAYS AS (
        CASE
            WHEN available_quantity = 0 THEN 'out_of_stock'
            WHEN available_quantity <= low_stock_threshold THEN 'low_stock'
            ELSE 'in_stock'
        END
    ) STORED,

    -- Vendor information
    vendor_id UUID,
    vendor_sku TEXT,
    supplier_info JSONB DEFAULT '{}',

    -- Product status and visibility
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'discontinued', 'coming_soon')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_exclusive BOOLEAN DEFAULT FALSE,
    is_limited BOOLEAN DEFAULT FALSE,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'vendor_only')),

    -- SEO and marketing
    slug TEXT UNIQUE,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT[],
    tags TEXT[],

    -- Analytics and metrics
    view_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3, 2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    wishlist_count INTEGER DEFAULT 0,

    -- Categorization and collections
    collections TEXT[],
    season TEXT,
    collaboration TEXT,
    designer TEXT,

    -- Additional specifications
    specifications JSONB DEFAULT '{}',
    care_instructions TEXT,
    authenticity_guarantee BOOLEAN DEFAULT TRUE,
    condition TEXT DEFAULT 'new' CHECK (condition IN ('new', 'used', 'refurbished', 'b-grade')),

    -- Import and sync metadata
    import_source TEXT DEFAULT 'manual',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'synced',
    sync_errors JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(brand, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(model, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(colorway, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'D')
    ) STORED
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- Primary indexes
CREATE INDEX idx_products_kicksdb_id ON products(kicksdb_id) WHERE kicksdb_id IS NOT NULL;
CREATE INDEX idx_products_kicksdb_sku ON products(kicksdb_sku) WHERE kicksdb_sku IS NOT NULL;
CREATE INDEX idx_products_vendor_id ON products(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX idx_products_slug ON products(slug) WHERE slug IS NOT NULL;

-- Search and filter indexes
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_model ON products(model);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_gender ON products(gender) WHERE gender IS NOT NULL;
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_stock_status ON products(stock_status);

-- Date indexes
CREATE INDEX idx_products_release_date ON products(release_date) WHERE release_date IS NOT NULL;
CREATE INDEX idx_products_created_at ON products(created_at);

-- Performance indexes
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_is_in_stock ON products(is_in_stock) WHERE is_in_stock = TRUE;

-- Full-text search index
CREATE INDEX idx_products_search_vector ON products USING GIN(search_vector);

-- Array field indexes (GIN for array contains operations)
CREATE INDEX idx_products_tags ON products USING GIN(tags) WHERE tags IS NOT NULL;
CREATE INDEX idx_products_collections ON products USING GIN(collections) WHERE collections IS NOT NULL;

-- JSONB indexes
CREATE INDEX idx_products_images ON products USING GIN(images);
CREATE INDEX idx_products_available_sizes ON products USING GIN(available_sizes);

-- =====================================================
-- CREATE PRODUCT VARIANTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- Variant identification
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT,

    -- Variant attributes
    size TEXT NOT NULL,
    size_type TEXT DEFAULT 'US',
    eu_size TEXT,
    uk_size TEXT,
    cm_size TEXT,
    color TEXT,
    color_code TEXT,

    -- Pricing
    price DECIMAL(10, 2),
    compare_at_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),

    -- Stock
    quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,

    -- Physical attributes
    weight_grams INTEGER,
    dimensions JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,

    -- Metadata
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for variants
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_size ON product_variants(size);
CREATE INDEX idx_product_variants_is_active ON product_variants(is_active) WHERE is_active = TRUE;

-- =====================================================
-- CREATE UPDATE TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_products_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    -- Update slug if name changes
    IF NEW.name IS DISTINCT FROM OLD.name OR NEW.slug IS NULL THEN
        NEW.slug = LOWER(REGEXP_REPLACE(
            NEW.brand || '-' || NEW.model || '-' || NEW.name || '-' || COALESCE(NEW.colorway, ''),
            '[^a-z0-9]+', '-', 'g'
        ));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_products_timestamp ON products;
CREATE TRIGGER trigger_update_products_timestamp
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_timestamp();

-- =====================================================
-- CREATE STOCK UPDATE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_product_stock(
    p_product_id UUID,
    p_quantity_change INTEGER,
    p_operation TEXT -- 'add', 'remove', 'reserve', 'release'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_quantity INTEGER;
    v_current_reserved INTEGER;
BEGIN
    -- Lock the row for update
    SELECT total_quantity, reserved_quantity
    INTO v_current_quantity, v_current_reserved
    FROM products
    WHERE id = p_product_id
    FOR UPDATE;

    CASE p_operation
        WHEN 'add' THEN
            UPDATE products
            SET total_quantity = total_quantity + p_quantity_change
            WHERE id = p_product_id;

        WHEN 'remove' THEN
            IF v_current_quantity - v_current_reserved >= p_quantity_change THEN
                UPDATE products
                SET total_quantity = total_quantity - p_quantity_change
                WHERE id = p_product_id;
            ELSE
                RAISE EXCEPTION 'Insufficient stock available';
            END IF;

        WHEN 'reserve' THEN
            IF v_current_quantity - v_current_reserved >= p_quantity_change THEN
                UPDATE products
                SET reserved_quantity = reserved_quantity + p_quantity_change
                WHERE id = p_product_id;
            ELSE
                RAISE EXCEPTION 'Insufficient stock to reserve';
            END IF;

        WHEN 'release' THEN
            UPDATE products
            SET reserved_quantity = GREATEST(0, reserved_quantity - p_quantity_change)
            WHERE id = p_product_id;

        ELSE
            RAISE EXCEPTION 'Invalid operation: %', p_operation;
    END CASE;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Public can view active products
CREATE POLICY products_public_view_policy ON products
    FOR SELECT
    USING (status = 'active' AND visibility = 'public');

-- Vendors can manage their own products
CREATE POLICY products_vendor_policy ON products
    FOR ALL
    USING (
        vendor_id IN (
            SELECT vendor_id FROM users
            WHERE id = auth.uid() AND is_vendor = TRUE
        )
    )
    WITH CHECK (
        vendor_id IN (
            SELECT vendor_id FROM users
            WHERE id = auth.uid() AND is_vendor = TRUE
        )
    );

-- Admins can manage all products
CREATE POLICY products_admin_policy ON products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Similar policies for product_variants
CREATE POLICY product_variants_public_view_policy ON product_variants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_variants.product_id
            AND products.status = 'active'
            AND products.visibility = 'public'
        )
    );

CREATE POLICY product_variants_vendor_policy ON product_variants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_variants.product_id
            AND products.vendor_id IN (
                SELECT vendor_id FROM users
                WHERE id = auth.uid() AND is_vendor = TRUE
            )
        )
    );

CREATE POLICY product_variants_admin_policy ON product_variants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- MIGRATE DATA FROM BACKUP (IF EXISTS)
-- =====================================================

-- Restore data from backup if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products_backup_002') THEN
        INSERT INTO products (
            id, brand, model, name, colorway, description,
            retail_price, main_image_url, status, created_at
        )
        SELECT
            id,
            COALESCE(brand, 'Unknown'),
            COALESCE(model, 'Unknown'),
            COALESCE(name, brand || ' ' || model),
            colorway,
            description,
            price,
            image_url,
            'active',
            created_at
        FROM products_backup_002
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- ROLLBACK SCRIPT
-- =====================================================

/*
-- To rollback this migration:

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_products_timestamp ON products;

-- Drop functions
DROP FUNCTION IF EXISTS update_products_timestamp();
DROP FUNCTION IF EXISTS update_product_stock(UUID, INTEGER, TEXT);

-- Drop policies
DROP POLICY IF EXISTS products_public_view_policy ON products;
DROP POLICY IF EXISTS products_vendor_policy ON products;
DROP POLICY IF EXISTS products_admin_policy ON products;
DROP POLICY IF EXISTS product_variants_public_view_policy ON product_variants;
DROP POLICY IF EXISTS product_variants_vendor_policy ON product_variants;
DROP POLICY IF EXISTS product_variants_admin_policy ON product_variants;

-- Drop tables
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Restore from backup
CREATE TABLE products AS SELECT * FROM products_backup_002;

-- Drop backup
DROP TABLE IF EXISTS products_backup_002;
*/