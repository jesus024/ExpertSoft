const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 1. Total paid per customer
router.get('/total-paid', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                c.id,
                c.identification_number,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                c.email,
                COUNT(t.id) AS total_transactions,
                SUM(t.billed_amount) AS total_billed,
                SUM(t.paid_amount) AS total_paid,
                (SUM(t.billed_amount) - SUM(t.paid_amount)) AS total_balance
            FROM customers c
            LEFT JOIN transactions t ON c.id = t.customer_id
            GROUP BY c.id, c.identification_number, c.first_name, c.last_name, c.email
            ORDER BY total_paid DESC
        `);
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching total paid per customer:', error);
        res.status(500).json({ error: 'Failed to fetch total paid per customer' });
    }
});

// 2. Pending invoices with customer and transaction information
router.get('/pending-invoices', async (req, res) => {
    try {
        const [rows] = await db.execute(`
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
                t.status,
                t.transaction_date
            FROM transactions t
            JOIN customers c ON t.customer_id = c.id
            JOIN payment_platforms pp ON t.platform_id = pp.id
            WHERE t.status IN ('pending', 'partial')
            ORDER BY t.billing_period DESC, pending_amount DESC
        `);
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching pending invoices:', error);
        res.status(500).json({ error: 'Failed to fetch pending invoices' });
    }
});

// 3. Transactions by platform
router.get('/platform-transactions/:platform', async (req, res) => {
    try {
        const platform = req.params.platform;
        
        // Validate platform
        if (!['nequi', 'daviplata'].includes(platform.toLowerCase())) {
            return res.status(400).json({ 
                error: 'Invalid platform. Use "nequi" or "daviplata"' 
            });
        }

        const [rows] = await db.execute(`
            SELECT 
                t.invoice_number,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                c.email,
                c.phone,
                pp.name AS platform,
                t.billing_period,
                t.billed_amount,
                t.paid_amount,
                t.status,
                t.transaction_date
            FROM transactions t
            JOIN customers c ON t.customer_id = c.id
            JOIN payment_platforms pp ON t.platform_id = pp.id
            WHERE LOWER(pp.name) = LOWER(?)
            ORDER BY t.transaction_date DESC
        `, [platform]);
        
        res.json({
            platform: platform,
            total_transactions: rows.length,
            transactions: rows
        });
    } catch (error) {
        console.error('Error fetching platform transactions:', error);
        res.status(500).json({ error: 'Failed to fetch platform transactions' });
    }
});

// Get all platforms
router.get('/platforms', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM payment_platforms');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching platforms:', error);
        res.status(500).json({ error: 'Failed to fetch platforms' });
    }
});

module.exports = router;
