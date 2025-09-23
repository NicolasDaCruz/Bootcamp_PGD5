-- Enhanced Products Table Migration for KicksDB API Integration
-- Migration: 005_enhance_products_table_for_kicksdb.sql
-- Purpose: Optimize products table for KicksDB API data and improve stock tracking

-- ================================
-- PART 1: ADD KICKSDB SPECIFIC COLUMNS
-- ================================

-- Add KicksDB API specific columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS kicksdb_id TEXT,
ADD COLUMN IF NOT EXISTS kicksdb_sku TEXT,
ADD COLUMN IF NOT EXISTS kicksdb_slug TEXT,
ADD COLUMN IF NOT EXISTS silhouette TEXT,
ADD COLUMN IF NOT EXISTS retail_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS market_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS market_price_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS colorway TEXT,
ADD COLUMN IF NOT EXISTS style_code_alt TEXT, -- Alternative style code
ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'partial')),
ADD COLUMN IF NOT EXISTS sync_error TEXT,
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual' CHECK (data_source IN ('manual', 'kicksdb', 'imported', 'scraped')),
ADD COLUMN IF NOT EXISTS external_id TEXT, -- Generic external ID for other APIs
ADD COLUMN IF NOT EXISTS match_score INTEGER, -- For data matching confidence
ADD COLUMN IF NOT EXISTS original_image_urls JSONB DEFAULT '[]', -- Store original URLs before processing
ADD COLUMN IF NOT EXISTS image_optimization_status TEXT DEFAULT 'pending' CHECK (image_optimization_status IN ('pending', 'processing', 'completed', 'failed'));

-- ================================
-- PART 2: ENHANCE STOCK TRACKING
-- ================================

-- Enhanced stock tracking columns
ALTER TABLE products
ADD COLUMN IF NOT EXISTS total_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reserved_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS incoming_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS damaged_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_location TEXT DEFAULT 'main_warehouse',
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS stock_last_updated TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS stock_tracking_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS auto_reorder_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stock_alerts_enabled BOOLEAN DEFAULT TRUE;

-- Add computed column for stock status
ALTER TABLE products
ADD COLUMN IF NOT EXISTS computed_stock_status TEXT GENERATED ALWAYS AS (
  CASE
    WHEN available_stock <= 0 THEN 'out_of_stock'
    WHEN available_stock <= low_stock_threshold THEN 'low_stock'
    WHEN available_stock <= reorder_point THEN 'reorder_soon'
    ELSE 'in_stock'
  END
) STORED;

-- ================================
-- PART 3: ENHANCE VARIANT SUPPORT
-- ================================

-- Enhance product_variants table for better KicksDB integration
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS kicksdb_variant_id TEXT,
ADD COLUMN IF NOT EXISTS external_variant_id TEXT,
ADD COLUMN IF NOT EXISTS variant_type TEXT DEFAULT 'size' CHECK (variant_type IN ('size', 'color', 'material', 'style')),
ADD COLUMN IF NOT EXISTS variant_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_primary_variant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'sold_out', 'coming_soon', 'discontinued')),
ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS damage_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS location_id TEXT,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS msrp NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS weight_grams INTEGER,
ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{}', -- Store length, width, height
ADD COLUMN IF NOT EXISTS variant_images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS last_restocked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Add computed available stock for variants
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS computed_available_stock INTEGER GENERATED ALWAYS AS (
  GREATEST(0, stock_quantity - reserved_quantity - damage_quantity)
) STORED;

-- ================================
-- PART 4: METADATA AND TRACKING
-- ================================

-- Add comprehensive metadata tracking
ALTER TABLE products
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS search_terms TEXT[],
ADD COLUMN IF NOT EXISTS seasonal_category TEXT,
ADD COLUMN IF NOT EXISTS trend_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wishlist_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_average NUMERIC(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_purchased_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS first_sale_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS peak_demand_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS inventory_turnover_rate NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS profit_margin NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS roi NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS supplier_lead_time_days INTEGER,
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 100 CHECK (quality_score >= 0 AND quality_score <= 100);

-- ================================
-- PART 5: INDEXES FOR PERFORMANCE
-- ================================

-- KicksDB specific indexes
CREATE INDEX IF NOT EXISTS idx_products_kicksdb_id ON products(kicksdb_id) WHERE kicksdb_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_kicksdb_sku ON products(kicksdb_sku) WHERE kicksdb_sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_sync_status ON products(sync_status);
CREATE INDEX IF NOT EXISTS idx_products_data_source ON products(data_source);
CREATE INDEX IF NOT EXISTS idx_products_last_sync ON products(last_sync_at);

-- Stock tracking indexes
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(computed_stock_status);
CREATE INDEX IF NOT EXISTS idx_products_available_stock ON products(available_stock);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(available_stock) WHERE available_stock <= low_stock_threshold;
CREATE INDEX IF NOT EXISTS idx_products_stock_last_updated ON products(stock_last_updated);
CREATE INDEX IF NOT EXISTS idx_products_reorder_needed ON products(available_stock, reorder_point) WHERE available_stock <= reorder_point;

-- Variant indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_kicksdb_id ON product_variants(kicksdb_variant_id) WHERE kicksdb_variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_variants_type ON product_variants(variant_type);
CREATE INDEX IF NOT EXISTS idx_product_variants_availability ON product_variants(availability_status);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock_available ON product_variants(computed_available_stock);
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(barcode) WHERE barcode IS NOT NULL;

-- Search and performance indexes
CREATE INDEX IF NOT EXISTS idx_products_brand_model ON products(brand, model) WHERE brand IS NOT NULL AND model IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_brand ON products(category_id, brand) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(price) WHERE price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_release_date ON products(release_date) WHERE release_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(is_active, is_featured) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_popularity ON products(popularity_score DESC, view_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_trending ON products(trend_score DESC, last_viewed_at DESC);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING gin(search_vector) WHERE search_vector IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING gin(tags) WHERE tags IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_keywords ON products USING gin(keywords) WHERE keywords IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_vendor_category ON products(vendor_id, category_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_brand_price ON products(brand, price) WHERE brand IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_price ON products(category_id, price) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_featured_active ON products(is_featured, is_active, created_at DESC) WHERE is_featured = true AND is_active = true;

-- ================================
-- PART 6: TRIGGERS FOR AUTOMATION
-- ================================

-- Update stock timestamps automatically
CREATE OR REPLACE FUNCTION update_stock_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stock_last_updated when stock fields change
  IF (OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity OR
      OLD.reserved_stock IS DISTINCT FROM NEW.reserved_stock OR
      OLD.available_stock IS DISTINCT FROM NEW.available_stock OR
      OLD.total_stock IS DISTINCT FROM NEW.total_stock) THEN
    NEW.stock_last_updated = NOW();
  END IF;

  -- Auto-calculate available_stock if not explicitly set
  IF NEW.available_stock IS NULL OR NEW.available_stock = 0 THEN
    NEW.available_stock = GREATEST(0,
      COALESCE(NEW.total_stock, NEW.stock_quantity, 0) -
      COALESCE(NEW.reserved_stock, 0) -
      COALESCE(NEW.damaged_stock, 0)
    );
  END IF;

  -- Update product's updated_at timestamp
  NEW.updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for products table
DROP TRIGGER IF EXISTS trigger_update_stock_timestamp ON products;
CREATE TRIGGER trigger_update_stock_timestamp
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_timestamp();

-- Similar function for product_variants
CREATE OR REPLACE FUNCTION update_variant_stock_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update timestamps when stock fields change
  IF (OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity OR
      OLD.reserved_quantity IS DISTINCT FROM NEW.reserved_quantity) THEN
    NEW.updated_at = NOW();

    -- Update last restocked timestamp if stock increased
    IF NEW.stock_quantity > COALESCE(OLD.stock_quantity, 0) THEN
      NEW.last_restocked_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product_variants table
DROP TRIGGER IF EXISTS trigger_update_variant_stock_timestamp ON product_variants;
CREATE TRIGGER trigger_update_variant_stock_timestamp
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_stock_timestamp();

-- ================================
-- PART 7: VIEWS FOR COMMON QUERIES
-- ================================

-- Create view for products with comprehensive stock information
CREATE OR REPLACE VIEW products_with_stock AS
SELECT
  p.*,
  -- Stock calculations
  CASE
    WHEN p.available_stock > p.low_stock_threshold THEN 'in_stock'
    WHEN p.available_stock > 0 THEN 'low_stock'
    ELSE 'out_of_stock'
  END as stock_status_display,

  -- Stock health metrics
  CASE
    WHEN p.available_stock <= 0 THEN 'critical'
    WHEN p.available_stock <= p.reorder_point THEN 'warning'
    WHEN p.available_stock <= p.low_stock_threshold THEN 'low'
    ELSE 'healthy'
  END as stock_health,

  -- Variant aggregations
  v.variant_count,
  v.total_variant_stock,
  v.available_variant_stock,
  v.size_range,

  -- Category and vendor info
  c.name as category_name,
  c.slug as category_slug,
  u.name as vendor_name

FROM products p
LEFT JOIN (
  SELECT
    product_id,
    COUNT(*) as variant_count,
    SUM(stock_quantity) as total_variant_stock,
    SUM(computed_available_stock) as available_variant_stock,
    STRING_AGG(DISTINCT value, ', ' ORDER BY value) as size_range
  FROM product_variants
  WHERE is_active = true
  GROUP BY product_id
) v ON p.id = v.product_id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN users u ON p.vendor_id = u.id
WHERE p.is_active = true;

-- Create view for KicksDB sync status
CREATE OR REPLACE VIEW kicksdb_sync_status AS
SELECT
  p.id,
  p.name,
  p.brand,
  p.kicksdb_id,
  p.kicksdb_sku,
  p.sync_status,
  p.last_sync_at,
  p.sync_error,
  p.data_source,
  p.match_score,
  CASE
    WHEN p.kicksdb_id IS NOT NULL THEN 'linked'
    WHEN p.data_source = 'kicksdb' THEN 'imported'
    ELSE 'manual'
  END as kicksdb_relationship,

  -- Time since last sync
  CASE
    WHEN p.last_sync_at IS NULL THEN 'never'
    WHEN p.last_sync_at > NOW() - INTERVAL '1 hour' THEN 'recent'
    WHEN p.last_sync_at > NOW() - INTERVAL '1 day' THEN 'today'
    WHEN p.last_sync_at > NOW() - INTERVAL '1 week' THEN 'this_week'
    ELSE 'old'
  END as sync_freshness

FROM products p
WHERE p.is_active = true;

-- ================================
-- PART 8: FUNCTIONS FOR STOCK MANAGEMENT
-- ================================

-- Function to reserve stock
CREATE OR REPLACE FUNCTION reserve_product_stock(
  product_uuid UUID,
  quantity_to_reserve INTEGER,
  variant_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_available INTEGER;
  target_table TEXT;
  target_id UUID;
BEGIN
  -- Determine if we're working with product or variant
  IF variant_uuid IS NOT NULL THEN
    SELECT computed_available_stock INTO current_available
    FROM product_variants
    WHERE id = variant_uuid AND product_id = product_uuid;
    target_table := 'product_variants';
    target_id := variant_uuid;
  ELSE
    SELECT available_stock INTO current_available
    FROM products
    WHERE id = product_uuid;
    target_table := 'products';
    target_id := product_uuid;
  END IF;

  -- Check if we have enough stock
  IF current_available >= quantity_to_reserve THEN
    -- Reserve the stock
    IF target_table = 'product_variants' THEN
      UPDATE product_variants
      SET reserved_quantity = reserved_quantity + quantity_to_reserve
      WHERE id = target_id;
    ELSE
      UPDATE products
      SET reserved_stock = reserved_stock + quantity_to_reserve,
          available_stock = available_stock - quantity_to_reserve
      WHERE id = target_id;
    END IF;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to release reserved stock
CREATE OR REPLACE FUNCTION release_product_stock(
  product_uuid UUID,
  quantity_to_release INTEGER,
  variant_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  target_table TEXT;
  target_id UUID;
BEGIN
  -- Determine target
  IF variant_uuid IS NOT NULL THEN
    target_table := 'product_variants';
    target_id := variant_uuid;
  ELSE
    target_table := 'products';
    target_id := product_uuid;
  END IF;

  -- Release the stock
  IF target_table = 'product_variants' THEN
    UPDATE product_variants
    SET reserved_quantity = GREATEST(0, reserved_quantity - quantity_to_release)
    WHERE id = target_id;
  ELSE
    UPDATE products
    SET reserved_stock = GREATEST(0, reserved_stock - quantity_to_release),
        available_stock = available_stock + LEAST(reserved_stock, quantity_to_release)
    WHERE id = target_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- PART 9: COMMENTS AND DOCUMENTATION
-- ================================

-- Add table comments
COMMENT ON COLUMN products.kicksdb_id IS 'External ID from KicksDB API';
COMMENT ON COLUMN products.kicksdb_sku IS 'SKU from KicksDB API';
COMMENT ON COLUMN products.sync_status IS 'Current synchronization status with external APIs';
COMMENT ON COLUMN products.data_source IS 'Source of the product data (manual, kicksdb, imported, scraped)';
COMMENT ON COLUMN products.match_score IS 'Confidence score for data matching (0-100)';
COMMENT ON COLUMN products.available_stock IS 'Stock available for sale (total - reserved - damaged)';
COMMENT ON COLUMN products.reserved_stock IS 'Stock reserved for pending orders';
COMMENT ON COLUMN products.computed_stock_status IS 'Auto-calculated stock status based on availability';
COMMENT ON COLUMN products.external_links IS 'JSON object containing links to external marketplaces';
COMMENT ON COLUMN products.original_image_urls IS 'Original image URLs before optimization';

COMMENT ON COLUMN product_variants.computed_available_stock IS 'Auto-calculated available stock (total - reserved - damaged)';
COMMENT ON COLUMN product_variants.variant_type IS 'Type of variant (size, color, material, style)';
COMMENT ON COLUMN product_variants.availability_status IS 'Current availability status of this variant';
COMMENT ON COLUMN product_variants.dimensions IS 'JSON object with length, width, height in cm';

-- ================================
-- PART 10: SAMPLE DATA UPDATE
-- ================================

-- Update existing products with KicksDB-style defaults
UPDATE products
SET
  sync_status = 'pending',
  data_source = 'manual',
  available_stock = GREATEST(0, stock_quantity - COALESCE(reserved_stock, 0)),
  total_stock = stock_quantity,
  stock_last_updated = NOW(),
  stock_tracking_enabled = true,
  external_links = '{}',
  metadata = '{}',
  tags = ARRAY[]::TEXT[],
  keywords = ARRAY[]::TEXT[]
WHERE sync_status IS NULL OR data_source IS NULL;

-- Update existing variants with defaults
UPDATE product_variants
SET
  variant_type = 'size',
  availability_status = CASE
    WHEN stock_quantity > 0 THEN 'available'
    ELSE 'sold_out'
  END,
  reserved_quantity = 0,
  damage_quantity = 0,
  variant_order = 0,
  variant_images = '[]',
  dimensions = '{}'
WHERE variant_type IS NULL;

-- ================================
-- MIGRATION COMPLETE
-- ================================

-- Add migration success log
INSERT INTO _migrations_log (migration_name, applied_at, description)
VALUES (
  '005_enhance_products_table_for_kicksdb',
  NOW(),
  'Enhanced products table for KicksDB API integration with improved stock tracking, variant support, and metadata columns'
) ON CONFLICT DO NOTHING;