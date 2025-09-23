# Sneaker Store Database ER Diagram

## Database Overview
- **Total Tables**: 65
- **Foreign Key Constraints**: 100
- **Total Records**: 215
- **Data Quality**: Excellent (zero orphaned data)

## Core Entity Relationships

### User-Centric Entities
```
USERS (Central Hub)
├── vendor_id (self-referential) → USERS.id
├── PRODUCTS.vendor_id → USERS.id
├── ORDERS.customer_id → USERS.id
├── CART_ITEMS.user_id → USERS.id
├── REVIEWS.user_id → USERS.id
├── SAVED_ITEMS.user_id → USERS.id
├── WISHLISTS.user_id → USERS.id
├── SUPPORT_TICKETS.customer_id → USERS.id
├── SUPPORT_TICKETS.assigned_to → USERS.id
├── CHAT_SESSIONS.customer_id → USERS.id
├── CHAT_SESSIONS.agent_id → USERS.id
├── CHAT_MESSAGES.sender_id → USERS.id
├── LOYALTY_TRANSACTIONS.user_id → USERS.id
├── USER_LOYALTY_POINTS.user_id → USERS.id
├── USER_REWARD_REDEMPTIONS.user_id → USERS.id
├── USER_RECYCLING_ENROLLMENTS.user_id → USERS.id
├── USER_PACKAGING_PREFERENCES.user_id → USERS.id
├── USER_PRODUCT_AFFINITY.user_id → USERS.id
├── USER_BEHAVIOR.user_id → USERS.id
├── NOTIFICATION_PREFERENCES.user_id → USERS.id
├── NOTIFICATION_LOG.user_id → USERS.id
├── STOCK_ALERTS.vendor_id → USERS.id
├── STOCK_MOVEMENTS.created_by → USERS.id
├── RECOMMENDATION_ANALYTICS.user_id → USERS.id
├── RECOMMENDATION_CACHE.user_id → USERS.id
├── REVIEW_HELPFUL_VOTES.user_id → USERS.id
├── REVIEW_MODERATION_LOG.moderator_id → USERS.id
├── SUPPORT_TICKET_MESSAGES.sender_id → USERS.id
├── WISHLIST_SHARES.shared_by → USERS.id
├── AUTOMATED_RESPONSES.created_by → USERS.id
├── FAQ_ITEMS.created_by → USERS.id
├── FAQ_ITEMS.updated_by → USERS.id
├── PRODUCT_CONDITION_ASSESSMENTS.assessed_by → USERS.id
├── PRODUCT_MAINTENANCE_GUIDES.created_by → USERS.id
└── ORDER_STATUS_HISTORY.changed_by → USERS.id
```

### Product-Centric Entities
```
PRODUCTS (Core Product Entity)
├── category_id → CATEGORIES.id
├── vendor_id → USERS.id
├── authenticity_verified_by → USERS.id
├── PRODUCT_VARIANTS.product_id → PRODUCTS.id
├── PRODUCT_IMAGES.product_id → PRODUCTS.id
├── PRODUCT_INVENTORY.product_id → PRODUCTS.id
├── CART_ITEMS.product_id → PRODUCTS.id
├── ORDER_ITEMS.product_id → PRODUCTS.id
├── REVIEWS.product_id → PRODUCTS.id
├── SAVED_ITEMS.product_id → PRODUCTS.id
├── STOCK_ALERTS.product_id → PRODUCTS.id
├── STOCK_MOVEMENTS.product_id → PRODUCTS.id
├── STOCK_RESERVATIONS.product_id → PRODUCTS.id
├── SUPPORT_TICKETS.product_id → PRODUCTS.id
├── USER_BEHAVIOR.product_id → PRODUCTS.id
├── USER_PRODUCT_AFFINITY.product_id → PRODUCTS.id
├── RECOMMENDATION_ANALYTICS.product_id → PRODUCTS.id
├── ENVIRONMENTAL_IMPACT.product_id → PRODUCTS.id
├── PRODUCT_ECO_CERTIFICATIONS.product_id → PRODUCTS.id
├── PRODUCT_CONDITION_ASSESSMENTS.product_id → PRODUCTS.id
└── PRODUCT_MAINTENANCE_GUIDES.product_id → PRODUCTS.id
```

### Order-Centric Entities
```
ORDERS (Transaction Hub)
├── customer_id → USERS.id
├── ORDER_ITEMS.order_id → ORDERS.id
├── ORDER_STATUS_HISTORY.order_id → ORDERS.id
├── ORDER_TRACKING_UPDATES.order_id → ORDERS.id
├── ORDER_NOTIFICATIONS.order_id → ORDERS.id
├── REVIEWS.order_id → ORDERS.id
├── SUPPORT_TICKETS.order_id → ORDERS.id
├── LOYALTY_TRANSACTIONS.order_id → ORDERS.id
├── GUEST_CHECKOUTS.order_id → ORDERS.id
└── ABANDONED_CARTS.recovery_order_id → ORDERS.id
```

### Category Hierarchy
```
CATEGORIES (Hierarchical Structure)
├── parent_id → CATEGORIES.id (self-referential)
├── PRODUCTS.category_id → CATEGORIES.id
├── PRODUCT_MAINTENANCE_GUIDES.category_id → CATEGORIES.id
└── FAQ_ITEMS.category_id → FAQ_CATEGORIES.id
```

## Detailed Relationship Mappings

### 1. User Management & Authentication
- **USERS** serves as the central identity hub
- Self-referential vendor relationship: `users.vendor_id → users.id`
- Supports multiple user roles: client, vendor, admin

### 2. Product Catalog Structure
- **PRODUCTS** → **CATEGORIES** (many-to-one)
- **PRODUCTS** → **USERS** (vendor relationship)
- **PRODUCT_VARIANTS** → **PRODUCTS** (one-to-many)
- **PRODUCT_IMAGES** → **PRODUCTS** (one-to-many)

### 3. Shopping & Cart Management
- **CART_ITEMS** → **USERS** (user's cart)
- **CART_ITEMS** → **PRODUCTS** (product reference)
- **CART_ITEMS** → **PRODUCT_VARIANTS** (specific variant)
- **STOCK_RESERVATIONS** → **CART_ITEMS** (temporary holds)

### 4. Order Processing Flow
- **ORDERS** → **USERS** (customer relationship)
- **ORDER_ITEMS** → **ORDERS** (line items)
- **ORDER_ITEMS** → **PRODUCTS** (product reference)
- **ORDER_ITEMS** → **PRODUCT_VARIANTS** (variant specification)
- **ORDER_STATUS_HISTORY** → **ORDERS** (audit trail)

### 5. Inventory Management
- **PRODUCT_INVENTORY** → **PRODUCTS** (stock levels)
- **PRODUCT_INVENTORY** → **PRODUCT_VARIANTS** (variant-specific stock)
- **STOCK_MOVEMENTS** → **PRODUCTS** (inventory changes)
- **STOCK_ALERTS** → **PRODUCTS** (low stock notifications)

### 6. Review System
- **REVIEWS** → **USERS** (reviewer)
- **REVIEWS** → **PRODUCTS** (reviewed product)
- **REVIEWS** → **ORDERS** (verified purchase)
- **REVIEW_PHOTOS** → **REVIEWS** (visual evidence)
- **REVIEW_HELPFUL_VOTES** → **REVIEWS** (community validation)

### 7. Support System
- **SUPPORT_TICKETS** → **USERS** (customer and agent)
- **SUPPORT_TICKETS** → **ORDERS** (order-related issues)
- **SUPPORT_TICKETS** → **PRODUCTS** (product-related issues)
- **SUPPORT_TICKET_MESSAGES** → **SUPPORT_TICKETS** (conversation thread)

### 8. Loyalty & Rewards
- **LOYALTY_PROGRAMS** (program definitions)
- **LOYALTY_TIERS** → **LOYALTY_PROGRAMS** (tier structure)
- **LOYALTY_REWARDS** → **LOYALTY_PROGRAMS** (available rewards)
- **USER_LOYALTY_POINTS** → **USERS** (user point balances)
- **LOYALTY_TRANSACTIONS** → **ORDERS** (point earning/spending)

### 9. Sustainability Features
- **ENVIRONMENTAL_IMPACT** → **PRODUCTS** (carbon footprint data)
- **ECO_CERTIFICATIONS** (certification types)
- **PRODUCT_ECO_CERTIFICATIONS** → **PRODUCTS** + **ECO_CERTIFICATIONS** (many-to-many)
- **RECYCLING_PROGRAMS** (program definitions)
- **USER_RECYCLING_ENROLLMENTS** → **USERS** + **RECYCLING_PROGRAMS**

### 10. Analytics & Recommendations
- **USER_BEHAVIOR** → **USERS** + **PRODUCTS** (interaction tracking)
- **USER_PRODUCT_AFFINITY** → **USERS** + **PRODUCTS** (preference scoring)
- **RECOMMENDATION_ANALYTICS** → **USERS** + **PRODUCTS** (performance metrics)
- **RECOMMENDATION_CACHE** → **USERS** (cached recommendations)

## Special Tables

### Views
- **SNEAKER_PRODUCTS_VIEW**: Materialized view combining product and sneaker data
- **ACTIVE_RESERVATIONS**: View of current stock reservations
- **ACTIVE_STOCK_ALERTS**: View of active stock alerts
- **ORDER_TRACKING_SUMMARY**: Aggregated order tracking information

### Audit & Analytics Tables
- **STOCK_MOVEMENT_AUDIT**: Audit trail for inventory changes
- **ORDER_ANALYTICS**: Order performance metrics
- **RECOMMENDATION_METRICS**: Recommendation system performance
- **IMPORT_SUMMARY**: Data import tracking

### Legacy/Alternative Structure
- **SNEAKERS**: Separate sneaker table (possibly legacy or alternative structure)
  - Contains similar fields to products but with different schema
  - No foreign key relationships to other tables
  - Appears to be standalone catalog

## Data Integrity Features
- **100 Foreign Key Constraints**: Ensures perfect referential integrity
- **Zero Orphaned Records**: All relationships are properly maintained
- **UUID Primary Keys**: Consistent across all tables
- **Automatic Timestamps**: created_at/updated_at on most tables
- **Enum Types**: Custom types for status fields (order_status, user_role, etc.)

## Key Insights
1. **Users table is the central hub** - Almost all user interactions flow through this table
2. **Products table is the catalog core** - All product-related data connects here
3. **Strong referential integrity** - 100 FK constraints ensure data consistency
4. **Comprehensive audit trails** - Status history and movement tracking throughout
5. **Modern e-commerce features** - Loyalty, sustainability, recommendations built-in
6. **Vendor marketplace support** - Multi-vendor structure with commission tracking
7. **Guest checkout support** - Orders can exist without user accounts
8. **Advanced inventory management** - Variant-level tracking with reservations