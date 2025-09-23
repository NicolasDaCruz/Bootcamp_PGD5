# Database Troubleshooting Guide

## Overview
This guide helps diagnose and resolve common database-related issues in the sneaker store application. Since the database schema has excellent integrity (100 FK constraints, zero orphaned data), most issues are application-level query problems.

## Common Issues & Solutions

### 1. "Products Not Loading" - Product Listing Issues

#### Symptoms
- Empty product listings
- Products showing but no images/variants
- Vendor products not appearing

#### Diagnosis Queries
```sql
-- Check if products exist and are active
SELECT COUNT(*) as total_products,
       COUNT(CASE WHEN is_active THEN 1 END) as active_products,
       COUNT(CASE WHEN is_featured THEN 1 END) as featured_products
FROM products;

-- Check vendor status affecting product visibility
SELECT u.vendor_status, COUNT(p.id) as product_count
FROM products p
JOIN users u ON p.vendor_id = u.id
GROUP BY u.vendor_status;

-- Check category relationships
SELECT c.name, c.is_active, COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id, c.name, c.is_active;
```

#### Common Root Causes & Fixes
1. **Vendor Status Filter**: Products from non-approved vendors are hidden
   ```sql
   -- Fix: Update vendor status or modify query to include pending vendors
   UPDATE users SET vendor_status = 'approved' WHERE id = 'vendor_uuid';
   ```

2. **Category Inactive**: Products in inactive categories don't show
   ```sql
   -- Fix: Activate category or move products
   UPDATE categories SET is_active = true WHERE slug = 'category_slug';
   ```

3. **Missing Joins**: Application might be missing vendor or category joins
   ```sql
   -- Correct query should include:
   SELECT p.*, c.name as category_name, u.vendor_name
   FROM products p
   LEFT JOIN categories c ON p.category_id = c.id
   LEFT JOIN users u ON p.vendor_id = u.id
   WHERE p.is_active = true
     AND (c.is_active = true OR c.id IS NULL)
     AND (u.vendor_status = 'approved' OR u.id IS NULL);
   ```

### 2. "Cart Items Disappearing" - Shopping Cart Issues

#### Symptoms
- Items added to cart don't persist
- Cart shows wrong quantities
- Checkout fails with inventory errors

#### Diagnosis Queries
```sql
-- Check cart items for user
SELECT ci.*, p.name, pv.name as variant_name, pv.stock_quantity
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
LEFT JOIN product_variants pv ON ci.product_variant_id = pv.id
WHERE ci.user_id = 'user_uuid';

-- Check stock reservations
SELECT sr.*, p.name, pv.name as variant_name
FROM stock_reservations sr
JOIN products p ON sr.product_id = p.id
LEFT JOIN product_variants pv ON sr.variant_id = pv.id
WHERE sr.user_id = 'user_uuid'
  AND sr.expires_at > NOW();

-- Check inventory availability
SELECT pv.id, pv.name, pv.stock_quantity,
       COALESCE(SUM(sr.quantity), 0) as reserved_quantity,
       (pv.stock_quantity - COALESCE(SUM(sr.quantity), 0)) as available_quantity
FROM product_variants pv
LEFT JOIN stock_reservations sr ON pv.id = sr.variant_id AND sr.expires_at > NOW()
WHERE pv.product_id = 'product_uuid'
GROUP BY pv.id, pv.name, pv.stock_quantity;
```

#### Common Root Causes & Fixes
1. **Expired Reservations**: Stock reservations expired, freeing up reserved items
   ```sql
   -- Fix: Extend reservation or clean up expired ones
   DELETE FROM stock_reservations WHERE expires_at < NOW();
   ```

2. **Inventory Oversold**: Variant shows negative available stock
   ```sql
   -- Fix: Update inventory or cancel conflicting reservations
   UPDATE product_variants SET stock_quantity = 10 WHERE id = 'variant_uuid';
   ```

3. **Missing Variant Link**: Cart items without proper variant references
   ```sql
   -- Fix: Update cart items with valid variant IDs
   UPDATE cart_items SET product_variant_id = (
     SELECT id FROM product_variants
     WHERE product_id = cart_items.product_id
     LIMIT 1
   ) WHERE product_variant_id IS NULL;
   ```

### 3. "Order Processing Errors" - Checkout Issues

#### Symptoms
- Orders created but items missing
- Payment successful but order status wrong
- Inventory not updated after purchase

#### Diagnosis Queries
```sql
-- Check order completeness
SELECT o.id, o.status, o.payment_status,
       COUNT(oi.id) as item_count,
       SUM(oi.quantity * oi.price) as calculated_total,
       o.total as order_total
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.id = 'order_uuid'
GROUP BY o.id, o.status, o.payment_status, o.total;

-- Check inventory updates
SELECT p.name, pv.name as variant_name, pv.stock_quantity,
       sm.movement_type, sm.quantity, sm.created_at
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
LEFT JOIN product_variants pv ON sm.variant_id = pv.id
WHERE sm.reference_id = 'order_uuid'
ORDER BY sm.created_at DESC;

-- Check order status history
SELECT osh.*, u.full_name as changed_by_name
FROM order_status_history osh
LEFT JOIN users u ON osh.changed_by = u.id
WHERE osh.order_id = 'order_uuid'
ORDER BY osh.created_at ASC;
```

#### Common Root Causes & Fixes
1. **Transaction Rollback**: Partial order creation due to transaction failure
   ```sql
   -- Fix: Ensure complete transaction or clean up partial data
   BEGIN;
   DELETE FROM order_items WHERE order_id = 'partial_order_uuid';
   DELETE FROM orders WHERE id = 'partial_order_uuid';
   COMMIT;
   ```

2. **Inventory Not Updated**: Stock movements missing
   ```sql
   -- Fix: Create missing stock movements
   INSERT INTO stock_movements (product_id, variant_id, movement_type, quantity, reference_id, created_by)
   SELECT oi.product_id, oi.product_variant_id, 'sale', oi.quantity, oi.order_id, o.customer_id
   FROM order_items oi
   JOIN orders o ON oi.order_id = o.id
   WHERE o.id = 'order_uuid';
   ```

### 4. "User Authentication Issues" - Login/Account Problems

#### Symptoms
- Users can't log in with correct credentials
- Vendor access denied
- Profile data missing

#### Diagnosis Queries
```sql
-- Check user account status
SELECT id, email, role, is_vendor, vendor_status, created_at
FROM users
WHERE email = 'user@example.com';

-- Check vendor-specific data
SELECT vendor_name, vendor_status, vendor_joined_at,
       vendor_commission_rate, vendor_analytics
FROM users
WHERE id = 'user_uuid' AND is_vendor = true;

-- Check user relationships
SELECT 'orders' as relation, COUNT(*) as count FROM orders WHERE customer_id = 'user_uuid'
UNION ALL
SELECT 'products' as relation, COUNT(*) as count FROM products WHERE vendor_id = 'user_uuid'
UNION ALL
SELECT 'cart_items' as relation, COUNT(*) as count FROM cart_items WHERE user_id = 'user_uuid';
```

#### Common Root Causes & Fixes
1. **Role Mismatch**: User role doesn't match expected permissions
   ```sql
   -- Fix: Update user role
   UPDATE users SET role = 'vendor' WHERE id = 'user_uuid' AND is_vendor = true;
   ```

2. **Vendor Status Pending**: Vendor waiting for approval
   ```sql
   -- Fix: Approve vendor or update status
   UPDATE users SET vendor_status = 'approved' WHERE id = 'user_uuid';
   ```

### 5. "Review System Problems" - Review Display Issues

#### Symptoms
- Reviews not showing for products
- Users can't submit reviews
- Review ratings incorrect

#### Diagnosis Queries
```sql
-- Check review eligibility
SELECT o.id as order_id, oi.product_id, o.status, o.delivered_at,
       EXISTS(SELECT 1 FROM reviews WHERE order_id = o.id AND product_id = oi.product_id) as has_review
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.customer_id = 'user_uuid'
  AND oi.product_id = 'product_uuid';

-- Check review status and moderation
SELECT r.*, rm.action, rm.reason
FROM reviews r
LEFT JOIN review_moderation_log rm ON r.id = rm.review_id
WHERE r.product_id = 'product_uuid'
ORDER BY r.created_at DESC;

-- Check review aggregation
SELECT product_id,
       COUNT(*) as total_reviews,
       AVG(rating) as average_rating,
       COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_reviews
FROM reviews
WHERE product_id = 'product_uuid'
GROUP BY product_id;
```

#### Common Root Causes & Fixes
1. **Purchase Verification**: User hasn't purchased the product
   ```sql
   -- Fix: Verify purchase requirement or allow reviews without purchase
   -- (Business decision - current system requires verified purchase)
   ```

2. **Review Status**: Reviews are pending moderation
   ```sql
   -- Fix: Approve pending reviews
   UPDATE reviews SET status = 'approved' WHERE status = 'pending' AND product_id = 'product_uuid';
   ```

### 6. "Performance Issues" - Slow Query Problems

#### Common Slow Queries & Optimizations

1. **Product Listing Without Indexes**
   ```sql
   -- Slow query:
   SELECT * FROM products WHERE category_id = 'cat_uuid' AND is_active = true;

   -- Fix: Add composite index
   CREATE INDEX idx_products_category_active ON products(category_id, is_active);
   ```

2. **Cart Queries Without User Index**
   ```sql
   -- Slow query:
   SELECT * FROM cart_items WHERE user_id = 'user_uuid';

   -- Fix: Add user index
   CREATE INDEX idx_cart_items_user ON cart_items(user_id);
   ```

3. **Order History Queries**
   ```sql
   -- Slow query:
   SELECT * FROM orders WHERE customer_id = 'user_uuid' ORDER BY created_at DESC;

   -- Fix: Add composite index
   CREATE INDEX idx_orders_customer_created ON orders(customer_id, created_at DESC);
   ```

## Monitoring & Prevention

### 1. Regular Health Checks
```sql
-- Check for data integrity issues
SELECT 'orphaned_cart_items' as issue, COUNT(*) as count
FROM cart_items ci
LEFT JOIN users u ON ci.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'orphaned_order_items' as issue, COUNT(*) as count
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL

UNION ALL

SELECT 'inactive_vendor_products' as issue, COUNT(*) as count
FROM products p
JOIN users u ON p.vendor_id = u.id
WHERE u.vendor_status != 'approved' AND p.is_active = true;
```

### 2. Performance Monitoring
```sql
-- Find slow-running queries (PostgreSQL specific)
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
WHERE mean_time > 1000  -- queries taking more than 1 second
ORDER BY mean_time DESC
LIMIT 10;
```

### 3. Index Usage Analysis
```sql
-- Check unused indexes
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY tablename, indexname;
```

## Emergency Procedures

### 1. Database Corruption Recovery
1. Stop application connections
2. Run integrity checks
3. Restore from latest backup if needed
4. Verify foreign key constraints

### 2. Performance Emergency
1. Identify problematic queries
2. Add temporary indexes if needed
3. Implement query limits
4. Scale read replicas if available

### 3. Data Inconsistency Issues
1. Run data validation scripts
2. Fix referential integrity violations
3. Update application code to prevent recurrence
4. Add monitoring for future detection

## Application-Level Recommendations

### 1. Query Optimization
- Always use appropriate WHERE clauses
- Implement pagination for large result sets
- Use prepared statements to prevent injection
- Cache frequently accessed data

### 2. Error Handling
- Implement proper transaction handling
- Add retry logic for transient failures
- Log query errors with context
- Monitor database connection pools

### 3. Data Validation
- Validate foreign key relationships before insertion
- Check inventory availability before reservations
- Verify user permissions before operations
- Implement proper constraint error handling

This troubleshooting guide should help diagnose and resolve most database-related issues in the sneaker store application.