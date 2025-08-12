const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all customers
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM customers ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM customers WHERE id = ?',
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// Create new customer
router.post('/', async (req, res) => {
    try {
        const {
            identification_number,
            first_name,
            last_name,
            street_address,
            city,
            state,
            zip_code,
            phone,
            phone_extension,
            email
        } = req.body;

        // Validation
        if (!identification_number || !first_name || !last_name || !email) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const [result] = await db.execute(
            `INSERT INTO customers (
                identification_number, first_name, last_name, street_address, 
                city, state, zip_code, phone, phone_extension, email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [identification_number, first_name, last_name, street_address, 
             city, state, zip_code, phone, phone_extension || null, email]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Customer created successfully'
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Customer with this identification number or email already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create customer' });
        }
    }
});

// Update customer
router.put('/:id', async (req, res) => {
    try {
        const {
            identification_number,
            first_name,
            last_name,
            street_address,
            city,
            state,
            zip_code,
            phone,
            phone_extension,
            email
        } = req.body;

        // Validation
        if (!identification_number || !first_name || !last_name || !email) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        const [result] = await db.execute(
            `UPDATE customers SET 
                identification_number = ?, first_name = ?, last_name = ?, 
                street_address = ?, city = ?, state = ?, zip_code = ?, 
                phone = ?, phone_extension = ?, email = ?
            WHERE id = ?`,
            [identification_number, first_name, last_name, street_address, 
             city, state, zip_code, phone, phone_extension || null, email, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Error updating customer:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Customer with this identification number or email already exists' });
        } else {
            res.status(500).json({ error: 'Failed to update customer' });
        }
    }
});

// Delete customer
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM customers WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

module.exports = router;
