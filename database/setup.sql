-- Database Setup Script for Financial Transaction Management System
-- Run this script to create the database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS pd_jesus_ariza_clan;
USE pd_jesus_ariza_clan;

-- Create tables
CREATE TABLE payment_platforms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    identification_number VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    phone_extension VARCHAR(10),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    platform_id INT NOT NULL,
    billing_period DATE NOT NULL,
    billed_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES payment_platforms(id) ON DELETE CASCADE
);

-- Insert default payment platforms
INSERT INTO payment_platforms (name, description) VALUES
('Nequi', 'Nequi digital wallet platform'),
('Daviplata', 'Daviplata digital payment platform');

-- Create indexes
CREATE INDEX idx_customers_identification ON customers(identification_number);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_number);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_platform ON transactions(platform_id);
CREATE INDEX idx_transactions_billing_period ON transactions(billing_period);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Create views
CREATE VIEW customer_transactions_summary AS
SELECT 
    c.id,
    c.identification_number,
    CONCAT(c.first_name, ' ', c.last_name) AS full_name,
    c.email,
    COUNT(t.id) AS total_transactions,
    SUM(t.billed_amount) AS total_billed,
    SUM(t.paid_amount) AS total_paid,
    (SUM(t.billed_amount) - SUM(t.paid_amount)) AS total_balance
FROM customers c
LEFT JOIN transactions t ON c.id = t.customer_id
GROUP BY c.id, c.identification_number, c.first_name, c.last_name, c.email;

CREATE VIEW pending_invoices AS
SELECT 
    t.invoice_number,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.email,
    c.phone,
    pp.name AS platform,
    t.billing_period,
    t.billed_amount,
    t.paid_amount,
    (t.billed_amount - t.paid_amount) AS pending_amount,
    t.status
FROM transactions t
JOIN customers c ON t.customer_id = c.id
JOIN payment_platforms pp ON t.platform_id = pp.id
WHERE t.status IN ('pending', 'partial')
ORDER BY t.billing_period DESC;

-- Show success message
SELECT 'Database setup completed successfully!' AS status;
