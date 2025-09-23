# Critical Data Paths - Sneaker Store Application

## Overview
This document maps the essential data flows that support core business operations in the sneaker store application. Understanding these paths is crucial for debugging application issues and optimizing query performance.

## 1. User Registration & Authentication Flow

### Primary Path
```sql
-- User Registration
INSERT INTO users (email, full_name, role)
VALUES ('user@example.com', 'John Doe', 'client');

-- Vendor Registration (Multi-step)
UPDATE users SET
  is_vendor = true,
  vendor_name = 'Sneaker Heaven',
  vendor_status = 'pending'
WHERE id = 'user_uuid';

-- Notification Preferences (Auto-created)
INSERT INTO notification_preferences (user_id, email_notifications, sms_notifications)
VALUES ('user_uuid', true, false);
```

### Critical Queries
- User lookup by email: `SELECT * FROM users WHERE email = ?`
- Vendor verification: `SELECT vendor_status FROM users WHERE id = ? AND is_vendor = true`
- Profile completion check: Check for required vendor fields

### Performance Notes
- Email field should be indexed (unique constraint exists)
- Role-based access requires efficient role filtering

## 2. Product Catalog Display Flow

### Primary Path
```sql
-- Product Listing with Category Filter
SELECT p.*, c.name as category_name, c.slug as category_slug,
       u.vendor_name, u.vendor_status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN users u ON p.vendor_id = u.id
WHERE p.is_active = true
  AND c.is_active = true
  AND u.vendor_status = 'approved'
ORDER BY p.created_at DESC;

-- Product Variants for Detail Page
SELECT pv.*, pi.product_id, pi.stock_quantity as inventory_stock
FROM product_variants pv
LEFT JOIN product_inventory pi ON pv.id = pi.variant_id
WHERE pv.product_id = ? AND pv.is_active = true;

-- Product Images
SELECT * FROM product_images
WHERE product_id = ?
ORDER BY sort_order ASC;
```

### Critical Performance Paths
- Category hierarchy traversal: `categories.parent_id` relationships
- Vendor status filtering: Active vendor products only
- Stock availability: Join with `product_inventory` or `product_variants.stock_quantity`
- Search functionality: Uses `products.search_vector` for full-text search

### Optimization Notes
- Product listing is the most common query - needs efficient indexing
- Category filtering and vendor status joins are performance critical
- Image loading should be optimized (lazy loading, CDN)

## 3. Shopping Cart & Checkout Flow

### Primary Path
```sql
-- Add to Cart
INSERT INTO cart_items (user_id, product_id, product_variant_id, quantity)
VALUES (?, ?, ?, ?);

-- Create Stock Reservation (Prevent overselling)
INSERT INTO stock_reservations (user_id, product_id, variant_id, quantity, cart_item_id)
VALUES (?, ?, ?, ?, ?);

-- Cart Display Query
SELECT ci.*, p.name, p.price, pv.name as variant_name,
       pv.price_adjustment, pi.stock_quantity
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
JOIN product_variants pv ON ci.product_variant_id = pv.id
LEFT JOIN product_inventory pi ON pv.id = pi.variant_id
WHERE ci.user_id = ?;

-- Checkout Process
BEGIN TRANSACTION;

-- Create Order
INSERT INTO orders (customer_id, order_number, subtotal, total, customer_email, ...)
VALUES (?, ?, ?, ?, ?, ...);

-- Create Order Items
INSERT INTO order_items (order_id, product_id, product_variant_id, quantity, price)
SELECT ?, ci.product_id, ci.product_variant_id, ci.quantity,
       (p.price + COALESCE(pv.price_adjustment, 0)) as price
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
JOIN product_variants pv ON ci.product_variant_id = pv.id
WHERE ci.user_id = ?;

-- Update Inventory
UPDATE product_variants SET stock_quantity = stock_quantity - ?
WHERE id = ?;

-- Log Stock Movement
INSERT INTO stock_movements (product_id, variant_id, movement_type, quantity, created_by)
VALUES (?, ?, 'sale', ?, ?);

-- Clear Cart and Reservations
DELETE FROM stock_reservations WHERE cart_item_id IN (...);
DELETE FROM cart_items WHERE user_id = ?;

COMMIT;
```

### Critical Performance Considerations
- Stock reservations prevent overselling but create temporary locks
- Cart queries are frequent - need efficient user-based indexing
- Checkout is transactional - must be atomic to prevent data corruption
- Inventory updates must be synchronized to prevent race conditions

## 4. Order Processing & Fulfillment Flow

### Primary Path
```sql
-- Order Status Updates
UPDATE orders SET status = ?, updated_at = NOW()
WHERE id = ?;

-- Log Status Change
INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, change_reason)
VALUES (?, ?, ?, ?, ?);

-- Shipping Updates
UPDATE orders SET
  tracking_number = ?,
  carrier_name = ?,
  shipped_at = NOW(),
  shipping_status = 'shipped'
WHERE id = ?;

-- Order Tracking Updates
INSERT INTO order_tracking_updates (order_id, status, description, location, timestamp)
VALUES (?, 'in_transit', 'Package departed facility', 'Los Angeles, CA', NOW());

-- Vendor Order View
SELECT o.*, oi.*, p.name as product_name
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE p.vendor_id = ?
  AND o.status != 'cancelled'
ORDER BY o.created_at DESC;
```

### Critical Business Rules
- Order status progression must be tracked
- Vendors can only see orders containing their products
- Shipping updates trigger customer notifications
- Delivery confirmation updates order analytics

## 5. Review & Rating System Flow

### Primary Path
```sql
-- Verify Purchase Before Review
SELECT o.id, oi.product_id, oi.product_variant_id
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.customer_id = ?
  AND oi.product_id = ?
  AND o.status = 'delivered';

-- Create Review (Only if verified purchase)
INSERT INTO reviews (user_id, product_id, product_variant_id, order_id, rating, title, content)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- Add Review Photos
INSERT INTO review_photos (review_id, image_url, caption)
VALUES (?, ?, ?);

-- Review Display with Helpful Votes
SELECT r.*, u.full_name, u.avatar_url,
       COUNT(rhv.id) as helpful_votes,
       (SELECT COUNT(*) FROM review_helpful_votes WHERE review_id = r.id AND user_id = ?) as user_voted
FROM reviews r
JOIN users u ON r.user_id = u.id
LEFT JOIN review_helpful_votes rhv ON r.id = rhv.review_id
WHERE r.product_id = ?
  AND r.status = 'approved'
GROUP BY r.id, u.full_name, u.avatar_url
ORDER BY helpful_votes DESC, r.created_at DESC;
```

### Trust & Quality Assurance
- Only verified purchasers can review products
- Community validation through helpful votes
- Moderation system for quality control
- Photo evidence support for authenticity

## 6. Inventory Management Flow

### Primary Path
```sql
-- Real-time Stock Check
SELECT pv.stock_quantity, pi.stock_quantity as warehouse_stock,
       sr.reserved_quantity
FROM product_variants pv
LEFT JOIN product_inventory pi ON pv.id = pi.variant_id
LEFT JOIN (
  SELECT variant_id, SUM(quantity) as reserved_quantity
  FROM stock_reservations
  WHERE expires_at > NOW()
  GROUP BY variant_id
) sr ON pv.id = sr.variant_id
WHERE pv.product_id = ?;

-- Stock Alert Generation
SELECT p.id, p.name, pv.id as variant_id, pv.name as variant_name,
       pv.stock_quantity, p.low_stock_threshold
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.stock_quantity <= p.low_stock_threshold
  AND p.manage_stock = true
  AND p.is_active = true;

-- Create Stock Alerts for Vendors
INSERT INTO stock_alerts (product_id, variant_id, vendor_id, alert_type, threshold, current_stock)
SELECT p.id, pv.id, p.vendor_id, 'low_stock', p.low_stock_threshold, pv.stock_quantity
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.stock_quantity <= p.low_stock_threshold;

-- Inventory Movement Tracking
INSERT INTO stock_movements (product_id, variant_id, movement_type, quantity, reference_id, created_by)
VALUES (?, ?, 'adjustment', ?, ?, ?);
```

### Automation & Alerts
- Automated low-stock alerts for vendors
- Stock reservations during checkout process
- Complete audit trail for all inventory changes
- Vendor-specific inventory management

## 7. Customer Support Flow

### Primary Path
```sql
-- Create Support Ticket
INSERT INTO support_tickets (customer_id, order_id, product_id, subject, priority, status)
VALUES (?, ?, ?, ?, 'medium', 'open');

-- Auto-assign Based on Category
UPDATE support_tickets SET assigned_to = (
  SELECT id FROM users
  WHERE role = 'support'
    AND JSON_EXTRACT(support_specialties, '$.products') = true
  ORDER BY RANDOM() LIMIT 1
)
WHERE id = ?;

-- Support Conversation
INSERT INTO support_ticket_messages (ticket_id, sender_id, message, message_type)
VALUES (?, ?, ?, 'agent_response');

-- Context-Aware Ticket Display
SELECT st.*, o.order_number, p.name as product_name,
       c.full_name as customer_name, c.email as customer_email,
       a.full_name as agent_name
FROM support_tickets st
LEFT JOIN orders o ON st.order_id = o.id
LEFT JOIN products p ON st.product_id = p.id
LEFT JOIN users c ON st.customer_id = c.id
LEFT JOIN users a ON st.assigned_to = a.id
WHERE st.id = ?;
```

### Escalation & Context
- Automatic agent assignment based on expertise
- Full order and product context available
- Conversation history preservation
- Priority-based queue management

## 8. Analytics & Recommendations Flow

### Primary Path
```sql
-- User Behavior Tracking
INSERT INTO user_behavior (user_id, product_id, action_type, session_id, page_url)
VALUES (?, ?, 'view', ?, ?);

-- Product Affinity Calculation
INSERT INTO user_product_affinity (user_id, product_id, affinity_score, last_interaction)
SELECT ub.user_id, ub.product_id,
       COUNT(*) * 1.0 / (EXTRACT(EPOCH FROM NOW() - MAX(ub.created_at)) / 86400 + 1) as score,
       MAX(ub.created_at)
FROM user_behavior ub
WHERE ub.created_at > NOW() - INTERVAL '30 days'
GROUP BY ub.user_id, ub.product_id;

-- Recommendation Generation
SELECT p.*, upa.affinity_score,
       COUNT(DISTINCT o.id) as purchase_count,
       AVG(r.rating) as avg_rating
FROM products p
JOIN user_product_affinity upa ON p.id = upa.product_id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
LEFT JOIN reviews r ON p.id = r.product_id
WHERE upa.user_id = ?
  AND p.is_active = true
GROUP BY p.id, upa.affinity_score
ORDER BY upa.affinity_score DESC
LIMIT 10;
```

### Performance & Privacy
- Behavioral data collection for personalization
- Privacy-compliant tracking (user consent required)
- Cached recommendations for performance
- A/B testing support through analytics tables

## Query Optimization Recommendations

### 1. Critical Indexes Needed
```sql
-- User authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_vendor_status ON users(vendor_status) WHERE is_vendor = true;

-- Product catalog
CREATE INDEX idx_products_active_category ON products(category_id, is_active);
CREATE INDEX idx_products_vendor_active ON products(vendor_id, is_active);
CREATE INDEX idx_product_variants_product_active ON product_variants(product_id, is_active);

-- Shopping cart
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_stock_reservations_expires ON stock_reservations(expires_at);

-- Orders
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Reviews
CREATE INDEX idx_reviews_product_status ON reviews(product_id, status);
CREATE INDEX idx_reviews_user_product ON reviews(user_id, product_id);
```

### 2. Query Performance Tips
- Use LIMIT clauses for large result sets
- Implement pagination for product listings
- Cache frequently accessed data (categories, popular products)
- Use connection pooling for database connections
- Consider read replicas for analytics queries

### 3. Common Performance Bottlenecks
- Product listing without proper indexing
- Cart queries without user-specific indexes
- Inventory checks during high-traffic periods
- Complex recommendation calculations
- Full-text search on large product catalogs

This critical data paths documentation provides the foundation for understanding the application's data flow and optimizing its performance.