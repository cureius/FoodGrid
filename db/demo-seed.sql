-- Demo Seed Script for FoodGrid

-- 1. Demo Client
INSERT INTO clients (id, name, email, phone, status, created_at)
VALUES ('demo-client-1', 'The Demo Cafe', 'admin@democafe.com', '9876543210', 'ACTIVE', NOW());

-- 2. Demo Outlet
INSERT INTO outlets (id, client_id, name, address, city, status, created_at)
VALUES ('demo-outlet-1', 'demo-client-1', 'Main Street Branch', '123 Tech Park, Pune', 'Pune', 'ACTIVE', NOW());

-- 3. Demo Employees
INSERT INTO staff_members (id, outlet_id, name, role, status, created_at)
VALUES 
('demo-emp-cashier', 'demo-outlet-1', 'Demo Cashier', 'CASHIER', 'ACTIVE', NOW()),
('demo-emp-kitchen', 'demo-outlet-1', 'Demo Chef', 'KITCHEN', 'ACTIVE', NOW()),
('demo-emp-manager', 'demo-outlet-1', 'Demo Manager', 'MANAGER', 'ACTIVE', NOW());

-- 4. Demo Customer
INSERT INTO customers (id, name, phone, email, created_at)
VALUES ('demo-customer-1', 'Demo Guest', '9000000000', 'guest@demo.com', NOW());

-- 5. Menu Categories
INSERT INTO menu_categories (outlet_id, name, display_order)
VALUES 
('demo-outlet-1', 'Quick Bites', 1),
('demo-outlet-1', 'Beverages', 2),
('demo-outlet-1', 'Indian Mains', 3),
('demo-outlet-1', 'Desserts', 4);

-- 6. Menu Items (Linking logic depends on sequence/id, using placeholders for clarity)
-- Note: Assuming table names and structure based on standard POS
INSERT INTO menu_items (outlet_id, name, description, price, category_name, is_veg, status)
VALUES 
('demo-outlet-1', 'Paneer Tikka Pizza', 'Tandoori paneer with bell peppers', 349.00, 'Quick Bites', true, 'AVAILABLE'),
('demo-outlet-1', 'Masala Chai', 'Traditional Indian spiced tea', 45.00, 'Beverages', true, 'AVAILABLE'),
('demo-outlet-1', 'Butter Chicken', 'Classic creamy tomato gravy chicken', 420.00, 'Indian Mains', false, 'AVAILABLE'),
('demo-outlet-1', 'Gulab Jamun', 'Warm milk solid dumplings in syrup', 120.00, 'Desserts', true, 'AVAILABLE');

-- 7. Dining Tables
INSERT INTO dining_tables (outlet_id, table_number, capacity, status)
VALUES 
('demo-outlet-1', 'T1', 4, 'AVAILABLE'),
('demo-outlet-1', 'T2', 2, 'AVAILABLE'),
('demo-outlet-1', 'T3', 6, 'AVAILABLE');
