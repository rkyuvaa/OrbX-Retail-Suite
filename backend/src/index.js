require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const inventoryRoutes = require('./routes/inventory');
const posRoutes = require('./routes/pos');
const transferRoutes = require('./routes/transfers');
const productRoutes = require('./routes/products');

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

app.get('/', (req, res) => {
    res.send('Orbx Retail ERP API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
