const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { hashPassword, verifyPassword, generateToken, verifyToken } = require('../utils/auth');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Initial Setup (Seed Admin & Roles)
router.post('/setup', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if already setup
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCount.rows[0].count) > 0) {
            return res.status(400).json({ error: 'System already initialized' });
        }

        // 1. Create Default Roles
        const adminRole = await client.query(
            "INSERT INTO roles (name, permissions) VALUES ($1, $2) RETURNING id",
            ['Administrator', JSON.stringify({ all: true })]
        );
        const warehouseRole = await client.query(
            "INSERT INTO roles (name, permissions) VALUES ($1, $2) RETURNING id",
            ['Warehouse Manager', JSON.stringify({ warehouse: true, inventory: true })]
        );
        const branchRole = await client.query(
            "INSERT INTO roles (name, permissions) VALUES ($1, $2) RETURNING id",
            ['Branch User', JSON.stringify({ pos: true, inventory: true })]
        );

        // 2. Create Default HQ Branch
        const hqBranch = await client.query(
            "INSERT INTO branches (name, location, is_warehouse) VALUES ($1, $2, $3) RETURNING id",
            ['Head Office & Warehouse', 'Main City', true]
        );

        // 3. Create Superadmin User
        const hashedPassword = await hashPassword('admin123');
        const adminUser = await client.query(
            `INSERT INTO users (name, email, password_hash, role_id, branch_id, is_superadmin, allowed_modules)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [
                'Admin', 
                'admin@orbx.com', 
                hashedPassword, 
                adminRole.rows[0].id, 
                hqBranch.rows[0].id, 
                true, 
                JSON.stringify(['dashboard', 'pos', 'products', 'inventory', 'transfers', 'customers', 'reports', 'settings'])
            ]
        );

        await client.query('COMMIT');
        res.json({ 
            message: 'Setup complete', 
            admin: { email: 'admin@orbx.com', password: 'admin123' } 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Setup failed', details: error.message });
    } finally {
        client.release();
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await verifyPassword(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        const token = generateToken({ id: user.id, email: user.email });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

// Get Current User (Me)
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    try {
        const result = await pool.query(
            `SELECT u.*, r.name as role_name, b.name as branch_name 
             FROM users u 
             LEFT JOIN roles r ON u.role_id = r.id 
             LEFT JOIN branches b ON u.branch_id = b.id 
             WHERE u.id = $1`, 
            [decoded.id]
        );
        const user = result.rows[0];
        if (!user) return res.status(404).json({ error: 'User not found' });

        delete user.password_hash;
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user', details: error.message });
    }
});

module.exports = router;
