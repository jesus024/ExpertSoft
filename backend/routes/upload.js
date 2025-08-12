const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'data-' + Date.now() + '.csv');
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// Upload and process CSV file
router.post('/csv', upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const results = [];
        const filePath = req.file.path;

        // Parse CSV file
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    await processCSVData(results);
                    
                    // Clean up uploaded file
                    fs.unlinkSync(filePath);
                    
                    res.json({
                        message: 'CSV data processed successfully',
                        recordsProcessed: results.length
                    });
                } catch (error) {
                    // Clean up uploaded file on error
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    throw error;
                }
            });

    } catch (error) {
        console.error('Error processing CSV:', error);
        res.status(500).json({ error: 'Failed to process CSV file' });
    }
});

// Process CSV data and insert into database
async function processCSVData(data) {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        for (const row of data) {
            // Extract customer information
            const customerData = {
                identification_number: row['Numero de Identificacion'] || row['G'],
                first_name: extractFirstName(row['Nombre del Cliente'] || row['F']),
                last_name: extractLastName(row['Nombre del Cliente'] || row['F']),
                street_address: extractStreetAddress(row['Direccion'] || row['H']),
                city: extractCity(row['Direccion'] || row['H']),
                state: extractState(row['Direccion'] || row['H']),
                zip_code: extractZipCode(row['Direccion'] || row['H']),
                phone: extractPhone(row['Telefono'] || row['I']),
                phone_extension: extractPhoneExtension(row['Telefono'] || row['I']),
                email: row['Correo Electronico'] || row['J']
            };

            // Extract transaction information
            const transactionData = {
                invoice_number: row['Numero de Factura'] || row['L'],
                platform_name: row['Plataforma Utilizada'] || row['K'],
                billing_period: parseBillingPeriod(row['Periodo de Facturacion'] || row['M']),
                billed_amount: parseFloat(row['Monto Facturado'] || row['N'] || 0),
                paid_amount: parseFloat(row['Monto Pagado'] || row['O'] || 0)
            };

            // Insert or update customer
            let customerId = await getOrCreateCustomer(connection, customerData);
            
            // Insert transaction
            await insertTransaction(connection, customerId, transactionData);
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Helper functions for data extraction
function extractFirstName(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    return parts[0] || '';
}

function extractLastName(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    return parts.slice(1).join(' ') || '';
}

function extractStreetAddress(address) {
    if (!address) return '';
    // Extract street address (everything before the city)
    const cityIndex = address.indexOf(',');
    if (cityIndex > 0) {
        return address.substring(0, cityIndex).trim();
    }
    return address.trim();
}

function extractCity(address) {
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length >= 2) {
        return parts[1].trim();
    }
    return '';
}

function extractState(address) {
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length >= 3) {
        return parts[2].trim();
    }
    return '';
}

function extractZipCode(address) {
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length >= 4) {
        return parts[3].trim();
    }
    return '';
}

function extractPhone(phone) {
    if (!phone) return '';
    // Remove extension if present
    const phoneParts = phone.split('x');
    return phoneParts[0].trim();
}

function extractPhoneExtension(phone) {
    if (!phone) return '';
    const phoneParts = phone.split('x');
    if (phoneParts.length > 1) {
        return phoneParts[1].trim();
    }
    return null;
}

function parseBillingPeriod(period) {
    if (!period) return new Date();
    // Convert YYYY-MM to Date
    const [year, month] = period.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1);
}

// Database operations
async function getOrCreateCustomer(connection, customerData) {
    // Check if customer exists
    const [existing] = await connection.execute(
        'SELECT id FROM customers WHERE identification_number = ?',
        [customerData.identification_number]
    );

    if (existing.length > 0) {
        return existing[0].id;
    }

    // Create new customer
    const [result] = await connection.execute(
        `INSERT INTO customers (
            identification_number, first_name, last_name, street_address, 
            city, state, zip_code, phone, phone_extension, email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            customerData.identification_number,
            customerData.first_name,
            customerData.last_name,
            customerData.street_address,
            customerData.city,
            customerData.state,
            customerData.zip_code,
            customerData.phone,
            customerData.phone_extension,
            customerData.email
        ]
    );

    return result.insertId;
}

async function insertTransaction(connection, customerId, transactionData) {
    // Get platform ID
    const [platforms] = await connection.execute(
        'SELECT id FROM payment_platforms WHERE LOWER(name) = LOWER(?)',
        [transactionData.platform_name]
    );

    if (platforms.length === 0) {
        throw new Error(`Platform not found: ${transactionData.platform_name}`);
    }

    const platformId = platforms[0].id;

    // Determine status
    let status = 'pending';
    if (transactionData.paid_amount >= transactionData.billed_amount) {
        status = 'paid';
    } else if (transactionData.paid_amount > 0) {
        status = 'partial';
    }

    // Insert transaction
    await connection.execute(
        `INSERT INTO transactions (
            invoice_number, customer_id, platform_id, billing_period, 
            billed_amount, paid_amount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            transactionData.invoice_number,
            customerId,
            platformId,
            transactionData.billing_period,
            transactionData.billed_amount,
            transactionData.paid_amount,
            status
        ]
    );
}

module.exports = router;
