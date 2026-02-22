require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

connectDB();
const app = express();

app.use(helmet());
app.use(cors({
    origin: [
        'https://storefront-inicial.vercel.app',
        'https://admin-inicial.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174',
    ],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

app.get('/api/health', (req, res) => res.json({ success: true }));
app.get('/', (req, res) => res.json({ message: '🚚 Rossa Repuestos API v2' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚚 Rossa Repuestos API corriendo en puerto ${PORT}`);
});

module.exports = app;
