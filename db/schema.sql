-- MySQL schema for FoodGrid POS (auth/shift module)
-- NOTE: This file is intended to be idempotent for fresh DB creation.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS outlets (
  id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  timezone VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin users (backoffice)
CREATE TABLE IF NOT EXISTS admin_users (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_email (email),
  KEY idx_admin_users_outlet_id (outlet_id),
  CONSTRAINT fk_admin_users_outlet_id FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_user_roles (
  admin_user_id CHAR(36) NOT NULL,
  role ENUM('ADMIN','MANAGER') NOT NULL,
  PRIMARY KEY (admin_user_id, role),
  CONSTRAINT fk_admin_user_roles_admin_user_id FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
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
  started_at DATETIME NOT NULL,
  ended_at DATETIME NULL,
  status ENUM('ACTIVE','CLOSED') NOT NULL,
  PRIMARY KEY (id),
  KEY idx_shifts_outlet_employee_status (outlet_id, employee_id, status),
  CONSTRAINT fk_shifts_outlet_id FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_shifts_employee_id FOREIGN KEY (employee_id) REFERENCES employees(id)
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

-- =====================================================
-- MENU MANAGEMENT SYSTEM
-- =====================================================

-- Menu Categories (Starters, Main Course, Desserts, etc.)
CREATE TABLE IF NOT EXISTS menu_categories (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NULL,
  name VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_menu_categories_outlet (outlet_id),
  CONSTRAINT fk_menu_categories_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu Items (Dishes)
CREATE TABLE IF NOT EXISTS menu_items (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NULL,
  category_id CHAR(36) NULL,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(500) NULL,
  is_veg BOOLEAN NOT NULL DEFAULT FALSE,
  base_price DECIMAL(12,2) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_menu_items_outlet (outlet_id),
  KEY idx_menu_items_category (category_id),
  CONSTRAINT fk_menu_items_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_menu_items_category FOREIGN KEY (category_id) REFERENCES menu_categories(id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menu Item Images (Multiple images per dish)
CREATE TABLE IF NOT EXISTS menu_item_images (
  id CHAR(36) NOT NULL,
  menu_item_id CHAR(36) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_menu_item_images_item (menu_item_id),
  CONSTRAINT fk_menu_item_images_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INGREDIENT MANAGEMENT SYSTEM
-- =====================================================

-- Ingredient Categories (Fresh Produce, Meat & Poultry, Seafood, Dairy & Eggs, Dry Goods, etc.)
CREATE TABLE IF NOT EXISTS ingredient_categories (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  icon VARCHAR(50) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ingredient_categories_outlet_name (outlet_id, name),
  KEY idx_ingredient_categories_outlet (outlet_id),
  CONSTRAINT fk_ingredient_categories_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Units of Measurement (kg, g, L, ml, pcs, dozen, etc.)
CREATE TABLE IF NOT EXISTS units_of_measure (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  abbreviation VARCHAR(10) NOT NULL,
  unit_type ENUM('WEIGHT','VOLUME','COUNT','LENGTH') NOT NULL,
  base_unit_id CHAR(36) NULL,
  conversion_factor DECIMAL(15,6) NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_units_outlet_name (outlet_id, name),
  KEY idx_units_outlet (outlet_id),
  CONSTRAINT fk_units_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_units_base_unit FOREIGN KEY (base_unit_id) REFERENCES units_of_measure(id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(120) NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(30) NULL,
  address TEXT NULL,
  notes TEXT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_suppliers_outlet (outlet_id),
  CONSTRAINT fk_suppliers_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ingredients (Raw Materials)
CREATE TABLE IF NOT EXISTS ingredients (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  category_id CHAR(36) NULL,
  sku VARCHAR(50) NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  
  -- Unit of Measurement
  unit_id CHAR(36) NOT NULL,
  
  -- Pricing
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  
  -- Can this ingredient be sold directly as a menu item? (e.g., Curd, Buttermilk)
  is_sellable BOOLEAN NOT NULL DEFAULT FALSE,
  selling_price DECIMAL(12,2) NULL,
  linked_menu_item_id CHAR(36) NULL,
  
  -- Inventory Settings
  track_inventory BOOLEAN NOT NULL DEFAULT TRUE,
  current_stock DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
  reorder_level DECIMAL(15,4) NULL,
  reorder_quantity DECIMAL(15,4) NULL,
  max_stock_level DECIMAL(15,4) NULL,
  
  -- Shelf Life
  shelf_life_days INT NULL,
  storage_instructions TEXT NULL,
  
  -- Default Supplier
  default_supplier_id CHAR(36) NULL,
  
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ingredients_outlet_sku (outlet_id, sku),
  KEY idx_ingredients_outlet (outlet_id),
  KEY idx_ingredients_category (category_id),
  KEY idx_ingredients_supplier (default_supplier_id),
  KEY idx_ingredients_sellable (is_sellable),
  CONSTRAINT fk_ingredients_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_ingredients_category FOREIGN KEY (category_id) REFERENCES ingredient_categories(id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_ingredients_unit FOREIGN KEY (unit_id) REFERENCES units_of_measure(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_ingredients_supplier FOREIGN KEY (default_supplier_id) REFERENCES suppliers(id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_ingredients_menu_item FOREIGN KEY (linked_menu_item_id) REFERENCES menu_items(id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ingredient-Supplier relationship (many-to-many with pricing)
CREATE TABLE IF NOT EXISTS ingredient_suppliers (
  id CHAR(36) NOT NULL,
  ingredient_id CHAR(36) NOT NULL,
  supplier_id CHAR(36) NOT NULL,
  supplier_sku VARCHAR(50) NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  min_order_quantity DECIMAL(15,4) NULL,
  lead_time_days INT NULL,
  is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ingredient_supplier (ingredient_id, supplier_id),
  KEY idx_ingredient_suppliers_ingredient (ingredient_id),
  KEY idx_ingredient_suppliers_supplier (supplier_id),
  CONSTRAINT fk_ingredient_suppliers_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_ingredient_suppliers_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recipe: Ingredients required to make a Menu Item (Dish)
CREATE TABLE IF NOT EXISTS menu_item_recipes (
  id CHAR(36) NOT NULL,
  menu_item_id CHAR(36) NOT NULL,
  ingredient_id CHAR(36) NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  unit_id CHAR(36) NOT NULL,
  notes VARCHAR(500) NULL,
  is_optional BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_recipe_item_ingredient (menu_item_id, ingredient_id),
  KEY idx_recipe_menu_item (menu_item_id),
  KEY idx_recipe_ingredient (ingredient_id),
  CONSTRAINT fk_recipe_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_recipe_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_recipe_unit FOREIGN KEY (unit_id) REFERENCES units_of_measure(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock Movements (Purchases, Usage, Wastage, Adjustments, Transfers)
CREATE TABLE IF NOT EXISTS stock_movements (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  ingredient_id CHAR(36) NOT NULL,
  movement_type ENUM('PURCHASE','USAGE','WASTAGE','ADJUSTMENT','TRANSFER_IN','TRANSFER_OUT','RETURN','OPENING_STOCK') NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  unit_id CHAR(36) NOT NULL,
  unit_cost DECIMAL(12,2) NULL,
  total_cost DECIMAL(12,2) NULL,
  
  -- Reference to related records
  reference_type VARCHAR(50) NULL,
  reference_id CHAR(36) NULL,
  
  -- For purchases
  supplier_id CHAR(36) NULL,
  purchase_order_number VARCHAR(50) NULL,
  invoice_number VARCHAR(50) NULL,
  
  -- For wastage
  wastage_reason VARCHAR(500) NULL,
  
  -- Stock balance after this movement
  stock_before DECIMAL(15,4) NOT NULL,
  stock_after DECIMAL(15,4) NOT NULL,
  
  notes TEXT NULL,
  recorded_by_employee_id CHAR(36) NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_stock_movements_outlet (outlet_id),
  KEY idx_stock_movements_ingredient (ingredient_id),
  KEY idx_stock_movements_type (movement_type),
  KEY idx_stock_movements_date (recorded_at),
  KEY idx_stock_movements_supplier (supplier_id),
  CONSTRAINT fk_stock_movements_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_stock_movements_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_stock_movements_unit FOREIGN KEY (unit_id) REFERENCES units_of_measure(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_stock_movements_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_stock_movements_employee FOREIGN KEY (recorded_by_employee_id) REFERENCES employees(id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock Alerts (Low stock, expiring soon, etc.)
CREATE TABLE IF NOT EXISTS stock_alerts (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  ingredient_id CHAR(36) NOT NULL,
  alert_type ENUM('LOW_STOCK','OUT_OF_STOCK','EXPIRING_SOON','EXPIRED','OVERSTOCKED') NOT NULL,
  message VARCHAR(500) NOT NULL,
  current_stock DECIMAL(15,4) NULL,
  threshold_value DECIMAL(15,4) NULL,
  is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_by_employee_id CHAR(36) NULL,
  acknowledged_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_stock_alerts_outlet (outlet_id),
  KEY idx_stock_alerts_ingredient (ingredient_id),
  KEY idx_stock_alerts_type (alert_type),
  KEY idx_stock_alerts_acknowledged (is_acknowledged),
  CONSTRAINT fk_stock_alerts_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_stock_alerts_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_stock_alerts_employee FOREIGN KEY (acknowledged_by_employee_id) REFERENCES employees(id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  supplier_id CHAR(36) NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery_date DATE NULL,
  status ENUM('DRAFT','SUBMITTED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  created_by_employee_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_purchase_orders_outlet_number (outlet_id, order_number),
  KEY idx_purchase_orders_outlet (outlet_id),
  KEY idx_purchase_orders_supplier (supplier_id),
  KEY idx_purchase_orders_status (status),
  KEY idx_purchase_orders_date (order_date),
  CONSTRAINT fk_purchase_orders_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_purchase_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_purchase_orders_employee FOREIGN KEY (created_by_employee_id) REFERENCES employees(id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id CHAR(36) NOT NULL,
  purchase_order_id CHAR(36) NOT NULL,
  ingredient_id CHAR(36) NOT NULL,
  quantity_ordered DECIMAL(15,4) NOT NULL,
  quantity_received DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
  unit_id CHAR(36) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  notes VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_po_items_order (purchase_order_id),
  KEY idx_po_items_ingredient (ingredient_id),
  CONSTRAINT fk_po_items_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_po_items_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_po_items_unit FOREIGN KEY (unit_id) REFERENCES units_of_measure(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Count (Physical stock take)
CREATE TABLE IF NOT EXISTS inventory_counts (
  id CHAR(36) NOT NULL,
  outlet_id CHAR(36) NOT NULL,
  count_date DATE NOT NULL,
  status ENUM('IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
  notes TEXT NULL,
  started_by_employee_id CHAR(36) NULL,
  completed_by_employee_id CHAR(36) NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_counts_outlet (outlet_id),
  KEY idx_inventory_counts_date (count_date),
  KEY idx_inventory_counts_status (status),
  CONSTRAINT fk_inventory_counts_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_inventory_counts_started_by FOREIGN KEY (started_by_employee_id) REFERENCES employees(id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_inventory_counts_completed_by FOREIGN KEY (completed_by_employee_id) REFERENCES employees(id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Count Items
CREATE TABLE IF NOT EXISTS inventory_count_items (
  id CHAR(36) NOT NULL,
  inventory_count_id CHAR(36) NOT NULL,
  ingredient_id CHAR(36) NOT NULL,
  system_quantity DECIMAL(15,4) NOT NULL,
  counted_quantity DECIMAL(15,4) NULL,
  variance DECIMAL(15,4) NULL,
  variance_reason VARCHAR(500) NULL,
  counted_by_employee_id CHAR(36) NULL,
  counted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_count_items (inventory_count_id, ingredient_id),
  KEY idx_count_items_count (inventory_count_id),
  KEY idx_count_items_ingredient (ingredient_id),
  CONSTRAINT fk_count_items_count FOREIGN KEY (inventory_count_id) REFERENCES inventory_counts(id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_count_items_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_count_items_employee FOREIGN KEY (counted_by_employee_id) REFERENCES employees(id)
    ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;