-- Migration: Add Reservation System Constraints and Triggers
-- This migration adds constraints, indexes, and triggers to ensure data integrity
-- and prevent race conditions in the stock reservation system.

-- 1. Add constraints to prevent invalid reservations
ALTER TABLE stock_reservations
ADD CONSTRAINT chk_positive_quantity CHECK (quantity > 0),
ADD CONSTRAINT chk_valid_expiration CHECK (expires_at > created_at),
ADD CONSTRAINT chk_valid_status CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'confirmed'));

-- 2. Add partial unique index to prevent double-reservations for the same item
-- (Only active reservations should be unique per user/session + product/variant)
CREATE UNIQUE INDEX idx_active_reservation_per_user_product
ON stock_reservations (user_id, product_id, variant_id, status)
WHERE status = 'active' AND user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_active_reservation_per_session_product
ON stock_reservations (session_id, product_id, variant_id, status)
WHERE status = 'active' AND session_id IS NOT NULL AND user_id IS NULL;

-- 3. Add performance indexes for common queries
CREATE INDEX idx_stock_reservations_expires_at ON stock_reservations(expires_at) WHERE status = 'active';
CREATE INDEX idx_stock_reservations_product_variant ON stock_reservations(product_id, variant_id) WHERE status = 'active';
CREATE INDEX idx_stock_reservations_user_active ON stock_reservations(user_id) WHERE status = 'active' AND user_id IS NOT NULL;
CREATE INDEX idx_stock_reservations_session_active ON stock_reservations(session_id) WHERE status = 'active' AND session_id IS NOT NULL;

-- 4. Add constraints to stock_levels to ensure consistency
ALTER TABLE stock_levels
ADD CONSTRAINT chk_non_negative_quantities CHECK (
  quantity_on_hand >= 0 AND
  quantity_reserved >= 0 AND
  quantity_available >= 0 AND
  quantity_available = quantity_on_hand - quantity_reserved
);

-- 5. Create trigger function to update stock levels when reservations change
CREATE OR REPLACE FUNCTION update_stock_level_on_reservation_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (new reservation)
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'active' THEN
      UPDATE stock_levels
      SET
        quantity_reserved = quantity_reserved + NEW.quantity,
        quantity_available = quantity_on_hand - (quantity_reserved + NEW.quantity),
        updated_at = NOW()
      WHERE (
        (NEW.variant_id IS NOT NULL AND id = (
          SELECT id FROM stock_levels
          WHERE product_id = NEW.product_id AND variant_id = NEW.variant_id AND is_active = true
          LIMIT 1
        )) OR
        (NEW.variant_id IS NULL AND id = (
          SELECT id FROM stock_levels
          WHERE product_id = NEW.product_id AND variant_id IS NULL AND is_active = true
          LIMIT 1
        ))
      );
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE (status change)
  IF TG_OP = 'UPDATE' THEN
    -- If status changed from active to something else, decrease reserved quantity
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE stock_levels
      SET
        quantity_reserved = quantity_reserved - OLD.quantity,
        quantity_available = quantity_on_hand - (quantity_reserved - OLD.quantity),
        updated_at = NOW()
      WHERE (
        (OLD.variant_id IS NOT NULL AND id = (
          SELECT id FROM stock_levels
          WHERE product_id = OLD.product_id AND variant_id = OLD.variant_id AND is_active = true
          LIMIT 1
        )) OR
        (OLD.variant_id IS NULL AND id = (
          SELECT id FROM stock_levels
          WHERE product_id = OLD.product_id AND variant_id IS NULL AND is_active = true
          LIMIT 1
        ))
      );
    END IF;

    -- If status changed to active from something else, increase reserved quantity
    IF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE stock_levels
      SET
        quantity_reserved = quantity_reserved + NEW.quantity,
        quantity_available = quantity_on_hand - (quantity_reserved + NEW.quantity),
        updated_at = NOW()
      WHERE (
        (NEW.variant_id IS NOT NULL AND id = (
          SELECT id FROM stock_levels
          WHERE product_id = NEW.product_id AND variant_id = NEW.variant_id AND is_active = true
          LIMIT 1
        )) OR
        (NEW.variant_id IS NULL AND id = (
          SELECT id FROM stock_levels
          WHERE product_id = NEW.product_id AND variant_id IS NULL AND is_active = true
          LIMIT 1
        ))
      );
    END IF;

    RETURN NEW;
  END IF;

  -- Handle DELETE (reservation deleted)
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'active' THEN
      UPDATE stock_levels
      SET
        quantity_reserved = quantity_reserved - OLD.quantity,
        quantity_available = quantity_on_hand - (quantity_reserved - OLD.quantity),
        updated_at = NOW()
      WHERE (
        (OLD.variant_id IS NOT NULL AND id = (
          SELECT id FROM stock_levels
          WHERE product_id = OLD.product_id AND variant_id = OLD.variant_id AND is_active = true
          LIMIT 1
        )) OR
        (OLD.variant_id IS NULL AND id = (
          SELECT id FROM stock_levels
          WHERE product_id = OLD.product_id AND variant_id IS NULL AND is_active = true
          LIMIT 1
        ))
      );
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Create the trigger
DROP TRIGGER IF EXISTS tr_stock_reservation_changes ON stock_reservations;
CREATE TRIGGER tr_stock_reservation_changes
  AFTER INSERT OR UPDATE OR DELETE ON stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_level_on_reservation_change();

-- 7. Create function to prevent overselling through reservations
CREATE OR REPLACE FUNCTION prevent_reservation_overselling()
RETURNS TRIGGER AS $$
DECLARE
  available_stock INTEGER;
  stock_level_id UUID;
BEGIN
  -- Only check for active reservations
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;

  -- Find the relevant stock level
  SELECT id, quantity_available INTO stock_level_id, available_stock
  FROM stock_levels
  WHERE product_id = NEW.product_id
    AND (
      (NEW.variant_id IS NOT NULL AND variant_id = NEW.variant_id) OR
      (NEW.variant_id IS NULL AND variant_id IS NULL)
    )
    AND is_active = true
  LIMIT 1;

  -- Check if we have enough stock available
  IF available_stock IS NULL THEN
    RAISE EXCEPTION 'No stock level found for product % variant %', NEW.product_id, NEW.variant_id;
  END IF;

  IF available_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock: requested %, available %', NEW.quantity, available_stock;
  END IF;

  -- Update the stock_level_id in the reservation for reference
  NEW.stock_level_id := stock_level_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create the overselling prevention trigger (fires BEFORE insert/update)
DROP TRIGGER IF EXISTS tr_prevent_reservation_overselling ON stock_reservations;
CREATE TRIGGER tr_prevent_reservation_overselling
  BEFORE INSERT OR UPDATE ON stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_reservation_overselling();

-- 9. Create function to auto-expire reservations
CREATE OR REPLACE FUNCTION auto_expire_reservations()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically expire reservations that are past their expiration time
  UPDATE stock_reservations
  SET
    status = 'expired',
    expired_at = NOW(),
    updated_at = NOW()
  WHERE status = 'active'
    AND expires_at < NOW();

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to auto-expire on stock_reservations queries
-- Note: This is a basic approach. In production, you'd want a proper background job
DROP TRIGGER IF EXISTS tr_auto_expire_reservations ON stock_reservations;
CREATE TRIGGER tr_auto_expire_reservations
  BEFORE SELECT ON stock_reservations
  FOR EACH STATEMENT
  EXECUTE FUNCTION auto_expire_reservations();

-- 11. Add constraint to ensure stock movements are properly tracked
ALTER TABLE stock_movements
ADD CONSTRAINT chk_valid_movement_type CHECK (
  movement_type IN ('adjustment', 'sale', 'return', 'transfer', 'damaged', 'reservation')
),
ADD CONSTRAINT chk_valid_reference_type CHECK (
  reference_type IN ('order', 'return', 'adjustment', 'transfer', 'reservation', 'manual')
);

-- 12. Create index for better stock movement queries
CREATE INDEX idx_stock_movements_product_variant ON stock_movements(product_id, variant_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);

-- 13. Create function to log reservation activities for audit trail
CREATE OR REPLACE FUNCTION log_reservation_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log reservation status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO stock_movements (
      product_id,
      variant_id,
      movement_type,
      quantity,
      reason,
      reference_type,
      reference_id,
      reference_number,
      notes
    ) VALUES (
      NEW.product_id,
      NEW.variant_id,
      'reservation',
      CASE
        WHEN NEW.status = 'active' THEN -NEW.quantity
        WHEN OLD.status = 'active' THEN NEW.quantity
        ELSE 0
      END,
      CASE
        WHEN NEW.status = 'active' THEN 'reservation_created'
        WHEN NEW.status = 'expired' THEN 'reservation_expired'
        WHEN NEW.status = 'cancelled' THEN 'reservation_cancelled'
        WHEN NEW.status = 'confirmed' THEN 'reservation_confirmed'
        ELSE 'reservation_status_change'
      END,
      'reservation',
      NEW.id,
      NEW.reference_id,
      'Status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;

  -- Log new reservations
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    INSERT INTO stock_movements (
      product_id,
      variant_id,
      movement_type,
      quantity,
      reason,
      reference_type,
      reference_id,
      notes
    ) VALUES (
      NEW.product_id,
      NEW.variant_id,
      'reservation',
      -NEW.quantity,
      'reservation_created',
      'reservation',
      NEW.id,
      'New reservation created'
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 14. Create the audit logging trigger
DROP TRIGGER IF EXISTS tr_log_reservation_activity ON stock_reservations;
CREATE TRIGGER tr_log_reservation_activity
  AFTER INSERT OR UPDATE ON stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION log_reservation_activity();

-- 15. Add row-level security policies for reservations
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to see their own reservations
CREATE POLICY "Users can view their own reservations" ON stock_reservations
  FOR SELECT USING (auth.uid()::text = user_id OR user_id IS NULL);

-- Policy for authenticated users to create reservations
CREATE POLICY "Users can create reservations" ON stock_reservations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);

-- Policy for authenticated users to update their own reservations
CREATE POLICY "Users can update their own reservations" ON stock_reservations
  FOR UPDATE USING (auth.uid()::text = user_id OR user_id IS NULL);

-- Policy for service role to have full access (for cleanup and admin operations)
CREATE POLICY "Service role has full access" ON stock_reservations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 16. Create helpful views for monitoring
CREATE OR REPLACE VIEW reservation_summary AS
SELECT
  product_id,
  variant_id,
  status,
  COUNT(*) as count,
  SUM(quantity) as total_quantity,
  MIN(created_at) as earliest_created,
  MAX(expires_at) as latest_expiry
FROM stock_reservations
GROUP BY product_id, variant_id, status;

CREATE OR REPLACE VIEW expired_reservations_needing_cleanup AS
SELECT
  id,
  product_id,
  variant_id,
  quantity,
  expires_at,
  (NOW() - expires_at) as overdue_by
FROM stock_reservations
WHERE status = 'active' AND expires_at < NOW()
ORDER BY expires_at ASC;

-- 17. Grant necessary permissions
GRANT SELECT ON reservation_summary TO authenticated, anon;
GRANT SELECT ON expired_reservations_needing_cleanup TO authenticated, anon;

-- 18. Add comments for documentation
COMMENT ON TABLE stock_reservations IS 'Tracks temporary stock reservations to prevent race conditions during checkout';
COMMENT ON COLUMN stock_reservations.expires_at IS 'Automatic expiration time for the reservation';
COMMENT ON COLUMN stock_reservations.stock_level_id IS 'Links to the specific stock level being reserved';
COMMENT ON FUNCTION update_stock_level_on_reservation_change() IS 'Automatically updates stock level quantities when reservations change';
COMMENT ON FUNCTION prevent_reservation_overselling() IS 'Prevents creating reservations that would exceed available stock';
COMMENT ON VIEW reservation_summary IS 'Summary view of all reservations grouped by product and status';
COMMENT ON VIEW expired_reservations_needing_cleanup IS 'Shows reservations that have expired and need cleanup';

-- 19. Create a function to validate stock consistency
CREATE OR REPLACE FUNCTION validate_stock_consistency()
RETURNS TABLE(
  stock_level_id UUID,
  product_id UUID,
  variant_id UUID,
  calculated_reserved INTEGER,
  actual_reserved INTEGER,
  difference INTEGER,
  is_consistent BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sl.id as stock_level_id,
    sl.product_id,
    sl.variant_id,
    COALESCE(SUM(sr.quantity), 0)::INTEGER as calculated_reserved,
    sl.quantity_reserved::INTEGER as actual_reserved,
    (sl.quantity_reserved - COALESCE(SUM(sr.quantity), 0))::INTEGER as difference,
    (sl.quantity_reserved = COALESCE(SUM(sr.quantity), 0)) as is_consistent
  FROM stock_levels sl
  LEFT JOIN stock_reservations sr ON (
    sr.product_id = sl.product_id
    AND (sr.variant_id = sl.variant_id OR (sr.variant_id IS NULL AND sl.variant_id IS NULL))
    AND sr.status = 'active'
  )
  WHERE sl.is_active = true
  GROUP BY sl.id, sl.product_id, sl.variant_id, sl.quantity_reserved
  ORDER BY is_consistent ASC, sl.product_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_stock_consistency() IS 'Validates that reserved quantities in stock_levels match active reservations';

-- Final notification
SELECT 'Stock reservation system constraints, triggers, and integrity checks have been successfully added!' as message;