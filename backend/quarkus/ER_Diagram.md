# FoodGrid Application - Entity Relationship Diagram

## Overview
This document provides a detailed Entity Relationship (ER) diagram for the FoodGrid Point of Sale (POS) application. The system is designed as a multi-tenant restaurant management platform with comprehensive features for order management, inventory tracking, payment processing, and employee management.

## Database Schema

### Core Entities

#### 1. Client Management
```sql
clients
├── id (PK, UUID)
├── name (VARCHAR(190), NOT NULL)
├── contact_email (VARCHAR(190))
├── status (ENUM: ACTIVE, INACTIVE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

admin_users
├── id (PK, UUID)
├── email (VARCHAR(190), UNIQUE, NOT NULL)
├── password_hash (VARCHAR(255), NOT NULL)
├── display_name (VARCHAR(120), NOT NULL)
├── status (ENUM: ACTIVE, INACTIVE)
└── client_id (FK -> clients.id)
```

#### 2. Outlet & Employee Management
```sql
outlets
├── id (PK, UUID)
├── owner_id (UUID, NOT NULL)
├── client_id (FK -> clients.id)
├── name (VARCHAR(120), NOT NULL)
├── timezone (VARCHAR(64), NOT NULL)
└── status (ENUM: ACTIVE, INACTIVE)

employees
├── id (PK, UUID)
├── outlet_id (FK -> outlets.id, NOT NULL)
├── tenant_id (UUID)
├── display_name (VARCHAR(120), NOT NULL)
├── email (VARCHAR(190), UNIQUE, NOT NULL)
├── avatar_url (VARCHAR(500))
└── status (ENUM: ACTIVE, INACTIVE)

pos_devices
├── id (PK, UUID)
├── outlet_id (FK -> outlets.id, NOT NULL)
├── device_code (VARCHAR(64), UNIQUE, NOT NULL)
└── name (VARCHAR(120))

shifts
├── id (PK, UUID)
├── outlet_id (FK -> outlets.id, NOT NULL)
├── employee_id (FK -> employees.id, NOT NULL)
├── device_id (FK -> pos_devices.id, NOT NULL)
├── started_at (TIMESTAMP, NOT NULL)
├── ended_at (TIMESTAMP)
└── status (ENUM: ACTIVE, CLOSED)
```

#### 3. Menu Management
```sql
menu_categories
├── id (PK, UUID)
├── outlet_id (FK -> outlets.id, NOT NULL)
├── name (VARCHAR(120), NOT NULL)
├── sort_order (INT, NOT NULL)
├── status (ENUM: ACTIVE, INACTIVE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

menu_items
├── id (PK, UUID)
├── outlet_id (FK -> outlets.id, NOT NULL)
├── tenant_id (UUID)
├── category_id (FK -> menu_categories.id)
├── name (VARCHAR(160), NOT NULL)
├── description (VARCHAR(500))
├── is_veg (BOOLEAN, NOT NULL)
├── base_price (DECIMAL(12,2), NOT NULL)
├── status (ENUM: ACTIVE, INACTIVE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 4. Order Management
```sql
dining_tables
├── id (PK, UUID)
├── outlet_id (FK -> outlets.id, NOT NULL)
├── table_code (VARCHAR(64), NOT NULL)
├── display_name (VARCHAR(120), NOT NULL)
├── capacity (INT, NOT NULL)
├── status (ENUM: ACTIVE, INACTIVE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

orders
├── id (PK, UUID)
├── outlet_id (FK -> outlets.id, NOT NULL)
├── tenant_id (UUID)
├── device_id (FK -> pos_devices.id, NOT NULL)
├── shift_id (FK -> shifts.id, NOT NULL)
├── employee_id (FK -> employees.id, NOT NULL)
├── table_id (FK -> dining_tables.id)
├── order_type (ENUM: DINE_IN, TAKEAWAY, DELIVERY)
├── status (ENUM: OPEN, KOT_SENT, SERVED, BILLED, PAID, CANCELLED)
├── subtotal (DECIMAL(12,2), NOT NULL)
├── tax_total (DECIMAL(12,2), NOT NULL)
├── discount_total (DECIMAL(12,2), NOT NULL)
├── grand_total (DECIMAL(12,2), NOT NULL)
├── notes (VARCHAR(500))
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

order_items
├── id (PK, UUID)
├── order_id (FK -> orders.id, NOT NULL)
├── item_id (FK -> menu_items.id, NOT NULL)
├── item_name (VARCHAR(160), NOT NULL)
├── qty (DECIMAL(10,2), NOT NULL)
├── unit_price (DECIMAL(12,2), NOT NULL)
├── line_total (DECIMAL(12,2), NOT NULL)
├── status (ENUM: OPEN, CANCELLED)
└── created_at (TIMESTAMP)
```

#### 5. Payment Management
```sql
payments
├── id (PK, UUID)
├── order_id (FK -> orders.id, NOT NULL)
├── method (ENUM: CASH, CARD, UPI, GATEWAY)
├── amount (DECIMAL(12,2), NOT NULL)
├── status (ENUM: CAPTURED, VOID, PENDING)
├── gateway_transaction_id (FK -> gateway_transactions.id)
└── created_at (TIMESTAMP)

gateway_transactions
├── id (PK, UUID)
├── tenant_id (UUID, NOT NULL)
├── client_id (FK -> clients.id, NOT NULL)
├── outlet_id (FK -> outlets.id, NOT NULL)
├── order_id (FK -> orders.id, NOT NULL)
├── payment_id (FK -> payments.id)
├── gateway_type (ENUM: RAZORPAY, STRIPE, etc.)
├── gateway_order_id (VARCHAR(255))
├── gateway_payment_id (VARCHAR(255))
├── gateway_signature (VARCHAR(512))
├── amount (DECIMAL(12,2), NOT NULL)
├── currency (VARCHAR(3), DEFAULT 'INR')
├── status (ENUM: PENDING, SUCCESS, FAILED, REFUNDED)
├── payment_method (VARCHAR(50))
├── failure_reason (TEXT)
├── gateway_response (TEXT)
├── idempotency_key (VARCHAR(255))
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── completed_at (TIMESTAMP)
```

#### 6. Inventory Management
```sql
ingredient_categories
├── id (PK, UUID)
├── outlet_id (FK -> outlets.id, NOT NULL)
├── name (VARCHAR(120), NOT NULL)
├── description (VARCHAR(500))
├── icon (VARCHAR(50))
├── sort_order (INT, DEFAULT 0)
├── status (ENUM: ACTIVE, INACTIVE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

units_of_measure
├── id (PK, UUID)
├── outlet_id (FK -> outlets.id, NOT NULL)
├── name (VARCHAR(50), NOT NULL)
├── abbreviation (VARCHAR(10), NOT NULL)
├── unit_type (ENUM: WEIGHT, VOLUME, COUNT, LENGTH)
├── base_unit_id (FK -> units_of_measure.id)
├── conversion_factor (DECIMAL(15,6))
├── status (ENUM: ACTIVE, INACTIVE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

suppliers
├── id (PK, UUID)
├── outlet_id (FK -> outlets.id, NOT NULL)
├── name (VARCHAR(200), NOT NULL)
├── contact_person (VARCHAR(120))
├── email (VARCHAR(190))
├── phone (VARCHAR(30))
├── address (TEXT)
├── notes (TEXT)
├── status (ENUM: ACTIVE, INACTIVE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

ingredients
├── id (PK, UUID)
├── outlet_id (FK -> outlets.id, NOT NULL)
├── category_id (FK -> ingredient_categories.id)
├── sku (VARCHAR(50))
├── name (VARCHAR(200), NOT NULL)
├── description (TEXT)
├── image_url (VARCHAR(500))
├── unit_id (FK -> units_of_measure.id, NOT NULL)
├── cost_price (DECIMAL(12,2), NOT NULL, DEFAULT 0)
├── is_sellable (BOOLEAN, NOT NULL, DEFAULT FALSE)
├── selling_price (DECIMAL(12,2))
├── linked_menu_item_id (FK -> menu_items.id)
├── track_inventory (BOOLEAN, NOT NULL, DEFAULT TRUE)
├── current_stock (DECIMAL(15,4), NOT NULL, DEFAULT 0)
├── reorder_level (DECIMAL(15,4))
├── reorder_quantity (DECIMAL(15,4))
├── max_stock_level (DECIMAL(15,4))
├── shelf_life_days (INT)
├── storage_instructions (TEXT)
├── default_supplier_id (FK -> suppliers.id)
├── status (ENUM: ACTIVE, INACTIVE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

stock_movements
├── id (PK, UUID)
├── outlet_id (FK -> outlets.id, NOT NULL)
├── ingredient_id (FK -> ingredients.id, NOT NULL)
├── movement_type (ENUM: PURCHASE, USAGE, WASTAGE, ADJUSTMENT, TRANSFER_IN, TRANSFER_OUT, RETURN, OPENING_STOCK)
├── quantity (DECIMAL(15,4), NOT NULL)
├── unit_id (FK -> units_of_measure.id, NOT NULL)
├── unit_cost (DECIMAL(12,2))
├── total_cost (DECIMAL(12,2))
├── reference_type (VARCHAR(50))
├── reference_id (UUID)
├── supplier_id (FK -> suppliers.id)
├── purchase_order_number (VARCHAR(50))
├── invoice_number (VARCHAR(50))
├── wastage_reason (VARCHAR(500))
├── stock_before (DECIMAL(15,4), NOT NULL)
├── stock_after (DECIMAL(15,4), NOT NULL)
├── notes (TEXT)
├── recorded_by_employee_id (FK -> employees.id)
├── recorded_at (TIMESTAMP)
└── created_at (TIMESTAMP)
```

#### 7. Authentication & Security
```sql
employee_credentials
├── id (PK, UUID)
├── employee_id (FK -> employees.id, NOT NULL)
├── pin_hash (VARCHAR(255))
├── password_hash (VARCHAR(255))
├── last_login_at (TIMESTAMP)
└── created_at (TIMESTAMP)

pin_otp_challenges
├── id (PK, UUID)
├── employee_id (FK -> employees.id, NOT NULL)
├── device_id (FK -> pos_devices.id)
├── challenge_type (ENUM: PIN, OTP)
├── challenge_value (VARCHAR(255))
├── expires_at (TIMESTAMP)
├── attempts (INT, DEFAULT 0)
├── is_verified (BOOLEAN, DEFAULT FALSE)
└── created_at (TIMESTAMP)
```

#### 8. System & Audit
```sql
audit_logs
├── id (PK, UUID)
├── tenant_id (UUID)
├── entity_type (VARCHAR(100))
├── entity_id (UUID)
├── action (VARCHAR(50))
├── old_values (JSON)
├── new_values (JSON)
├── performed_by_employee_id (FK -> employees.id)
├── ip_address (VARCHAR(45))
├── user_agent (TEXT)
└── created_at (TIMESTAMP)

idempotency_keys
├── id (PK, UUID)
├── key (VARCHAR(255), UNIQUE, NOT NULL)
├── response_data (JSON)
├── expires_at (TIMESTAMP)
└── created_at (TIMESTAMP)
```

## Relationship Summary

### Primary Relationships
1. **Client → Admin Users**: One-to-Many (client has multiple admin users)
2. **Client → Outlets**: One-to-Many (client has multiple outlets)
3. **Outlet → Employees**: One-to-Many (outlet has multiple employees)
4. **Outlet → POS Devices**: One-to-Many (outlet has multiple devices)
5. **Outlet → Menu Categories**: One-to-Many
6. **Outlet → Menu Items**: One-to-Many
7. **Outlet → Dining Tables**: One-to-Many
8. **Outlet → Ingredients**: One-to-Many
9. **Outlet → Suppliers**: One-to-Many

### Transactional Relationships
1. **Order → Order Items**: One-to-Many
2. **Order → Payments**: One-to-Many
3. **Order → Gateway Transactions**: One-to-One (optional)
4. **Shift → Orders**: One-to-Many
5. **Employee → Shifts**: One-to-Many
6. **Ingredient → Stock Movements**: One-to-Many

### Hierarchical Relationships
1. **Menu Category → Menu Items**: One-to-Many
2. **Ingredient Category → Ingredients**: One-to-Many
3. **Unit of Measure → Ingredients**: One-to-Many
4. **Supplier → Ingredients**: One-to-Many (default supplier)

## Key Design Patterns

### Multi-Tenancy
- `tenant_id` field in major entities for data isolation
- `client_id` for client-level data segregation

### Audit Trail
- `created_at` and `updated_at` timestamps in most entities
- Comprehensive audit logging system

### Inventory Management
- Real-time stock tracking with `current_stock`
- Complete transaction history via `stock_movements`
- Reorder level and quantity management

### Payment Processing
- Multiple payment methods support
- Gateway integration with transaction tracking
- Idempotency key handling for payment reliability

### Security
- Employee authentication with PIN/OTP
- Device-based access control
- Shift-based operation tracking

## Data Flow

### Order Processing Flow
1. Employee logs in → Starts Shift → Takes Orders
2. Order linked to: Outlet, Device, Shift, Employee, Table (optional)
3. Order Items created with Menu Item details
4. Payments processed (multiple methods supported)
5. Gateway transactions for online payments

### Inventory Flow
1. Ingredients created with categories and units
2. Stock movements track all inventory changes
3. Purchase, Usage, Wastage, Adjustments recorded
4. Real-time stock levels updated automatically

This ER diagram represents a comprehensive restaurant POS system with multi-tenant architecture, complete order management, inventory tracking, and payment processing capabilities.
