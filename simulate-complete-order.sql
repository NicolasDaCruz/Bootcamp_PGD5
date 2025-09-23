-- Simulate Complete Order Creation
-- This demonstrates all the features of the order system

-- 1. CREATE ORDER with auto-generated order number
INSERT INTO orders (
    order_number,
    customer_id,
    status,
    subtotal,
    tax_amount,
    shipping_amount,
    total,
    currency,
    customer_email,
    billing_full_name,
    billing_address,
    billing_city,
    billing_country,
    billing_postal_code,
    shipping_full_name,
    shipping_address,
    shipping_city,
    shipping_country,
    shipping_postal_code,
    payment_status,
    payment_method,
    shipping_status,
    order_notes
) VALUES (
    'ORD-20250923-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),  -- Auto-generated order number
    NULL,  -- Guest checkout
    'confirmed',
    409.98,  -- 2x Nike Ja 3 ($149.99) + 1x Air Force 1 ($110.00)
    32.80,   -- Tax
    0,       -- Free shipping (over $50)
    442.78,  -- Total
    'usd',
    'john.smith@example.com',  -- Customer email for notifications
    'John Smith',               -- Billing name
    '456 Billing Ave',          -- Billing address
    'Brooklyn',
    'US',
    '11201',
    'John Smith',               -- Shipping name
    '123 Main Street, Apt 4B',  -- Shipping address
    'New York',
    'US',
    '10001',
    'paid',
    'card',
    'pending',
    'Please leave at door if not home'  -- Customer notes
) RETURNING *;

-- 2. CREATE ORDER ITEMS with product details
-- Get the order ID from above and use it here
-- First product: Nike Ja 3 (quantity: 2)
INSERT INTO order_items (
    order_id,
    product_id,
    product_name,
    product_sku,
    variant_name,
    variant_value,
    quantity,
    unit_price,
    total_price
) VALUES
(
    (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1),
    '0026ee37-fb77-49b6-bcca-7386278e81c1',
    'Nike Nike Ja 3 Default',
    'NIKE-JA3-001',
    'Size',
    '11',
    2,
    149.99,
    299.98
),
-- Second product: Air Force 1 (quantity: 1)
(
    (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1),
    '5dd982f8-1485-4d67-b542-b0b74ecabe1f',
    'Nike Air Force 1 ''07',
    'AF1-07-WHITE',
    'Size',
    '10.5',
    1,
    110.00,
    110.00
);

-- 3. DISPLAY THE CREATED ORDER
SELECT
    '✅ ORDER CREATED SUCCESSFULLY!' as status,
    o.order_number as "Order Number (Auto-Generated)",
    o.customer_email as "Customer Email",
    o.shipping_full_name as "Ship To",
    o.shipping_address || ', ' || o.shipping_city || ', ' || o.shipping_postal_code as "Shipping Address",
    o.total as "Total Amount"
FROM orders o
ORDER BY o.created_at DESC
LIMIT 1;

-- 4. DISPLAY ORDER ITEMS
SELECT
    oi.product_name as "Product",
    oi.product_sku as "SKU",
    oi.variant_value as "Size",
    oi.quantity as "Qty",
    oi.unit_price as "Price",
    oi.total_price as "Subtotal"
FROM order_items oi
WHERE oi.order_id = (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1);

-- 5. SUMMARY
SELECT
    '📋 DEMONSTRATION COMPLETE' as title,
    '✓ Order number auto-generated: ORD-20250923-XXXXXX' as feature1,
    '✓ Products saved with name, SKU, size' as feature2,
    '✓ Customer email: john.smith@example.com' as feature3,
    '✓ Shipping address saved completely' as feature4,
    '✓ Email would be sent to customer' as feature5;