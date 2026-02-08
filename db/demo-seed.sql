-- Demo seed data for FoodGrid Interactive Demo
-- All IDs prefixed with 'demo-' for isolation and easy cleanup
USE petpooja_db;

-- 1. Demo Outlet
INSERT IGNORE INTO outlets (id, owner_id, client_id, name, timezone, status)
VALUES ('demo-outlet-1', 'demo-admin-1', 'demo-admin-1', 'The Spice Garden', 'Asia/Kolkata', 'ACTIVE');

-- 2. Demo Admin User (password: Souraj@123)
INSERT IGNORE INTO admin_users (id, outlet_id, email, password_hash, display_name, status, client_id)
VALUES ('demo-admin-1', NULL, 'demo-admin@foodgrid.com',
        '$2a$12$DwPxcio1Yil7j9v2ldur4OgFyg0qReIuVN7YH.g3/XRjh2bfcsH8G',
        'Demo Restaurant Admin', 'ACTIVE', 'demo-admin-1');

-- 3. Demo Admin Roles
INSERT IGNORE INTO admin_user_roles (admin_user_id, role)
VALUES ('demo-admin-1', 'CLIENT_ADMIN');

-- 4. Demo Employees
INSERT IGNORE INTO employees (id, outlet_id, display_name, email, status)
VALUES ('demo-emp-cashier', 'demo-outlet-1', 'Priya Sharma', 'demo-cashier@foodgrid.com', 'ACTIVE');

INSERT IGNORE INTO employees (id, outlet_id, display_name, email, status)
VALUES ('demo-emp-manager', 'demo-outlet-1', 'Rahul Verma', 'demo-manager@foodgrid.com', 'ACTIVE');

-- 5. Demo Employee Credentials (PIN: 1234)
INSERT IGNORE INTO employee_credentials (employee_id, pin_hash, pin_updated_at)
VALUES ('demo-emp-cashier', '$2a$12$6K0Y7mE9S7.K.E.K.E.K.EuLp1eDk1xS6ZJ8n/v8.m8rG3F.N.m.', NOW());

INSERT IGNORE INTO employee_credentials (employee_id, pin_hash, pin_updated_at)
VALUES ('demo-emp-manager', '$2a$12$6K0Y7mE9S7.K.E.K.E.K.EuLp1eDk1xS6ZJ8n/v8.m8rG3F.N.m.', NOW());

-- 6. Demo Employee Roles
INSERT IGNORE INTO employee_roles (employee_id, role)
VALUES ('demo-emp-cashier', 'CASHIER');

INSERT IGNORE INTO employee_roles (employee_id, role)
VALUES ('demo-emp-manager', 'MANAGER');

-- 7. Demo POS Device
INSERT IGNORE INTO pos_devices (id, outlet_id, device_code, name)
VALUES ('demo-device-1', 'demo-outlet-1', 'DEMO-POS-001', 'Demo Cash Counter');

-- 8. Demo Shift (ACTIVE)
INSERT IGNORE INTO shifts (id, outlet_id, employee_id, started_at, status)
VALUES ('demo-shift-1', 'demo-outlet-1', 'demo-emp-cashier', NOW(), 'ACTIVE');

-- 9. Demo Shift Session
INSERT IGNORE INTO shift_sessions (id, shift_id, device_id)
VALUES ('demo-session-1', 'demo-shift-1', 'demo-device-1');

-- 10. Demo Customer
INSERT IGNORE INTO customers (id, mobile_number, email, display_name, status, created_at, provider)
VALUES ('demo-customer-1', '9876543210', 'demo-customer@foodgrid.com', 'Demo Customer', 'ACTIVE', NOW(), 'LOCAL');

-- 11. Demo Menu Categories
INSERT IGNORE INTO menu_categories (id, outlet_id, tenant_id, name, sort_order, status)
VALUES ('demo-cat-starters', 'demo-outlet-1', 'demo-admin-1', 'Starters', 1, 'ACTIVE');

INSERT IGNORE INTO menu_categories (id, outlet_id, tenant_id, name, sort_order, status)
VALUES ('demo-cat-main', 'demo-outlet-1', 'demo-admin-1', 'Main Course', 2, 'ACTIVE');

INSERT IGNORE INTO menu_categories (id, outlet_id, tenant_id, name, sort_order, status)
VALUES ('demo-cat-desserts', 'demo-outlet-1', 'demo-admin-1', 'Desserts', 3, 'ACTIVE');

INSERT IGNORE INTO menu_categories (id, outlet_id, tenant_id, name, sort_order, status)
VALUES ('demo-cat-beverages', 'demo-outlet-1', 'demo-admin-1', 'Beverages', 4, 'ACTIVE');

-- 12. Demo Menu Items
-- Starters
INSERT IGNORE INTO menu_items (id, outlet_id, tenant_id, category_id, name, description, is_veg, base_price, status)
VALUES ('demo-item-1', 'demo-outlet-1', 'demo-admin-1', 'demo-cat-starters', 'Paneer Tikka', 'Marinated cottage cheese grilled in tandoor', TRUE, 249.00, 'ACTIVE');

INSERT IGNORE INTO menu_items (id, outlet_id, tenant_id, category_id, name, description, is_veg, base_price, status)
VALUES ('demo-item-2', 'demo-outlet-1', 'demo-admin-1', 'demo-cat-starters', 'Chicken Seekh Kebab', 'Minced chicken skewers with aromatic spices', FALSE, 299.00, 'ACTIVE');

INSERT IGNORE INTO menu_items (id, outlet_id, tenant_id, category_id, name, description, is_veg, base_price, status)
VALUES ('demo-item-3', 'demo-outlet-1', 'demo-admin-1', 'demo-cat-starters', 'Crispy Corn', 'Golden fried corn kernels with masala seasoning', TRUE, 179.00, 'ACTIVE');

-- Main Course
INSERT IGNORE INTO menu_items (id, outlet_id, tenant_id, category_id, name, description, is_veg, base_price, status)
VALUES ('demo-item-4', 'demo-outlet-1', 'demo-admin-1', 'demo-cat-main', 'Butter Chicken', 'Tender chicken in rich tomato-butter gravy', FALSE, 349.00, 'ACTIVE');

INSERT IGNORE INTO menu_items (id, outlet_id, tenant_id, category_id, name, description, is_veg, base_price, status)
VALUES ('demo-item-5', 'demo-outlet-1', 'demo-admin-1', 'demo-cat-main', 'Dal Makhani', 'Slow-cooked black lentils in creamy sauce', TRUE, 249.00, 'ACTIVE');

INSERT IGNORE INTO menu_items (id, outlet_id, tenant_id, category_id, name, description, is_veg, base_price, status)
VALUES ('demo-item-6', 'demo-outlet-1', 'demo-admin-1', 'demo-cat-main', 'Hyderabadi Biryani', 'Fragrant basmati rice layered with spiced meat', FALSE, 399.00, 'ACTIVE');

INSERT IGNORE INTO menu_items (id, outlet_id, tenant_id, category_id, name, description, is_veg, base_price, status)
VALUES ('demo-item-7', 'demo-outlet-1', 'demo-admin-1', 'demo-cat-main', 'Palak Paneer', 'Cottage cheese cubes in creamy spinach gravy', TRUE, 269.00, 'ACTIVE');

INSERT IGNORE INTO menu_items (id, outlet_id, tenant_id, category_id, name, description, is_veg, base_price, status)
VALUES ('demo-item-8', 'demo-outlet-1', 'demo-admin-1', 'demo-cat-main', 'Garlic Naan', 'Freshly baked bread with garlic butter', TRUE, 69.00, 'ACTIVE');

-- Desserts
INSERT IGNORE INTO menu_items (id, outlet_id, tenant_id, category_id, name, description, is_veg, base_price, status)
VALUES ('demo-item-9', 'demo-outlet-1', 'demo-admin-1', 'demo-cat-desserts', 'Gulab Jamun', 'Soft milk dumplings in rose-cardamom syrup', TRUE, 129.00, 'ACTIVE');

INSERT IGNORE INTO menu_items (id, outlet_id, tenant_id, category_id, name, description, is_veg, base_price, status)
VALUES ('demo-item-10', 'demo-outlet-1', 'demo-admin-1', 'demo-cat-desserts', 'Rasmalai', 'Spongy cheese patties in saffron milk', TRUE, 149.00, 'ACTIVE');

-- Beverages
INSERT IGNORE INTO menu_items (id, outlet_id, tenant_id, category_id, name, description, is_veg, base_price, status)
VALUES ('demo-item-11', 'demo-outlet-1', 'demo-admin-1', 'demo-cat-beverages', 'Masala Chai', 'Traditional spiced Indian tea', TRUE, 49.00, 'ACTIVE');

INSERT IGNORE INTO menu_items (id, outlet_id, tenant_id, category_id, name, description, is_veg, base_price, status)
VALUES ('demo-item-12', 'demo-outlet-1', 'demo-admin-1', 'demo-cat-beverages', 'Mango Lassi', 'Chilled yogurt smoothie with Alphonso mango', TRUE, 99.00, 'ACTIVE');

-- 13. Demo Dining Tables
INSERT IGNORE INTO dining_tables (id, outlet_id, table_code, display_name, capacity, status, created_at, updated_at)
VALUES ('demo-table-1', 'demo-outlet-1', 'T1', 'Table 1', 4, 'ACTIVE', NOW(), NOW());

INSERT IGNORE INTO dining_tables (id, outlet_id, table_code, display_name, capacity, status, created_at, updated_at)
VALUES ('demo-table-2', 'demo-outlet-1', 'T2', 'Table 2', 4, 'ACTIVE', NOW(), NOW());

INSERT IGNORE INTO dining_tables (id, outlet_id, table_code, display_name, capacity, status, created_at, updated_at)
VALUES ('demo-table-3', 'demo-outlet-1', 'T3', 'Table 3', 6, 'ACTIVE', NOW(), NOW());

INSERT IGNORE INTO dining_tables (id, outlet_id, table_code, display_name, capacity, status, created_at, updated_at)
VALUES ('demo-table-4', 'demo-outlet-1', 'T4', 'Table 4', 2, 'ACTIVE', NOW(), NOW());

INSERT IGNORE INTO dining_tables (id, outlet_id, table_code, display_name, capacity, status, created_at, updated_at)
VALUES ('demo-table-5', 'demo-outlet-1', 'T5', 'Table 5', 8, 'ACTIVE', NOW(), NOW());
