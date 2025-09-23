-- Migration: Create Comprehensive Stock Management System
-- Version: 003
-- Description: Creates complete stock tracking, movements, reservations, and alerts

-- =====================================================
-- BACKUP EXISTING STOCK DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS stock_levels_backup_003 AS
SELECT * FROM stock_levels WHERE EXISTS (SELECT 1 FROM stock_levels LIMIT 1);

CREATE TABLE IF NOT EXISTS stock_movements_backup_003 AS
SELECT * FROM stock_movements WHERE EXISTS (SELECT 1 FROM stock_movements LIMIT 1);

-- Drop existing tables to rebuild
DROP TABLE IF EXISTS stock_alerts CASCADE;
DROP TABLE IF EXISTS stock_reservations CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS stock_levels CASCADE;

-- =====================================================
-- CREATE STOCK LEVELS TABLE
-- =====================================================

CREATE TABLE stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Product identification
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,

    -- Location information (for multi-warehouse support)
    location_id UUID,
    location_name TEXT DEFAULT 'main',
    location_type TEXT DEFAULT 'warehouse' CHECK (location_type IN ('warehouse', 'store', 'dropship', 'vendor')),

    -- Stock quantities
    quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    quantity_incoming INTEGER NOT NULL DEFAULT 0 CHECK (quantity_incoming >= 0),

    -- Reorder information
    reorder_point INTEGER DEFAULT 10,
    reorder_quantity INTEGER DEFAULT 50,
    maximum_stock INTEGER DEFAULT 500,

    -- Cost tracking
    average_cost DECIMAL(10, 2) DEFAULT 0.00,
    last_cost DECIMAL(10, 2) DEFAULT 0.00,
    total_value DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_on_hand * average_cost) STORED,

    -- Stock status
    is_tracked BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    allow_backorder BOOLEAN DEFAULT FALSE,
    backorder_quantity INTEGER DEFAULT 0,

    -- Dates and tracking
    last_restock_date TIMESTAMP WITH TIME ZONE,
    last_sale_date TIMESTAMP WITH TIME ZONE,
    last_count_date TIMESTAMP WITH TIME ZONE,
    next_restock_date DATE,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique stock level per product/variant/location
    UNIQUE NULLS NOT DISTINCT (product_id, variant_id, location_id)
);

-- Create indexes
CREATE INDEX idx_stock_levels_product_id ON stock_levels(product_id);
CREATE INDEX idx_stock_levels_variant_id ON stock_levels(variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX idx_stock_levels_location_id ON stock_levels(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_stock_levels_quantity_available ON stock_levels(quantity_available);
CREATE INDEX idx_stock_levels_reorder_point ON stock_levels(quantity_available, reorder_point) WHERE is_active = TRUE;

-- =====================================================
-- CREATE STOCK MOVEMENTS TABLE
-- =====================================================

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Product identification
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
    stock_level_id UUID REFERENCES stock_levels(id) ON DELETE RESTRICT,

    -- Movement details
    movement_type TEXT NOT NULL CHECK (movement_type IN (
        'purchase', 'sale', 'return', 'adjustment',
        'transfer_in', 'transfer_out', 'damage', 'loss',
        'production', 'assembly', 'disassembly', 'count'
    )),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * COALESCE(unit_cost, 0)) STORED,

    -- Reference information
    reference_type TEXT CHECK (reference_type IN ('order', 'purchase_order', 'transfer', 'adjustment', 'return', 'count')),
    reference_id UUID,
    reference_number TEXT,

    -- Stock values before and after
    quantity_before INTEGER,
    quantity_after INTEGER,
    cost_before DECIMAL(10, 2),
    cost_after DECIMAL(10, 2),

    -- Location information
    from_location_id UUID,
    to_location_id UUID,

    -- User and reason
    performed_by UUID REFERENCES users(id),
    reason TEXT,
    notes TEXT,

    -- Status and tracking
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    is_reversed BOOLEAN DEFAULT FALSE,
    reversed_by UUID REFERENCES stock_movements(id),

    -- Timestamps
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_variant_id ON stock_movements(variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX idx_stock_movements_stock_level_id ON stock_movements(stock_level_id);
CREATE INDEX idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_stock_movements_movement_date ON stock_movements(movement_date);
CREATE INDEX idx_stock_movements_status ON stock_movements(status);

-- =====================================================
-- CREATE STOCK RESERVATIONS TABLE
-- =====================================================

CREATE TABLE stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Product identification
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    stock_level_id UUID REFERENCES stock_levels(id) ON DELETE CASCADE,

    -- Reservation details
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reservation_type TEXT NOT NULL CHECK (reservation_type IN ('cart', 'order', 'transfer', 'hold', 'quote')),

    -- Reference information
    reference_id UUID,
    reference_number TEXT,
    user_id UUID REFERENCES users(id),
    session_id TEXT,

    -- Status and expiry
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'cancelled', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_stock_reservations_product_id ON stock_reservations(product_id);
CREATE INDEX idx_stock_reservations_variant_id ON stock_reservations(variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX idx_stock_reservations_stock_level_id ON stock_reservations(stock_level_id);
CREATE INDEX idx_stock_reservations_reference ON stock_reservations(reservation_type, reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_stock_reservations_user_id ON stock_reservations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_stock_reservations_session_id ON stock_reservations(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_stock_reservations_status ON stock_reservations(status);
CREATE INDEX idx_stock_reservations_expires_at ON stock_reservations(expires_at) WHERE status = 'active';

-- =====================================================
-- CREATE STOCK ALERTS TABLE
-- =====================================================

CREATE TABLE stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Product identification
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    stock_level_id UUID REFERENCES stock_levels(id) ON DELETE CASCADE,

    -- Alert configuration
    alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock', 'reorder_point', 'expiry')),
    threshold_value INTEGER,
    current_value INTEGER,

    -- Alert status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'snoozed', 'disabled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

    -- Notification settings
    notify_email BOOLEAN DEFAULT TRUE,
    notify_sms BOOLEAN DEFAULT FALSE,
    notify_webhook BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    notification_recipients TEXT[],

    -- Resolution tracking
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,

    -- Snooze settings
    snoozed_until TIMESTAMP WITH TIME ZONE,
    snooze_count INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate active alerts
    UNIQUE NULLS NOT DISTINCT (product_id, variant_id, alert_type, status)
        WHERE status IN ('active', 'snoozed')
);

-- Create indexes
CREATE INDEX idx_stock_alerts_product_id ON stock_alerts(product_id);
CREATE INDEX idx_stock_alerts_variant_id ON stock_alerts(variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX idx_stock_alerts_stock_level_id ON stock_alerts(stock_level_id);
CREATE INDEX idx_stock_alerts_alert_type ON stock_alerts(alert_type);
CREATE INDEX idx_stock_alerts_status ON stock_alerts(status);
CREATE INDEX idx_stock_alerts_priority ON stock_alerts(priority) WHERE status = 'active';

-- =====================================================
-- CREATE STOCK AUDIT LOG TABLE
-- =====================================================

CREATE TABLE stock_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Audit information
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),

    -- Data changes
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],

    -- User and context
    performed_by UUID,
    ip_address INET,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_stock_audit_log_table_record ON stock_audit_log(table_name, record_id);
CREATE INDEX idx_stock_audit_log_action ON stock_audit_log(action);
CREATE INDEX idx_stock_audit_log_performed_by ON stock_audit_log(performed_by) WHERE performed_by IS NOT NULL;
CREATE INDEX idx_stock_audit_log_created_at ON stock_audit_log(created_at);

-- =====================================================
-- CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Function to update stock levels after movement
CREATE OR REPLACE FUNCTION process_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        -- Update stock level based on movement type
        IF NEW.movement_type IN ('purchase', 'return', 'transfer_in', 'production', 'adjustment') THEN
            UPDATE stock_levels
            SET quantity_on_hand = quantity_on_hand + NEW.quantity,
                last_restock_date = CASE
                    WHEN NEW.movement_type = 'purchase' THEN NOW()
                    ELSE last_restock_date
                END
            WHERE id = NEW.stock_level_id;
        ELSIF NEW.movement_type IN ('sale', 'transfer_out', 'damage', 'loss') THEN
            UPDATE stock_levels
            SET quantity_on_hand = quantity_on_hand - NEW.quantity,
                last_sale_date = CASE
                    WHEN NEW.movement_type = 'sale' THEN NOW()
                    ELSE last_sale_date
                END
            WHERE id = NEW.stock_level_id
            AND quantity_on_hand >= NEW.quantity;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Insufficient stock for movement';
            END IF;
        END IF;

        -- Record the stock levels after movement
        UPDATE stock_movements
        SET quantity_after = (
            SELECT quantity_on_hand FROM stock_levels WHERE id = NEW.stock_level_id
        )
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to process stock reservations
CREATE OR REPLACE FUNCTION process_stock_reservation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        -- Reserve stock
        UPDATE stock_levels
        SET quantity_reserved = quantity_reserved + NEW.quantity
        WHERE id = NEW.stock_level_id
        AND quantity_on_hand - quantity_reserved >= NEW.quantity;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Insufficient stock for reservation';
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'active' AND NEW.status IN ('confirmed', 'cancelled', 'expired') THEN
            -- Release reservation
            UPDATE stock_levels
            SET quantity_reserved = GREATEST(0, quantity_reserved - OLD.quantity)
            WHERE id = OLD.stock_level_id;

            -- Update timestamp
            IF NEW.status = 'confirmed' THEN
                NEW.confirmed_at = NOW();
            ELSIF NEW.status = 'cancelled' THEN
                NEW.cancelled_at = NOW();
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check and create stock alerts
CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for low stock
    IF NEW.quantity_available <= NEW.reorder_point AND NEW.quantity_available > 0 THEN
        INSERT INTO stock_alerts (
            product_id, variant_id, stock_level_id,
            alert_type, threshold_value, current_value, priority
        )
        VALUES (
            NEW.product_id, NEW.variant_id, NEW.id,
            'low_stock', NEW.reorder_point, NEW.quantity_available, 'high'
        )
        ON CONFLICT (product_id, variant_id, alert_type, status)
        WHERE status IN ('active', 'snoozed')
        DO UPDATE SET
            current_value = EXCLUDED.current_value,
            updated_at = NOW();

    -- Check for out of stock
    ELSIF NEW.quantity_available = 0 THEN
        INSERT INTO stock_alerts (
            product_id, variant_id, stock_level_id,
            alert_type, threshold_value, current_value, priority
        )
        VALUES (
            NEW.product_id, NEW.variant_id, NEW.id,
            'out_of_stock', 0, 0, 'critical'
        )
        ON CONFLICT (product_id, variant_id, alert_type, status)
        WHERE status IN ('active', 'snoozed')
        DO UPDATE SET
            priority = 'critical',
            updated_at = NOW();

    -- Resolve alerts if stock is replenished
    ELSIF NEW.quantity_available > NEW.reorder_point THEN
        UPDATE stock_alerts
        SET status = 'resolved',
            resolved_at = NOW(),
            resolution_notes = 'Stock replenished'
        WHERE stock_level_id = NEW.id
        AND status IN ('active', 'acknowledged')
        AND alert_type IN ('low_stock', 'out_of_stock');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_stock_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to expire old reservations
CREATE OR REPLACE FUNCTION expire_stock_reservations()
RETURNS void AS $$
BEGIN
    UPDATE stock_reservations
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Stock movement trigger
DROP TRIGGER IF EXISTS trigger_process_stock_movement ON stock_movements;
CREATE TRIGGER trigger_process_stock_movement
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION process_stock_movement();

-- Stock reservation triggers
DROP TRIGGER IF EXISTS trigger_process_stock_reservation ON stock_reservations;
CREATE TRIGGER trigger_process_stock_reservation
    AFTER INSERT OR UPDATE ON stock_reservations
    FOR EACH ROW
    EXECUTE FUNCTION process_stock_reservation();

-- Stock alert trigger
DROP TRIGGER IF EXISTS trigger_check_stock_alerts ON stock_levels;
CREATE TRIGGER trigger_check_stock_alerts
    AFTER UPDATE OF quantity_on_hand, quantity_reserved ON stock_levels
    FOR EACH ROW
    EXECUTE FUNCTION check_stock_alerts();

-- Update timestamp triggers
DROP TRIGGER IF EXISTS trigger_update_stock_levels_timestamp ON stock_levels;
CREATE TRIGGER trigger_update_stock_levels_timestamp
    BEFORE UPDATE ON stock_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_timestamp();

DROP TRIGGER IF EXISTS trigger_update_stock_reservations_timestamp ON stock_reservations;
CREATE TRIGGER trigger_update_stock_reservations_timestamp
    BEFORE UPDATE ON stock_reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_timestamp();

DROP TRIGGER IF EXISTS trigger_update_stock_alerts_timestamp ON stock_alerts;
CREATE TRIGGER trigger_update_stock_alerts_timestamp
    BEFORE UPDATE ON stock_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_timestamp();

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get available stock
CREATE OR REPLACE FUNCTION get_available_stock(p_product_id UUID, p_variant_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    v_available INTEGER;
BEGIN
    SELECT COALESCE(SUM(quantity_available), 0)
    INTO v_available
    FROM stock_levels
    WHERE product_id = p_product_id
    AND (p_variant_id IS NULL OR variant_id = p_variant_id)
    AND is_active = TRUE;

    RETURN v_available;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve stock
CREATE OR REPLACE FUNCTION reserve_stock(
    p_product_id UUID,
    p_quantity INTEGER,
    p_reference_type TEXT,
    p_reference_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_variant_id UUID DEFAULT NULL,
    p_expires_minutes INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
    v_stock_level_id UUID;
    v_reservation_id UUID;
BEGIN
    -- Find stock level with enough availability
    SELECT id INTO v_stock_level_id
    FROM stock_levels
    WHERE product_id = p_product_id
    AND (p_variant_id IS NULL OR variant_id = p_variant_id)
    AND quantity_available >= p_quantity
    AND is_active = TRUE
    ORDER BY location_type = 'warehouse' DESC, quantity_available DESC
    LIMIT 1
    FOR UPDATE;

    IF v_stock_level_id IS NULL THEN
        RAISE EXCEPTION 'Insufficient stock available';
    END IF;

    -- Create reservation
    INSERT INTO stock_reservations (
        product_id, variant_id, stock_level_id,
        quantity, reservation_type, reference_id,
        user_id, expires_at
    )
    VALUES (
        p_product_id, p_variant_id, v_stock_level_id,
        p_quantity, p_reference_type, p_reference_id,
        p_user_id, NOW() + (p_expires_minutes || ' minutes')::INTERVAL
    )
    RETURNING id INTO v_reservation_id;

    RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_audit_log ENABLE ROW LEVEL SECURITY;

-- Stock levels - public can view, vendors manage own, admins all
CREATE POLICY stock_levels_public_view ON stock_levels
    FOR SELECT
    USING (TRUE);

CREATE POLICY stock_levels_vendor_policy ON stock_levels
    FOR ALL
    USING (
        product_id IN (
            SELECT id FROM products
            WHERE vendor_id IN (
                SELECT vendor_id FROM users
                WHERE id = auth.uid() AND is_vendor = TRUE
            )
        )
    );

CREATE POLICY stock_levels_admin_policy ON stock_levels
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Stock movements - similar policies
CREATE POLICY stock_movements_vendor_view ON stock_movements
    FOR SELECT
    USING (
        product_id IN (
            SELECT id FROM products
            WHERE vendor_id IN (
                SELECT vendor_id FROM users
                WHERE id = auth.uid() AND is_vendor = TRUE
            )
        )
    );

CREATE POLICY stock_movements_admin_policy ON stock_movements
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Stock reservations - users can view own, vendors/admins all
CREATE POLICY stock_reservations_user_policy ON stock_reservations
    FOR SELECT
    USING (user_id = auth.uid() OR session_id = current_setting('app.session_id', TRUE));

CREATE POLICY stock_reservations_vendor_policy ON stock_reservations
    FOR ALL
    USING (
        product_id IN (
            SELECT id FROM products
            WHERE vendor_id IN (
                SELECT vendor_id FROM users
                WHERE id = auth.uid() AND is_vendor = TRUE
            )
        )
    );

CREATE POLICY stock_reservations_admin_policy ON stock_reservations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Stock alerts - vendors see own, admins all
CREATE POLICY stock_alerts_vendor_policy ON stock_alerts
    FOR ALL
    USING (
        product_id IN (
            SELECT id FROM products
            WHERE vendor_id IN (
                SELECT vendor_id FROM users
                WHERE id = auth.uid() AND is_vendor = TRUE
            )
        )
    );

CREATE POLICY stock_alerts_admin_policy ON stock_alerts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Audit log - admins only
CREATE POLICY stock_audit_log_admin_policy ON stock_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- INITIALIZE STOCK LEVELS FOR EXISTING PRODUCTS
-- =====================================================

-- Create stock levels for existing products
INSERT INTO stock_levels (product_id, quantity_on_hand, quantity_reserved)
SELECT
    id,
    COALESCE(total_quantity, 0),
    COALESCE(reserved_quantity, 0)
FROM products
WHERE NOT EXISTS (
    SELECT 1 FROM stock_levels
    WHERE stock_levels.product_id = products.id
)
ON CONFLICT DO NOTHING;

-- Create stock levels for existing sneakers (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sneakers') THEN
        INSERT INTO stock_levels (
            product_id,
            quantity_on_hand,
            notes
        )
        SELECT
            id,
            CASE WHEN in_stock THEN 10 ELSE 0 END,
            'Migrated from sneakers table'
        FROM sneakers
        WHERE NOT EXISTS (
            SELECT 1 FROM stock_levels
            WHERE stock_levels.product_id = sneakers.id
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- CREATE SCHEDULED JOB FOR RESERVATION EXPIRY
-- =====================================================

-- Note: This would typically be handled by a cron job or external service
-- Example for pg_cron extension (if available):
/*
SELECT cron.schedule(
    'expire-stock-reservations',
    '*/5 * * * *', -- Every 5 minutes
    'SELECT expire_stock_reservations();'
);
*/

-- =====================================================
-- ROLLBACK SCRIPT
-- =====================================================

/*
-- To rollback this migration:

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_process_stock_movement ON stock_movements;
DROP TRIGGER IF EXISTS trigger_process_stock_reservation ON stock_reservations;
DROP TRIGGER IF EXISTS trigger_check_stock_alerts ON stock_levels;
DROP TRIGGER IF EXISTS trigger_update_stock_levels_timestamp ON stock_levels;
DROP TRIGGER IF EXISTS trigger_update_stock_reservations_timestamp ON stock_reservations;
DROP TRIGGER IF EXISTS trigger_update_stock_alerts_timestamp ON stock_alerts;

-- Drop functions
DROP FUNCTION IF EXISTS process_stock_movement();
DROP FUNCTION IF EXISTS process_stock_reservation();
DROP FUNCTION IF EXISTS check_stock_alerts();
DROP FUNCTION IF EXISTS update_stock_timestamp();
DROP FUNCTION IF EXISTS expire_stock_reservations();
DROP FUNCTION IF EXISTS get_available_stock(UUID, UUID);
DROP FUNCTION IF EXISTS reserve_stock(UUID, INTEGER, TEXT, UUID, UUID, UUID, INTEGER);

-- Drop policies
DROP POLICY IF EXISTS stock_levels_public_view ON stock_levels;
DROP POLICY IF EXISTS stock_levels_vendor_policy ON stock_levels;
DROP POLICY IF EXISTS stock_levels_admin_policy ON stock_levels;
DROP POLICY IF EXISTS stock_movements_vendor_view ON stock_movements;
DROP POLICY IF EXISTS stock_movements_admin_policy ON stock_movements;
DROP POLICY IF EXISTS stock_reservations_user_policy ON stock_reservations;
DROP POLICY IF EXISTS stock_reservations_vendor_policy ON stock_reservations;
DROP POLICY IF EXISTS stock_reservations_admin_policy ON stock_reservations;
DROP POLICY IF EXISTS stock_alerts_vendor_policy ON stock_alerts;
DROP POLICY IF EXISTS stock_alerts_admin_policy ON stock_alerts;
DROP POLICY IF EXISTS stock_audit_log_admin_policy ON stock_audit_log;

-- Drop tables
DROP TABLE IF EXISTS stock_audit_log CASCADE;
DROP TABLE IF EXISTS stock_alerts CASCADE;
DROP TABLE IF EXISTS stock_reservations CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS stock_levels CASCADE;

-- Restore from backup
CREATE TABLE stock_levels AS SELECT * FROM stock_levels_backup_003;
CREATE TABLE stock_movements AS SELECT * FROM stock_movements_backup_003;

-- Drop backups
DROP TABLE IF EXISTS stock_levels_backup_003;
DROP TABLE IF EXISTS stock_movements_backup_003;
*/