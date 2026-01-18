-- Seed data for FoodGrid POS
USE petpooja_db;

-- 1. Outlets
INSERT INTO outlets (id, name, timezone) 
VALUES ('outlet-1', 'Main Café Hub', 'Asia/Kolkata');

-- 2. Admin Users
-- Password for all users: Souraj@123

-- Tenant Admin (Super Admin - manages all tenants/clients)
INSERT INTO admin_users (id, outlet_id, email, password_hash, display_name, status)
VALUES ('admin-tenant-1', NULL, 'tenant@foodgrid.com', '$2a$12$DwPxcio1Yil7j9v2ldur4OgFyg0qReIuVN7YH.g3/XRjh2bfcsH8G', 'Tenant Admin', 'ACTIVE');

-- Client Admin (manages outlets and employees for a specific client)
INSERT INTO admin_users (id, outlet_id, email, password_hash, display_name, status)
VALUES ('admin-client-1', 'outlet-1', 'paulsouraj99@gmail.com', '$2a$12$DwPxcio1Yil7j9v2ldur4OgFyg0qReIuVN7YH.g3/XRjh2bfcsH8G', 'Souraj Paul', 'ACTIVE');

-- 3. Admin User Roles
-- Tenant Admin role
INSERT INTO admin_user_roles (admin_user_id, role)
VALUES ('admin-tenant-1', 'TENANT_ADMIN');

-- Client Admin role
INSERT INTO admin_user_roles (admin_user_id, role)
VALUES ('admin-client-1', 'CLIENT_ADMIN');

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
