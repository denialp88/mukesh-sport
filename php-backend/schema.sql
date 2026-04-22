-- Mukesh Sport - MySQL Schema
-- Import this via phpMyAdmin

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','staff') DEFAULT 'staff',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE customers (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  address TEXT NULL,
  photo_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE installment_plans (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  customer_id CHAR(36) NOT NULL,
  created_by CHAR(36) NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NULL,
  brand VARCHAR(100) NULL,
  model VARCHAR(100) NULL,
  total_price DECIMAL(10,2) NOT NULL,
  down_payment DECIMAL(10,2) DEFAULT 0,
  remaining_balance DECIMAL(10,2) NOT NULL,
  total_installments INT NOT NULL,
  installment_amount DECIMAL(10,2) NOT NULL,
  frequency ENUM('weekly','monthly','custom') DEFAULT 'monthly',
  start_date DATE NOT NULL,
  status ENUM('active','completed','defaulted') DEFAULT 'active',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE installments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  plan_id CHAR(36) NOT NULL,
  installment_number INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE NULL,
  paid_amount DECIMAL(10,2) NULL,
  payment_mode ENUM('cash','upi','bank_transfer','other') NULL,
  status ENUM('pending','paid','overdue') DEFAULT 'pending',
  receipt_note TEXT NULL,
  recorded_by CHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES installment_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

CREATE TABLE repair_jobs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  job_id VARCHAR(20) NOT NULL UNIQUE,
  tracking_token VARCHAR(40) NOT NULL UNIQUE,
  customer_id CHAR(36) NOT NULL,
  created_by CHAR(36) NULL,
  item_name VARCHAR(255) NOT NULL,
  problem_description TEXT NULL,
  item_photo_url VARCHAR(500) NULL,
  estimated_cost DECIMAL(10,2) NULL,
  final_cost DECIMAL(10,2) NULL,
  estimated_completion DATE NULL,
  received_date DATE NOT NULL DEFAULT (CURDATE()),
  completed_date DATE NULL,
  delivered_date DATE NULL,
  status ENUM('received','in_progress','ready_for_pickup','delivered') DEFAULT 'received',
  payment_received TINYINT(1) DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE repair_status_history (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  repair_job_id CHAR(36) NOT NULL,
  updated_by CHAR(36) NULL,
  status ENUM('received','in_progress','ready_for_pickup','delivered') NOT NULL,
  note TEXT NULL,
  photo_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repair_job_id) REFERENCES repair_jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Insert admin user (password: Mukesh@321)
-- bcrypt hash for Mukesh@321
INSERT INTO users (id, name, phone, password, role) VALUES
(UUID(), 'Admin', '7265937875', '$2y$10$8K1p/a0dN1LXqw7K8YqHqeQwP1pRqLGn0eUb5V5fN8kqZ3qXqZ3qW', 'admin');
