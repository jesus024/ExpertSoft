# Database Schema Diagram

## Entity Relationship Diagram

The database follows a normalized structure with three main entities:

### 1. Payment Platforms (payment_platforms)
- **Primary Key**: id (INT, AUTO_INCREMENT)
- **Attributes**: 
  - name (VARCHAR(50), UNIQUE)
  - description (TEXT)
  - created_at (TIMESTAMP)

### 2. Customers (customers)
- **Primary Key**: id (INT, AUTO_INCREMENT)
- **Attributes**:
  - identification_number (VARCHAR(20), UNIQUE)
  - first_name (VARCHAR(100))
  - last_name (VARCHAR(100))
  - street_address (VARCHAR(255))
  - city (VARCHAR(100))
  - state (VARCHAR(100))
  - zip_code (VARCHAR(20))
  - phone (VARCHAR(20))
  - phone_extension (VARCHAR(10))
  - email (VARCHAR(255), UNIQUE)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

### 3. Transactions (transactions)
- **Primary Key**: id (INT, AUTO_INCREMENT)
- **Foreign Keys**:
  - customer_id → customers.id (CASCADE DELETE)
  - platform_id → payment_platforms.id (CASCADE DELETE)
- **Attributes**:
  - invoice_number (VARCHAR(20), UNIQUE)
  - billing_period (DATE)
  - billed_amount (DECIMAL(15,2))
  - paid_amount (DECIMAL(15,2))
  - transaction_date (TIMESTAMP)
  - status (ENUM: 'pending', 'partial', 'paid')
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

## Relationships
- **One-to-Many**: Payment Platform → Transactions
- **One-to-Many**: Customer → Transactions

## Views
1. **customer_transactions_summary**: Aggregated customer financial data
2. **pending_invoices**: All pending and partial invoices with customer details

## Normalization Applied
- **1NF**: Atomic values, no repeating groups
- **2NF**: No partial dependencies, all attributes depend on the full primary key
- **3NF**: No transitive dependencies, all attributes depend only on the primary key

## Indexes
- Customer identification number and email
- Transaction invoice number, customer ID, platform ID, billing period, and status
- Optimized for common query patterns
