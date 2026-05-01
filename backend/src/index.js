require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const initDB = async () => {
    const schema = `
        CREATE TABLE IF NOT EXISTS departments (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            permissions JSONB DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS branches (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            location TEXT,
            address TEXT,
            is_warehouse BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role_id INTEGER REFERENCES roles(id),
            branch_id INTEGER REFERENCES branches(id),
            department_id INTEGER REFERENCES departments(id),
            allowed_branches JSONB DEFAULT '[]',
            allowed_modules JSONB DEFAULT '{}',
            is_superadmin BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS salespersons (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE,
            phone VARCHAR(20),
            branch_id INTEGER REFERENCES branches(id),
            commission_percent DECIMAL(5, 2) DEFAULT 0,
            target_amount DECIMAL(12, 2) DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO roles (name) VALUES ('Admin') ON CONFLICT DO NOTHING;
        INSERT INTO roles (name) VALUES ('Warehouse') ON CONFLICT DO NOTHING;
        INSERT INTO roles (name) VALUES ('Branch User') ON CONFLICT DO NOTHING;
    `;
    try {
        await pool.query(schema);
        console.log('Database initialized');
    } catch (err) {
        console.error('Database init error:', err.message);
    }
};

const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const inventoryRoutes = require('./routes/inventory');
const posRoutes = require('./routes/pos');
const transferRoutes = require('./routes/transfers');
const productRoutes = require('./routes/products');
const usersRoutes = require('./routes/users');
const branchesRoutes = require('./routes/branches');
const rolesRoutes = require('./routes/roles');
const departmentsRoutes = require('./routes/departments');
const salespersonsRoutes = require('./routes/salespersons');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/salespersons', salespersonsRoutes);

app.get('/', (req, res) => {
    res.send('Orbx Retail ERP API is running...');
});

app.listen(PORT, async () => {
    await initDB();
    console.log(`Server running on port ${PORT}`);
});
