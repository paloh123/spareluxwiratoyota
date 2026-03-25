CREATE DATABASE IF NOT EXISTS monitoring_order_part;
USE monitoring_order_part;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, 
  role ENUM('Admin', 'SA', 'Partsman') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no_order VARCHAR(50) NOT NULL UNIQUE,
  tgl_order DATE NOT NULL,
  no_rangka VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  no_polisi VARCHAR(20) NOT NULL,
  nama_pelanggan VARCHAR(150) NOT NULL,
  status ENUM('On Order', 'Partial', 'Completed', 'On Delivery', 'Overdue') NOT NULL DEFAULT 'On Order',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_parts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  no_part VARCHAR(50) NOT NULL,
  nama_part VARCHAR(150) NOT NULL,
  qty INT NOT NULL,
  etd DATE NOT NULL,
  eta DATE NOT NULL,
  ata DATE NULL,
  status_part ENUM('On Order', 'Received', 'Partial') NOT NULL DEFAULT 'On Order',
  sisa INT NOT NULL DEFAULT 0,
  suplai INT NOT NULL DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Insert Demo Admin
-- Password is 'password123' (bcrypt hash generated via bcryptjs)
INSERT IGNORE INTO users (name, email, password, role) VALUES 
('Super Admin', 'admin@toyota.dealer', '$2b$10$ZKWIMAdGBNMHNvXtzhR8NO016iHB2ji5FvX8WJxXtloifwFFBSIfO', 'Admin'),
('Service Advisor', 'sa@toyota.dealer', '$2b$10$ZKWIMAdGBNMHNvXtzhR8NO016iHB2ji5FvX8WJxXtloifwFFBSIfO', 'SA'),
('Partsman User', 'partsman@toyota.dealer', '$2b$10$ZKWIMAdGBNMHNvXtzhR8NO016iHB2ji5FvX8WJxXtloifwFFBSIfO', 'Partsman');

