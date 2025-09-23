-- Migration 006: Add Missing Stock Update Functions
-- Purpose: Add the missing update_variant_stock RPC function and improve atomic stock operations

-- ================================
-- CREATE UPDATE_VARIANT_STOCK FUNCTION
-- ================================

-- This function provides atomic stock updates for product variants
-- Used by the order creation system to decrease stock when orders are completed
CREATE OR REPLACE FUNCTION update_variant_stock(
  variant_id UUID,
  quantity_change INTEGER
)
RETURNS JSONB AS $$
DECLARE
  variant_record RECORD;
  movement_id UUID;
  stock_level_record RECORD;
BEGIN
  -- Start transaction (function is already in a transaction context)

  -- Lock the variant row to prevent race conditions
  SELECT
    id,
    product_id,
    stock_quantity,
    reserved_quantity,
    computed_available_stock
  INTO variant_record
  FROM product_variants
  WHERE id = variant_id
  FOR UPDATE;

  -- Check if variant exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Variant not found',
      'variant_id', variant_id
    );
  END IF;

  -- Calculate new stock quantity
  DECLARE
    new_stock_quantity INTEGER;
    previous_stock INTEGER;
  BEGIN
    previous_stock := variant_record.stock_quantity;
    new_stock_quantity := previous_stock + quantity_change;

    -- Prevent negative stock
    IF new_stock_quantity < 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient stock',
        'current_stock', previous_stock,
        'requested_change', quantity_change,
        'would_result_in', new_stock_quantity
      );
    END IF;

    -- Update the variant stock
    UPDATE product_variants
    SET
      stock_quantity = new_stock_quantity,
      updated_at = NOW()
    WHERE id = variant_id;

    -- Create stock movement record for audit trail
    INSERT INTO stock_movements (
      product_id,
      variant_id,
      movement_type,
      quantity,
      quantity_before,
      quantity_after,
      reason,
      reference_type,
      reference_id,
      notes,
      status
    ) VALUES (
      variant_record.product_id,
      variant_id,
      CASE
        WHEN quantity_change > 0 THEN 'adjustment'
        ELSE 'sale'
      END,
      quantity_change,
      previous_stock,
      new_stock_quantity,
      CASE
        WHEN quantity_change > 0 THEN 'stock_increase'
        ELSE 'order_fulfillment'
      END,
      'system',
      NULL,
      'Automatic stock update via update_variant_stock function',
      'completed'
    ) RETURNING id INTO movement_id;

    -- Update corresponding stock_levels if they exist
    UPDATE stock_levels
    SET
      quantity_on_hand = new_stock_quantity,
      updated_at = NOW()
    WHERE product_id = variant_record.product_id
      AND variant_id = variant_id
      AND is_active = true;

    -- Get updated computed values
    SELECT
      stock_quantity,
      reserved_quantity,
      computed_available_stock
    INTO variant_record
    FROM product_variants
    WHERE id = variant_id;

    -- Return success response
    RETURN jsonb_build_object(
      'success', true,
      'variant_id', variant_id,
      'previous_stock', previous_stock,
      'new_stock', variant_record.stock_quantity,
      'available_stock', variant_record.computed_available_stock,
      'reserved_stock', variant_record.reserved_quantity,
      'change_applied', quantity_change,
      'movement_id', movement_id,
      'timestamp', NOW()
    );
  END;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM,
      'variant_id', variant_id,
      'requested_change', quantity_change
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- CREATE BATCH STOCK UPDATE FUNCTION
-- ================================

-- Function to update multiple variants atomically (for order fulfillment)
CREATE OR REPLACE FUNCTION update_multiple_variant_stock(
  stock_updates JSONB
)
RETURNS JSONB AS $$
DECLARE
  update_item JSONB;
  result JSONB;
  all_results JSONB[] := '{}';
  success_count INTEGER := 0;
  failure_count INTEGER := 0;
  total_count INTEGER;
BEGIN
  -- Parse the updates array
  total_count := jsonb_array_length(stock_updates);

  -- Process each update
  FOR update_item IN SELECT * FROM jsonb_array_elements(stock_updates)
  LOOP
    -- Call single variant update function
    SELECT update_variant_stock(
      (update_item->>'variant_id')::UUID,
      (update_item->>'quantity_change')::INTEGER
    ) INTO result;

    -- Track success/failure
    IF (result->>'success')::BOOLEAN THEN
      success_count := success_count + 1;
    ELSE
      failure_count := failure_count + 1;
    END IF;

    -- Add to results
    all_results := all_results || result;
  END LOOP;

  -- Return batch results
  RETURN jsonb_build_object(
    'success', failure_count = 0,
    'total_updates', total_count,
    'successful_updates', success_count,
    'failed_updates', failure_count,
    'results', array_to_json(all_results),
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- CREATE STOCK VALIDATION FUNCTION
-- ================================

-- Function to validate stock availability before processing orders
CREATE OR REPLACE FUNCTION validate_order_stock(
  order_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  item JSONB;
  variant_record RECORD;
  validation_errors JSONB[] := '{}';
  total_items INTEGER;
  valid_items INTEGER := 0;
BEGIN
  total_items := jsonb_array_length(order_items);

  -- Check each item
  FOR item IN SELECT * FROM jsonb_array_elements(order_items)
  LOOP
    -- Get variant stock info
    SELECT
      id,
      product_id,
      stock_quantity,
      reserved_quantity,
      computed_available_stock,
      is_active
    INTO variant_record
    FROM product_variants
    WHERE id = (item->>'variant_id')::UUID;

    IF NOT FOUND THEN
      validation_errors := validation_errors || jsonb_build_object(
        'variant_id', item->>'variant_id',
        'product_id', item->>'product_id',
        'error', 'Variant not found',
        'requested_quantity', item->>'quantity'
      );
    ELSIF NOT variant_record.is_active THEN
      validation_errors := validation_errors || jsonb_build_object(
        'variant_id', item->>'variant_id',
        'product_id', item->>'product_id',
        'error', 'Variant is not active',
        'requested_quantity', item->>'quantity'
      );
    ELSIF variant_record.computed_available_stock < (item->>'quantity')::INTEGER THEN
      validation_errors := validation_errors || jsonb_build_object(
        'variant_id', item->>'variant_id',
        'product_id', item->>'product_id',
        'error', 'Insufficient stock',
        'requested_quantity', item->>'quantity',
        'available_stock', variant_record.computed_available_stock
      );
    ELSE
      valid_items := valid_items + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'valid', array_length(validation_errors, 1) IS NULL,
    'total_items', total_items,
    'valid_items', valid_items,
    'invalid_items', total_items - valid_items,
    'errors', CASE
      WHEN array_length(validation_errors, 1) IS NULL THEN '[]'::JSONB
      ELSE array_to_json(validation_errors)::JSONB
    END,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- CREATE ATOMIC ORDER STOCK FUNCTION
-- ================================

-- Function to atomically process all stock changes for an order
CREATE OR REPLACE FUNCTION process_order_stock_changes(
  order_id UUID,
  order_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  validation_result JSONB;
  stock_updates JSONB;
  update_result JSONB;
  item JSONB;
  updates_array JSONB[] := '{}';
BEGIN
  -- First validate all stock
  SELECT validate_order_stock(order_items) INTO validation_result;

  IF NOT (validation_result->>'valid')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Stock validation failed',
      'validation_result', validation_result
    );
  END IF;

  -- Build stock updates array
  FOR item IN SELECT * FROM jsonb_array_elements(order_items)
  LOOP
    updates_array := updates_array || jsonb_build_object(
      'variant_id', item->>'variant_id',
      'quantity_change', -((item->>'quantity')::INTEGER), -- Negative for decreasing stock
      'order_id', order_id
    );
  END LOOP;

  -- Convert array to JSONB for the batch function
  stock_updates := array_to_json(updates_array)::JSONB;

  -- Execute batch stock update
  SELECT update_multiple_variant_stock(stock_updates) INTO update_result;

  -- Log the order stock processing
  INSERT INTO stock_movements (
    product_id,
    variant_id,
    movement_type,
    quantity,
    reason,
    reference_type,
    reference_id,
    notes,
    status
  )
  SELECT
    (item->>'product_id')::UUID,
    (item->>'variant_id')::UUID,
    'sale',
    -((item->>'quantity')::INTEGER),
    'order_fulfillment',
    'order',
    order_id,
    'Order stock processing: ' || COALESCE(item->>'name', 'Unknown product'),
    CASE
      WHEN (update_result->>'success')::BOOLEAN THEN 'completed'
      ELSE 'failed'
    END
  FROM jsonb_array_elements(order_items) AS item;

  RETURN jsonb_build_object(
    'success', (update_result->>'success')::BOOLEAN,
    'order_id', order_id,
    'validation_result', validation_result,
    'stock_update_result', update_result,
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- GRANT PERMISSIONS
-- ================================

-- Grant execute permissions to authenticated users and service role
GRANT EXECUTE ON FUNCTION update_variant_stock(UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_multiple_variant_stock(JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION validate_order_stock(JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION process_order_stock_changes(UUID, JSONB) TO authenticated, service_role;

-- ================================
-- ADD COMMENTS
-- ================================

COMMENT ON FUNCTION update_variant_stock(UUID, INTEGER) IS 'Atomically updates stock quantity for a product variant with audit trail';
COMMENT ON FUNCTION update_multiple_variant_stock(JSONB) IS 'Batch updates multiple variant stock quantities atomically';
COMMENT ON FUNCTION validate_order_stock(JSONB) IS 'Validates that all items in an order have sufficient stock';
COMMENT ON FUNCTION process_order_stock_changes(UUID, JSONB) IS 'Atomically processes all stock changes for an order with validation';

-- ================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================

-- Ensure we have proper indexes for stock operations
CREATE INDEX IF NOT EXISTS idx_product_variants_stock_operations
ON product_variants(id, stock_quantity, computed_available_stock)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_stock_movements_order_reference
ON stock_movements(reference_type, reference_id, created_at)
WHERE reference_type = 'order';

-- ================================
-- SUCCESS MESSAGE
-- ================================

SELECT 'Stock management functions have been successfully created!' as message;