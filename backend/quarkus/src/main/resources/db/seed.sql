-- Seed data for FoodGrid POS
USE petpooja_db;

-- 1. Outlets
INSERT INTO outlets (id, name, timezone) 
VALUES ('outlet-1', 'Main Café Hub', 'Asia/Kolkata');

-- 2. Admin Users
-- Password: Souraj@123
INSERT INTO admin_users (id, outlet_id, email, password_hash, display_name, status)
VALUES ('admin-1', 'outlet-1', 'paulsouraj99@gmail.com', '$2a$12$DwPxcio1Yil7j9v2ldur4OgFyg0qReIuVN7YH.g3/XRjh2bfcsH8G', 'Souraj Paul', 'ACTIVE');

-- 3. Admin User Roles
INSERT INTO admin_user_roles (admin_user_id, role)
VALUES ('admin-1', 'ADMIN');

-- 4. POS Devices
INSERT INTO pos_devices (id, outlet_id, device_code, name)
VALUES ('device-1', 'outlet-1', 'POS-MAIN-001', 'Main Cash Counter');

-- 5. Employees
INSERT INTO employees (id, outlet_id, display_name, email, status)
VALUES ('emp-1', 'outlet-1', 'John Doe', 'john@foodgrid.com', 'ACTIVE');

-- 6. Employee Credentials
-- PIN: 1234 (Hash generated for demo)
INSERT INTO employee_credentials (employee_id, pin_hash, pin_updated_at)
VALUES ('emp-1', '$2a$12$6K0Y7mE9S7.K.E.K.E.K.EuLp1eDk1xS6ZJ8n/v8.m8rG3F.N.m.', NOW());

-- 7. Employee Roles
INSERT INTO employee_roles (employee_id, role)
VALUES ('emp-1', 'CASHIER');
