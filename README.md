# Financial Transaction Management System

## Description
This system manages financial transaction data from Fintech platforms (Nequi and Daviplata) for the Colombian electrical sector. It provides a normalized database structure, CRUD operations, and advanced queries for financial analysis.

## Technologies Used
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: HTML, CSS (Bootstrap), JavaScript
- **Data Processing**: CSV parsing and bulk loading

## Project Structure
```
├── database/
│   ├── schema.sql
│   └── data.csv
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── postman/
│   └── collection.json
└── README.md
```

## Installation and Setup

### Prerequisites
- MySQL Server
- Node.js (v14 or higher)
- npm

### Database Setup
1. Create MySQL database:
```sql
CREATE DATABASE pd_jesus_ariza_clan_Ciénaga;
```

2. Import schema:
```bash
mysql -u username -p pd_jesus_ariza_clan_Ciénaga < database/schema.sql
```

### Backend Setup
1. Navigate to backend directory:
```bash
cd backend
npm install
```

2. Configure database connection in `config/database.js`

3. Start server:
```bash
npm start
```

### Frontend Setup
1. Open `frontend/index.html` in a web browser
2. The dashboard will connect to the backend API

## Data Normalization

### 1NF (First Normal Form)
- Removed repetitive transaction type column
- Separated composite address into street, city, state, zip
- Separated phone and extension

### 2NF (Second Normal Form)
- Created separate tables for customers, transactions, and payment platforms
- Removed partial dependencies

### 3NF (Third Normal Form)
- Eliminated transitive dependencies
- Customer information only depends on customer ID
- Transaction details only depend on transaction ID

## Bulk Data Loading
The system supports CSV data loading through:
1. Manual script execution
2. Frontend button trigger
3. API endpoint (bonus feature)

## Advanced Queries
1. **Total paid per customer**: Shows total amount paid by each customer
2. **Pending invoices**: Lists unpaid invoices with customer and transaction details
3. **Transactions by platform**: Shows all transactions from a specific platform

## API Endpoints

### CRUD Operations
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Advanced Queries
- `GET /api/queries/total-paid` - Total paid per customer
- `GET /api/queries/pending-invoices` - Pending invoices
- `GET /api/queries/platform-transactions/:platform` - Transactions by platform

## Developer Information
- **Name**: Jesus Ariza
- **Clan**: Ciénaga
- **Email**: jesus.ariza@gmail.com

## Screenshots
- Database schema diagram
- Frontend dashboard
- API testing in Postman
