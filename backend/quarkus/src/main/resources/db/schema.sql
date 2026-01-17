-- MySQL schema for FoodGrid POS (auth/shift module)
-- NOTE: This file is intended to be idempotent for fresh DB creation.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Admin users (backoffice) - Restaurant owners
CREATE TABLE IF NOT EXISTS admin_users (
  id CHAR(36) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_user_roles (
  admin_user_id CHAR(36) NOT NULL,
  role ENUM('ADMIN','MANAGER') NOT NULL,
  PRIMARY KEY (admin_user_id, role),
  CONSTRAINT fk_admin_user_roles_admin_user_id FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS outlets (
  id CHAR(36) NOT NULL,
  owner_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  timezone VARCHAR(64) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_outlets_owner_id (owner_id),
  CONSTRAINT fk_outlets_owner_id FOREIGN KEY (owner_id) REFERENCES admin_users(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_devices (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  device_code VARCHAR(64) NOT NULL,
  name VARCHAR(120) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pos_devices_device_code (device_code),
  KEY idx_pos_devices_outlet_id (outlet_id),
  CONSTRAINT fk_pos_devices_outlet_id FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employees (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by_admin_id CHAR(36) NULL,
  updated_by_admin_id CHAR(36) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employees_email (email),
  KEY idx_employees_outlet_id (outlet_id),
  KEY idx_employees_created_by (created_by_admin_id),
  KEY idx_employees_updated_by (updated_by_admin_id),
  CONSTRAINT fk_employees_outlet_id FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_employees_created_by_admin_id FOREIGN KEY (created_by_admin_id) REFERENCES admin_users(id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_employees_updated_by_admin_id FOREIGN KEY (updated_by_admin_id) REFERENCES admin_users(id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_credentials (
  employee_id CHAR(36) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  failed_pin_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  pin_updated_at DATETIME NULL,
  PRIMARY KEY (employee_id),
  CONSTRAINT fk_employee_credentials_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_roles (
  employee_id CHAR(36) NOT NULL,
  role ENUM('CASHIER','MANAGER','ADMIN') NOT NULL,
  PRIMARY KEY (employee_id, role),
  CONSTRAINT fk_employee_roles_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_shift_schedules (
  id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ess_employee_outlet (employee_id, outlet_id),
  KEY idx_ess_outlet_start (outlet_id, start_at),
  CONSTRAINT fk_ess_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_ess_outlet_id FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shifts (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  device_id CHAR(36) NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME NULL,
  status ENUM('ACTIVE','CLOSED') NOT NULL,
  PRIMARY KEY (id),
  KEY idx_shifts_outlet_employee_device_status (outlet_id, employee_id, device_id, status),
  CONSTRAINT fk_shifts_outlet_id FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_shifts_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_shifts_device_id FOREIGN KEY (device_id) REFERENCES pos_devices(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shift_sessions (
  id CHAR(36) NOT NULL,
  shift_id CHAR(36) NOT NULL,
  device_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_shift_sessions_shift_device (shift_id, device_id),
  KEY idx_shift_sessions_revoked (revoked_at),
  CONSTRAINT fk_shift_sessions_shift_id FOREIGN KEY (shift_id) REFERENCES shifts(id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_shift_sessions_device_id FOREIGN KEY (device_id) REFERENCES pos_devices(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pin_otp_challenges (
  id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  resend_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pin_otp_employee (employee_id),
  KEY idx_pin_otp_expires (expires_at),
  CONSTRAINT fk_pin_otp_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_pin_otp_outlet_id FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_categories (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_menu_categories_outlet (outlet_id, status, sort_order),
  CONSTRAINT fk_menu_categories_outlet_id FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  category_id CHAR(36) NULL,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(500) NULL,
  is_veg TINYINT(1) NOT NULL DEFAULT 0,
  base_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_menu_items_outlet (outlet_id, status),
  KEY idx_menu_items_category (category_id),
  CONSTRAINT fk_menu_items_outlet_id FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_menu_items_category_id FOREIGN KEY (category_id) REFERENCES menu_categories(id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dining_tables (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  table_code VARCHAR(64) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  capacity INT NOT NULL DEFAULT 0,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dining_tables_outlet_code (outlet_id, table_code),
  KEY idx_dining_tables_outlet (outlet_id, status),
  CONSTRAINT fk_dining_tables_outlet_id FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  device_id CHAR(36) NOT NULL,
  shift_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  table_id CHAR(36) NULL,
  order_type ENUM('DINE_IN','TAKEAWAY','DELIVERY') NOT NULL,
  status ENUM('OPEN','KOT_SENT','SERVED','BILLED','PAID','CANCELLED') NOT NULL DEFAULT 'OPEN',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notes VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_outlet_status_created (outlet_id, status, created_at),
  KEY idx_orders_shift (shift_id),
  KEY idx_orders_employee (employee_id),
  KEY idx_orders_table (table_id),
  CONSTRAINT fk_orders_outlet_id FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_orders_device_id FOREIGN KEY (device_id) REFERENCES pos_devices(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_orders_shift_id FOREIGN KEY (shift_id) REFERENCES shifts(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_orders_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_orders_table_id FOREIGN KEY (table_id) REFERENCES dining_tables(id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id CHAR(36) NOT NULL,
  order_id CHAR(36) NOT NULL,
  item_id CHAR(36) NOT NULL,
  item_name VARCHAR(160) NOT NULL,
  qty DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  status ENUM('OPEN','CANCELLED') NOT NULL DEFAULT 'OPEN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_item (item_id),
  CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_order_items_item_id FOREIGN KEY (item_id) REFERENCES menu_items(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) NOT NULL,
  order_id CHAR(36) NOT NULL,
  method ENUM('CASH','CARD','UPI') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('CAPTURED','VOID') NOT NULL DEFAULT 'CAPTURED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_order (order_id),
  CONSTRAINT fk_payments_order_id FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;